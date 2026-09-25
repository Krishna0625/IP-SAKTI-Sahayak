from __future__ import annotations

from typing import Any

from app.services.llm_service import LLMService


def _evidence() -> list[dict[str, Any]]:
    return [
        {
            "text": "The retrieved source evidence describes patent assessment.",
            "metadata": {
                "title": "Patents Act",
                "source_id": "SRC-001",
                "authority": "Government of India",
            },
        }
    ]


def _service() -> LLMService:
    service = object.__new__(LLMService)
    service.knowledge_graph = None
    return service


def test_prompt_without_graph_context_preserves_evidence():
    prompt = _service()._build_grounded_prompt(
        query="What is a patent?",
        evidence=_evidence(),
        jurisdiction="india",
        language="en",
    )

    assert "Patents Act" in prompt
    assert "KNOWLEDGE GRAPH CONTEXT" in prompt
    assert '"entities"' not in prompt


def test_patent_tk_query_adds_separate_graph_context():
    service = _service()
    context = {
        "entities": [
            {
                "id": "traditional_knowledge",
                "name": "Traditional Knowledge",
            }
        ],
        "relationships": [
            {
                "source": "traditional_knowledge",
                "relation": "relevant_to",
                "target": "patentability",
            }
        ],
    }

    prompt = service._build_grounded_prompt(
        query="Can traditional knowledge be patented?",
        evidence=_evidence(),
        jurisdiction="india",
        language="en",
        graph_context=context,
    )

    assert "Traditional Knowledge" in prompt
    assert "relevant_to" in prompt
    assert "NOT authoritative legal evidence" in prompt
    assert "Patents Act" in prompt


def test_unrelated_query_does_not_add_graph_dump():
    prompt = _service()._build_grounded_prompt(
        query="What is the weather today?",
        evidence=_evidence(),
        jurisdiction="india",
        language="en",
        graph_context={},
    )

    assert "What is the weather today?" in prompt
    assert '"relationships"' not in prompt
    assert '"traditional_knowledge"' not in prompt


def test_graph_failure_falls_back_to_existing_rag_flow():
    service = _service()
    service.knowledge_graph = type(
        "FailingGraph",
        (),
        {
            "get_context_for_query": lambda self, query: (
                (_ for _ in ()).throw(RuntimeError("graph unavailable"))
            )
        },
    )()
    service.rag_service = type(
        "RagStub",
        (),
        {
            "_last_evidence": _evidence(),
            "answer_query": lambda self, **kwargs: {
                "answer": "fallback",
                "confidence": 0.7,
                "key_points": ["Review prior art"],
                "sources": [{"id": "SRC-001"}],
            },
        },
    )()
    service.client = None

    response = service.generate_response(
        query="Can I patent this?",
        jurisdiction="india",
        language="en",
    )

    assert response["confidence"] == 0.7
    assert response["sources"] == [{"id": "SRC-001"}]
    assert response["answer"]
