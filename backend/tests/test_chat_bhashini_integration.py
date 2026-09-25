from __future__ import annotations

import asyncio

import pytest

from app.api import chat
from app.multilingual.bhashini import BhashiniTranslationError
from app.schemas.chat import ChatRequest


ENGLISH_RESPONSE = {
    "answer": "Grounded answer (EVIDENCE 1).",
    "confidence": 0.82,
    "key_points": ["Review prior art"],
    "sources": [
        {
            "id": "SRC-001",
            "url": "https://example.test/source",
            "page": 15,
            "section": "Section 3",
        }
    ],
    "disclaimer": "This information is not legal advice.",
}


class TranslatorStub:
    def __init__(self) -> None:
        self.input_calls: list[tuple[str, str]] = []
        self.output_calls: list[tuple[str, str]] = []

    def translate_to_english(self, text: str, language: str) -> str:
        self.input_calls.append((text, language))
        return "Can traditional knowledge be patented?"

    def translate_from_english(self, text: str, language: str) -> str:
        self.output_calls.append((text, language))
        return f"{language}-translated answer"


class FailingInputTranslator(TranslatorStub):
    def translate_to_english(self, text: str, language: str) -> str:
        raise BhashiniTranslationError("unavailable")


class FailingOutputTranslator(TranslatorStub):
    def translate_from_english(self, text: str, language: str) -> str:
        raise BhashiniTranslationError("unavailable")


@pytest.fixture
def patched_services(monkeypatch):
    calls: list[dict[str, str]] = []

    def generate_response(**kwargs):
        calls.append(kwargs)
        return dict(ENGLISH_RESPONSE)

    monkeypatch.setattr(
        chat.llm_service,
        "generate_response",
        generate_response,
    )
    return calls


def test_english_does_not_call_bhashini(monkeypatch, patched_services):
    translator = TranslatorStub()
    monkeypatch.setattr(chat, "bhashini_translator", translator)

    response = asyncio.run(
        chat.post_chat(
            ChatRequest(
                query="What is traditional knowledge?",
                language="en",
            )
        )
    )

    assert response.answer == ENGLISH_RESPONSE["answer"]
    assert translator.input_calls == []
    assert translator.output_calls == []
    assert patched_services[0]["query"] == "What is traditional knowledge?"
    assert patched_services[0]["language"] == "en"


@pytest.mark.parametrize(
    "language",
    ["hi", "te", "ta", "kn", "ml", "bn"],
)
def test_supported_language_translates_at_chat_boundary(
    monkeypatch,
    patched_services,
    language,
):
    translator = TranslatorStub()
    monkeypatch.setattr(chat, "bhashini_translator", translator)

    response = asyncio.run(
        chat.post_chat(
            ChatRequest(
                query="translated-language query",
                language=language,
            )
        )
    )

    assert response.answer == f"{language}-translated answer"
    assert translator.input_calls == [
        ("translated-language query", language)
    ]
    assert translator.output_calls == [
        (ENGLISH_RESPONSE["answer"], language)
    ]
    assert patched_services[0]["query"] == (
        "Can traditional knowledge be patented?"
    )
    assert patched_services[0]["language"] == "en"
    assert response.confidence == ENGLISH_RESPONSE["confidence"]
    assert response.sources == ENGLISH_RESPONSE["sources"]


def test_input_translation_failure_uses_original_query(
    monkeypatch,
    patched_services,
):
    monkeypatch.setattr(
        chat,
        "bhashini_translator",
        FailingInputTranslator(),
    )

    response = asyncio.run(
        chat.post_chat(
            ChatRequest(
                query="original Telugu query",
                language="te",
            )
        )
    )

    assert response.answer == ENGLISH_RESPONSE["answer"]
    assert patched_services[0]["query"] == "original Telugu query"
    assert patched_services[0]["language"] == "te"


def test_output_translation_failure_returns_english_answer(
    monkeypatch,
    patched_services,
):
    monkeypatch.setattr(
        chat,
        "bhashini_translator",
        FailingOutputTranslator(),
    )

    response = asyncio.run(
        chat.post_chat(
            ChatRequest(
                query="translated-language query",
                language="hi",
            )
        )
    )

    assert response.answer == ENGLISH_RESPONSE["answer"]
    assert response.confidence == ENGLISH_RESPONSE["confidence"]
    assert response.sources == ENGLISH_RESPONSE["sources"]


def test_unsupported_language_keeps_existing_flow(
    monkeypatch,
    patched_services,
):
    translator = TranslatorStub()
    monkeypatch.setattr(chat, "bhashini_translator", translator)

    response = asyncio.run(
        chat.post_chat(
            ChatRequest(
                query="existing language query",
                language="mr",
            )
        )
    )

    assert response.answer == ENGLISH_RESPONSE["answer"]
    assert translator.input_calls == []
    assert translator.output_calls == []
    assert patched_services[0]["query"] == "existing language query"
    assert patched_services[0]["language"] == "mr"
