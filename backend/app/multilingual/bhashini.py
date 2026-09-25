from __future__ import annotations

import logging
import os
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

CONFIG_ENDPOINT = (
    "https://meity-auth.ulcacontrib.org/"
    "ulca/apis/v0/model/getModelsPipeline"
)
INFERENCE_ENDPOINT = (
    "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
)
SUPPORTED_LANGUAGES = frozenset({
    "en",
    "hi",
    "te",
    "ta",
    "kn",
    "ml",
    "bn",
})


class BhashiniTranslationError(RuntimeError):
    """Raised when Bhashini cannot translate text safely."""

    def __init__(
        self,
        message: str,
        *,
        diagnostics: dict[str, Any] | None = None,
    ) -> None:
        self.diagnostics = diagnostics or {}
        super().__init__(message)


class BhashiniTranslator:
    """Small synchronous Bhashini text-translation client."""

    def __init__(
        self,
        *,
        user_id: str | None = None,
        api_key: str | None = None,
        pipeline_id: str | None = None,
        udyat_key: str | None = None,
        inference_key: str | None = None,
        config_endpoint: str = CONFIG_ENDPOINT,
        inference_endpoint: str = INFERENCE_ENDPOINT,
        timeout: float = 15.0,
        client: httpx.Client | None = None,
    ) -> None:
        self.user_id = (
            user_id if user_id is not None else os.getenv("BHASHINI_USER_ID")
        )
        self.api_key = (
            api_key if api_key is not None else os.getenv("BHASHINI_API_KEY")
        )
        self.pipeline_id = (
            pipeline_id
            if pipeline_id is not None
            else os.getenv("BHASHINI_PIPELINE_ID")
        )
        self.udyat_key = (
            udyat_key
            if udyat_key is not None
            else os.getenv("BHASHINI_UDYAT_KEY")
        )
        self.inference_key = (
            inference_key
            if inference_key is not None
            else os.getenv("BHASHINI_INFERENCE_KEY")
        )
        self.enabled = os.getenv("BHASHINI_ENABLED", "true").lower() == "true"
        self.config_endpoint = config_endpoint
        self.inference_endpoint = inference_endpoint
        self.timeout = timeout
        self._client = client

    def detect_language(self, text: str) -> str:
        """Return the caller-selected language; BHASHINI has no documented text detector here."""
        del text
        raise BhashiniTranslationError(
            "BHASHINI text language detection is not configured."
        )

    def translate_to_english(self, text: str, source_language: str) -> str:
        return self.translate(text, source_language, "en")

    def translate_from_english(self, text: str, target_language: str) -> str:
        return self.translate(text, "en", target_language)

    def translate_text(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> str:
        return self.translate(text, source_language, target_language)

    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> str:
        source = self._validate_language(source_language)
        target = self._validate_language(target_language)

        if source == target or not text:
            return text

        self._validate_credentials()
        config = self._get_pipeline_config(source, target)
        return self._compute_translation(
            text=text,
            source_language=source,
            target_language=target,
            config=config,
        )

    @staticmethod
    def _validate_language(language: str) -> str:
        normalized = language.lower().strip()
        if normalized not in SUPPORTED_LANGUAGES:
            raise BhashiniTranslationError(
                f"Unsupported language: {normalized}"
            )
        return normalized

    def _validate_credentials(self) -> None:
        if not self.enabled:
            raise BhashiniTranslationError(
                "BHASHINI integration is disabled."
            )
        if not self.pipeline_id:
            raise BhashiniTranslationError(
                "BHASHINI pipeline ID is not configured."
            )
        if not self.user_id or not self.api_key:
            raise BhashiniTranslationError(
                "BHASHINI pipeline configuration requires documented "
                "userID and ulcaApiKey credentials."
            )

    def _request(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        client = self._client
        if client is not None:
            return client.request(method, url, timeout=self.timeout, **kwargs)

        with httpx.Client(timeout=self.timeout) as managed_client:
            return managed_client.request(
                method,
                url,
                **kwargs,
            )

    @staticmethod
    def _sanitize_message(message: str) -> str:
        sanitized = str(message or "")
        sanitized = re.sub(
            r"(?i)(authorization|userID|ulcaApiKey|udyatKey|inferenceKey|api[_-]?key|token|cookie)\s*[:=]\s*[^,;\s]+",
            r"\1=[REDACTED]",
            sanitized,
        )
        return sanitized[:300]

    @classmethod
    def _error_diagnostics(
        cls,
        exc: Exception | None = None,
        *,
        response: httpx.Response | None = None,
        category: str,
    ) -> dict[str, Any]:
        diagnostics: dict[str, Any] = {"category": category}

        if response is not None:
            diagnostics["http_status"] = response.status_code
            try:
                data = response.json()
            except (ValueError, TypeError):
                data = None
            if isinstance(data, dict):
                error = data.get("error")
                if isinstance(error, dict):
                    data = error
                for key in ("code", "errorCode", "error_code"):
                    value = data.get(key)
                    if isinstance(value, (str, int)):
                        diagnostics["error_code"] = cls._sanitize_message(
                            str(value)
                        )
                        break
                message = data.get("message")
                if isinstance(message, str) and message.strip():
                    diagnostics["message"] = cls._sanitize_message(message)

        if isinstance(exc, httpx.HTTPStatusError):
            diagnostics.setdefault(
                "http_status",
                exc.response.status_code,
            )
        elif isinstance(exc, httpx.TimeoutException):
            diagnostics["category"] = "timeout"
        elif isinstance(exc, httpx.RequestError):
            diagnostics["category"] = "network_error"

        if exc is not None and "message" not in diagnostics:
            detail = str(exc).strip()
            if detail:
                diagnostics["message"] = cls._sanitize_message(detail)

        return diagnostics

    @classmethod
    def _translation_error(
        cls,
        message: str,
        *,
        exc: Exception | None = None,
        response: httpx.Response | None = None,
        category: str,
    ) -> BhashiniTranslationError:
        return BhashiniTranslationError(
            message,
            diagnostics=cls._error_diagnostics(
                exc,
                response=response,
                category=category,
            ),
        )

    def _get_pipeline_config(
        self,
        source_language: str,
        target_language: str,
    ) -> dict[str, Any]:
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_language,
                            "targetLanguage": target_language,
                        }
                    },
                }
            ],
            "pipelineRequestConfig": {
                "pipelineId": self.pipeline_id,
            },
        }

        try:
            headers = {
                "userID": self.user_id,
                "ulcaApiKey": self.api_key,
            }
            response = self._request(
                "POST",
                self.config_endpoint,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Bhashini pipeline configuration failed.")
            response = (
                exc.response
                if isinstance(exc, httpx.HTTPStatusError)
                else None
            )
            raise self._translation_error(
                "Bhashini pipeline configuration failed.",
                exc=exc,
                response=response,
                category="configuration_error",
            ) from exc

        try:
            pipeline = data["pipelineResponseConfig"]
            translation_config = next(
                item for item in pipeline
                if item.get("taskType") == "translation"
            )
            service = next(
                item for item in translation_config["config"]
                if item.get("language", {}).get("sourceLanguage")
                == source_language
                and item.get("language", {}).get("targetLanguage")
                == target_language
            )
            endpoint = data["pipelineInferenceAPIEndPoint"]
            callback_url = endpoint["callbackUrl"]
            inference_key = endpoint["inferenceApiKey"]
            return {
                "callback_url": callback_url,
                "inference_header": {
                    inference_key["name"]: inference_key["value"],
                },
                "service_id": service["serviceId"],
            }
        except (KeyError, StopIteration, TypeError) as exc:
            logger.warning("Bhashini pipeline configuration was malformed.")
            raise self._translation_error(
                "Bhashini pipeline configuration was malformed.",
                exc=exc,
                category="malformed_response",
            ) from exc

    def _compute_translation(
        self,
        *,
        text: str,
        source_language: str,
        target_language: str,
        config: dict[str, Any],
    ) -> str:
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_language,
                            "targetLanguage": target_language,
                        },
                        "serviceId": config["service_id"],
                    },
                }
            ],
            "inputData": {
                "input": [{"source": text}],
            },
        }

        try:
            response = self._request(
                "POST",
                config["callback_url"],
                headers=config["inference_header"],
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Bhashini translation request failed.")
            response = (
                exc.response
                if isinstance(exc, httpx.HTTPStatusError)
                else None
            )
            raise self._translation_error(
                "Bhashini translation request failed.",
                exc=exc,
                response=response,
                category="translation_error",
            ) from exc

        if isinstance(data, dict) and isinstance(data.get("error"), dict):
            raise self._translation_error(
                "Bhashini returned a provider error.",
                response=response,
                category="provider_error",
            )

        try:
            translated = data["pipelineResponse"][0]["output"][0]["target"]
        except (KeyError, IndexError, TypeError) as exc:
            logger.warning("Bhashini translation response was malformed.")
            raise self._translation_error(
                "Bhashini translation response was malformed.",
                exc=exc,
                category="malformed_response",
            ) from exc

        if not isinstance(translated, str) or not translated.strip():
            raise self._translation_error(
                "Bhashini returned empty translated text.",
                category="empty_response",
            )
        return translated
