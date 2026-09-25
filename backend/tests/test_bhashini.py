from __future__ import annotations

import httpx
import pytest

from app.multilingual.bhashini import (
    CONFIG_ENDPOINT,
    BhashiniTranslationError,
    BhashiniTranslator,
)


CALLBACK_URL = "https://example.test/translate"
SERVICE_ID = "translation-service"


def _translator(handler) -> BhashiniTranslator:
    return BhashiniTranslator(
        user_id="test-user",
        api_key="test-key",
        pipeline_id="test-pipeline",
        client=httpx.Client(
            transport=httpx.MockTransport(handler),
        ),
    )


def _handler(request: httpx.Request) -> httpx.Response:
    if request.url == httpx.URL(CONFIG_ENDPOINT):
        return httpx.Response(
            200,
            json={
                "pipelineResponseConfig": [
                    {
                        "taskType": "translation",
                        "config": [
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "te",
                                    "targetLanguage": "en",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "hi",
                                    "targetLanguage": "en",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "ta",
                                    "targetLanguage": "en",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "te",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "hi",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "ta",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "kn",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "ml",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "en",
                                    "targetLanguage": "bn",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "kn",
                                    "targetLanguage": "en",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "ml",
                                    "targetLanguage": "en",
                                },
                            },
                            {
                                "serviceId": SERVICE_ID,
                                "language": {
                                    "sourceLanguage": "bn",
                                    "targetLanguage": "en",
                                },
                            },
                        ],
                    }
                ],
                "pipelineInferenceAPIEndPoint": {
                    "callbackUrl": CALLBACK_URL,
                    "inferenceApiKey": {
                        "name": "Authorization",
                        "value": "test-inference-key",
                    },
                },
            },
        )
    return httpx.Response(
        200,
        json={
            "pipelineResponse": [
                {
                    "taskType": "translation",
                    "output": [{"source": "source", "target": "translated"}],
                }
            ],
        },
    )


@pytest.mark.parametrize(
    "language",
    ["te", "hi", "ta", "kn", "ml", "bn"],
)
def test_to_english_uses_verified_payload(language: str):
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return _handler(request)

    result = _translator(handler).translate_to_english("source", language)

    assert result == "translated"
    assert requests[0].headers["userID"] == "test-user"
    assert requests[0].headers["ulcaApiKey"] == "test-key"
    compute_payload = requests[1].content.decode()
    assert '"taskType":"translation"' in compute_payload
    assert f'"sourceLanguage":"{language}"' in compute_payload
    assert '"targetLanguage":"en"' in compute_payload
    assert '"source":"source"' in compute_payload


@pytest.mark.parametrize(
    "language",
    ["te", "hi", "ta", "kn", "ml", "bn"],
)
def test_from_english_parses_translation(language: str):
    result = _translator(_handler).translate_from_english(
        "source",
        language,
    )

    assert result == "translated"


def test_english_is_not_sent_to_bhashini():
    def fail(_: httpx.Request) -> httpx.Response:
        raise AssertionError("English must not call Bhashini")

    translator = _translator(fail)
    assert translator.translate_to_english("same", "en") == "same"
    assert translator.translate_from_english("same", "en") == "same"


def test_unsupported_language_and_missing_credentials_fail_safely():
    with pytest.raises(BhashiniTranslationError, match="Unsupported"):
        _translator(_handler).translate_to_english("text", "fr")

    translator = BhashiniTranslator(
        user_id="",
        api_key="",
        pipeline_id="",
    )
    with pytest.raises(BhashiniTranslationError, match="pipeline ID"):
        translator.translate_to_english("text", "te")


def test_udyat_fields_are_not_reinterpreted_as_legacy_credentials():
    translator = BhashiniTranslator(
        udyat_key="udyat-secret",
        inference_key="inference-secret",
        pipeline_id="configured-pipeline",
        user_id="",
        api_key="",
    )

    with pytest.raises(BhashiniTranslationError, match="userID"):
        translator.translate_to_english("text", "te")


def test_missing_pipeline_id_fails_without_pipeline_search():
    translator = BhashiniTranslator(
        user_id="test-user",
        api_key="test-key",
        pipeline_id="",
    )

    with pytest.raises(BhashiniTranslationError, match="pipeline ID"):
        translator.translate_to_english("text", "te")


def test_disabled_bhashini_fails_before_network_call(monkeypatch):
    monkeypatch.setenv("BHASHINI_ENABLED", "false")
    translator = BhashiniTranslator(
        user_id="test-user",
        api_key="test-key",
        pipeline_id="test-pipeline",
    )

    with pytest.raises(BhashiniTranslationError, match="disabled"):
        translator.translate_to_english("text", "te")


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(503),
        httpx.Response(200, content=b"not-json"),
    ],
)
def test_http_and_malformed_config_errors(response: httpx.Response):
    def handler(_: httpx.Request) -> httpx.Response:
        return response

    with pytest.raises(BhashiniTranslationError):
        _translator(handler).translate_to_english("text", "te")


def test_timeout_and_malformed_translation_are_safe():
    def timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out")

    with pytest.raises(BhashiniTranslationError):
        _translator(timeout).translate_to_english("text", "te")

    def malformed(request: httpx.Request) -> httpx.Response:
        response = _handler(request)
        if request.url == httpx.URL(CALLBACK_URL):
            return httpx.Response(200, json={"pipelineResponse": []})
        return response

    with pytest.raises(BhashiniTranslationError):
        _translator(malformed).translate_to_english("text", "te")


def test_http_error_exposes_status_and_sanitized_provider_details():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url == httpx.URL(CONFIG_ENDPOINT):
            return httpx.Response(
                503,
                json={
                    "error": {
                        "code": "DHRUVA_BUSY",
                        "message": "temporary provider failure",
                    }
                },
            )
        return _handler(request)

    with pytest.raises(BhashiniTranslationError) as error:
        _translator(handler).translate_from_english("source", "kn")

    assert error.value.diagnostics == {
        "category": "configuration_error",
        "http_status": 503,
        "error_code": "DHRUVA_BUSY",
        "message": "temporary provider failure",
    }


def test_structured_dhruva_error_exposes_code_without_raw_body():
    def handler(request: httpx.Request) -> httpx.Response:
        response = _handler(request)
        if request.url == httpx.URL(CALLBACK_URL):
            return httpx.Response(
                200,
                json={
                    "error": {
                        "code": "TRANSLATION_FAILED",
                        "message": "translation failed",
                        "apiKey": "secret-api-key",
                    }
                },
            )
        return response

    with pytest.raises(BhashiniTranslationError) as error:
        _translator(handler).translate_from_english("source", "kn")

    assert error.value.diagnostics == {
        "category": "provider_error",
        "http_status": 200,
        "error_code": "TRANSLATION_FAILED",
        "message": "translation failed",
    }
    assert "secret-api-key" not in str(error.value)


def test_timeout_exposes_timeout_category():
    def timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("request timed out")

    with pytest.raises(BhashiniTranslationError) as error:
        _translator(timeout).translate_from_english("source", "kn")

    assert error.value.diagnostics == {
        "category": "timeout",
        "message": "request timed out",
    }


def test_malformed_response_exposes_malformed_category():
    def malformed(request: httpx.Request) -> httpx.Response:
        response = _handler(request)
        if request.url == httpx.URL(CALLBACK_URL):
            return httpx.Response(200, json={"pipelineResponse": []})
        return response

    with pytest.raises(BhashiniTranslationError) as error:
        _translator(malformed).translate_from_english("source", "kn")

    assert error.value.diagnostics["category"] == "malformed_response"
    assert "raw" not in error.value.diagnostics


def test_kannada_translation_success_has_no_diagnostics():
    translator = _translator(_handler)

    assert translator.translate_from_english("source", "kn") == "translated"
