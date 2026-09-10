"""Gemini-backed service for grounded RAG responses."""

from __future__ import annotations

import logging
import os
from typing import Any

from dotenv import load_dotenv
from google import genai

from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

# Load backend/.env
load_dotenv()


class LLMService:
    def __init__(self) -> None:
        self.enabled = True
        self.rag_service = RAGService()

        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv(
            "GEMINI_MODEL",
            "gemini-2.5-flash",
        )

        self.client = None

        if self.api_key:
            self.client = genai.Client(
                api_key=self.api_key
            )
        else:
            logger.warning(
                "GEMINI_API_KEY is not configured. "
                "Gemini generation will be disabled."
            )

    def _build_grounded_prompt(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        jurisdiction: str,
        language: str,
    ) -> str:
        """Build a strict prompt using only retrieved RAG evidence."""

        evidence_text: list[str] = []

        for index, item in enumerate(evidence[:6], start=1):
            metadata = item.get("metadata") or {}

            title = metadata.get("title", "Official document")
            source = metadata.get("source", "")
            page = metadata.get("page", "")
            content = (
                item.get("text")
                or item.get("content")
                or item.get("document")
                or ""
            )

            evidence_text.append(
                f"""
EVIDENCE {index}
Title: {title}
Source: {source}
Page: {page}
Content:
{content}
""".strip()
            )

        combined_evidence = "\n\n".join(evidence_text)

        language_instruction = (
            "Respond in English."
            if language.lower() in {"en", "english"}
            else f"Respond in the requested language: {language}."
        )

        return f"""
You are the AI Sahayak assistant for IP-SAKTI Sahayak.

Your role is to provide preliminary, evidence-grounded guidance
about intellectual property, traditional knowledge, biodiversity,
ABS, AYUSH and related regulatory matters.

IMPORTANT RULES:

1. Use ONLY the retrieved evidence provided below.
2. Do NOT invent laws, sections, rules, treaties, cases, dates,
   authorities, citations or facts.
3. If the evidence does not contain enough information to answer,
   clearly say that reliable evidence was not found in the available
   knowledge base.
4. Do not present the answer as legal advice.
5. Do not make a definitive legal determination of patentability.
6. For patent-related questions, distinguish between evidence
   relevant to novelty, inventive step, traditional knowledge,
   biological resources and statutory requirements.
7. For traditional knowledge, identify possible relevance or
   prior-art signals only. Do not claim definitive
   unpatentability unless the evidence explicitly establishes it.
8. For ABS matters, provide preliminary compliance guidance only.
9. Keep India and international frameworks distinct.
10. Do not mention information that is not supported by the evidence.
11. Be concise and easy for an innovator to understand.
12. Cite the evidence by referring to the document title/source
    when making important claims.

Jurisdiction:
{jurisdiction}

Requested language:
{language}

User question:
{query}

Retrieved evidence:
{combined_evidence}

{language_instruction}

Return a clear response with:

- Direct answer
- Key considerations
- Recommended next step

End with:
"This information is not legal advice."
""".strip()

    def _generate_with_gemini(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        jurisdiction: str,
        language: str,
    ) -> str:
        """Generate a grounded answer using Gemini."""

        if not self.client:
            raise RuntimeError(
                "Gemini client is not configured."
            )

        prompt = self._build_grounded_prompt(
            query=query,
            evidence=evidence,
            jurisdiction=jurisdiction,
            language=language,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        text = getattr(response, "text", None)

        if not text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return text.strip()

    def generate_response(
        self,
        query: str,
        jurisdiction: str = "india",
        language: str = "en",
        innovation_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a response using existing RAG evidence
        and Gemini.

        If Gemini fails, fall back to the existing
        retrieval-based answer.
        """

        # First run the existing RAG pipeline.
        rag_response = self.rag_service.answer_query(
            query=query,
            jurisdiction=jurisdiction,
            language=language,
            innovation_id=innovation_id,
        )

        # Get the evidence retrieved by RAG.
        evidence = self.rag_service._last_evidence

        # If RAG found no evidence, return its safe response.
        if not evidence:
            return rag_response

        # If Gemini is unavailable, preserve the existing
        # working RAG response.
        if not self.client:
            return rag_response

        try:
            generated_answer = self._generate_with_gemini(
                query=query,
                evidence=evidence,
                jurisdiction=jurisdiction,
                language=language,
            )

            return {
                "answer": generated_answer,
                "confidence": rag_response.get(
                    "confidence",
                    0.0,
                ),
                "key_points": rag_response.get(
                    "key_points",
                    [],
                ),
                "sources": rag_response.get(
                    "sources",
                    [],
                ),
                "disclaimer": (
                    "This information is not legal advice."
                ),
            }

        except Exception as exc:
            logger.exception(
                "Gemini generation failed. "
                "Falling back to RAG response: %s",
                exc,
            )

            return rag_response