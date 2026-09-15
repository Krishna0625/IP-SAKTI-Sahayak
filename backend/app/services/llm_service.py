"""Gemini-backed service for grounded RAG responses."""

from __future__ import annotations

import logging
import os
import re
from typing import Any, Literal

from dotenv import load_dotenv
from google import genai

from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

# Load backend/.env
load_dotenv()

ResponseMode = Literal[
    "simple",
    "detailed",
    "technical",
]


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

    # ==============================================================
    # RESPONSE MODE INSTRUCTIONS
    # ==============================================================

    @staticmethod
    def _get_response_mode_instruction(
        response_mode: ResponseMode,
    ) -> str:
        """
        Return response-style instructions for Gemini.
        """

        if response_mode == "simple":
            return """
RESPONSE MODE: SIMPLE

Audience:
- Practitioners
- Students
- First-time IP users
- MSMEs
- Non-specialists

Style:
- Use plain, easy-to-understand language.
- Keep the response concise: approximately 80-120 words.
- Explain necessary legal/IP terminology briefly.
- Focus on the practical meaning of the evidence.
- Avoid unnecessary procedural or technical detail.
- Prefer short paragraphs and concise bullets where useful.
- Do not use headings such as "Direct Answer",
  "Key Considerations", or "Recommended Next Step".
""".strip()

        if response_mode == "technical":
            return """
RESPONSE MODE: TECHNICAL

Audience:
- Patent professionals
- IP researchers
- Legal/technical researchers
- Experienced innovators

Style:
- Use precise IP and legal terminology.
- Provide approximately 250-400 words when the evidence supports it.
- Identify relevant statutory provisions only when supported by evidence.
- Distinguish clearly between:
  * statutory exclusions
  * novelty
  * inventive step
  * prior art
  * traditional knowledge
  * biodiversity/ABS considerations
  * procedural requirements
- Explain the evidentiary basis of important claims.
- Distinguish what the evidence establishes from matters requiring
  further examination.
- Do not give a definitive legal opinion.
- Do not use headings such as "Direct Answer",
  "Key Considerations", or "Recommended Next Step".
""".strip()

        return """
RESPONSE MODE: DETAILED

Audience:
- Innovators
- Researchers
- Startup founders
- Practitioners seeking practical context

Style:
- Provide approximately 150-250 words when the evidence supports it.
- Give a clear and useful explanation.
- Mention important statutory provisions only when supported by evidence.
- Explain practical implications.
- Define unfamiliar legal/IP terminology briefly.
- Include a practical next step only when the evidence supports one.
- Avoid unnecessary technical or procedural complexity.
- Do not use headings such as "Direct Answer",
  "Key Considerations", or "Recommended Next Step".
""".strip()

    # ==============================================================
    # GROUNDED PROMPT
    # ==============================================================

    def _build_grounded_prompt(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        jurisdiction: str,
        language: str,
        response_mode: ResponseMode = "detailed",
    ) -> str:
        """
        Build a strict evidence-grounded Gemini prompt.
        """

        evidence_text: list[str] = []

        for index, item in enumerate(
            evidence[:6],
            start=1,
        ):
            metadata = item.get("metadata") or {}

            title = metadata.get(
                "title",
                "Official document",
            )

            source = (
                metadata.get("source")
                or metadata.get("source_id")
                or ""
            )

            page = metadata.get(
                "page",
                "",
            )

            section = metadata.get(
                "section",
                "",
            )

            authority = metadata.get(
                "authority",
                "",
            )

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
Authority: {authority}
Section/Rule: {section}
Page: {page}
Content:
{content}
""".strip()
            )

        combined_evidence = "\n\n".join(
            evidence_text
        )

        # ----------------------------------------------------------
        # Language
        # ----------------------------------------------------------

        if language.lower() in {
            "en",
            "english",
        }:
            language_instruction = "Respond in English."
        else:
            language_instruction = (
                "Respond in the requested language: "
                f"{language}."
            )

        # ----------------------------------------------------------
        # Response mode
        # ----------------------------------------------------------

        response_mode_instruction = (
            self._get_response_mode_instruction(
                response_mode
            )
        )

        # ----------------------------------------------------------
        # Prompt
        # ----------------------------------------------------------

        return f"""
You are the AI Sahayak assistant for IP-SAKTI Sahayak.

Your role is to provide preliminary, evidence-grounded guidance
about intellectual property, traditional knowledge, biodiversity,
ABS, AYUSH and related regulatory matters.

You are NOT a lawyer and must NOT present your answer as legal advice.

============================================================
STRICT EVIDENCE RULES
============================================================

1. Use ONLY the retrieved evidence provided below.

2. Do NOT invent:
   - laws
   - sections
   - rules
   - articles
   - treaties
   - cases
   - dates
   - authorities
   - procedures
   - government requirements
   - factual claims

3. If the retrieved evidence is insufficient to answer an important
   part of the question, explicitly say that the available knowledge
   base does not contain enough evidence for that part.

4. Do not use general world knowledge to fill evidence gaps.

5. Every important legal or factual claim must be tied to the
   corresponding evidence number, for example:
   (EVIDENCE 1)

6. Only attach an evidence number to a claim when that evidence
   actually supports the claim.

7. When referring to a statutory provision, mention its section,
   article or rule only when that provision is visible in the
   retrieved evidence.

8. Prefer concise paraphrasing. Quote statutory language only when
   the exact wording is important.

============================================================
LEGAL CAUTION
============================================================

9. Do not make a definitive legal determination about:
   - patentability
   - infringement
   - validity
   - ownership
   - regulatory compliance

   unless the retrieved evidence itself explicitly establishes
   that specific point.

10. For patent questions, distinguish among:
    - statutory exclusions
    - novelty
    - inventive step
    - prior art
    - traditional knowledge
    - biodiversity/ABS requirements
    - procedural requirements

11. When discussing traditional knowledge, distinguish between:
    a) a statutory exclusion supported by the evidence, and
    b) a possible prior-art or examination issue.

12. Do NOT automatically say:
    - "the patent will be rejected"
    - "the invention cannot be patented"
    - "the application will fail"
    - "the applicant will be refused"

    unless the retrieved evidence explicitly establishes that exact
    conclusion.

13. When Section 3(p) or another statutory exclusion is supported,
    prefer careful wording such as:

    "The evidence indicates that this subject matter falls within
    the statutory exclusion described in Section 3(p)."

    Do not broaden that statement beyond what the evidence establishes.

14. When discussing prior art or traditional knowledge, use wording
    such as:
    - "may be relevant to prior-art analysis"
    - "may require further examination"
    - "the evidence identifies a potential overlap"

    unless the evidence explicitly establishes more.

15. Keep India and international frameworks separate.

16. For ABS matters, provide preliminary guidance only.

============================================================
ANSWER STYLE
============================================================

17. Answer the user's actual question directly first.

18. Do NOT generate these headings:
    - Direct Answer
    - Key Considerations
    - Recommended Next Step
    - Conclusion

19. The frontend already provides the response structure.

20. Do NOT repeat the question.

21. Do NOT add unnecessary greetings.

22. Do NOT add a separate "Disclaimer" heading.

23. End the response with exactly:

This information is not legal advice.

============================================================
RESPONSE MODE
============================================================

{response_mode_instruction}

============================================================
JURISDICTION
============================================================

{jurisdiction}

============================================================
REQUESTED LANGUAGE
============================================================

{language}

{language_instruction}

============================================================
USER QUESTION
============================================================

{query}

============================================================
RETRIEVED EVIDENCE
============================================================

{combined_evidence}

============================================================
FINAL RESPONSE REQUIREMENTS
============================================================

Write one coherent response for the user.

Start naturally with the direct answer.

Use short paragraphs and bullets only when they improve readability.

Do not create top-level section headings.

Important claims must include evidence references such as
(EVIDENCE 1).

Stay within the requested response mode.

Do not introduce facts that are absent from the evidence.

End with exactly:

This information is not legal advice.
""".strip()

    # ==============================================================
    # GEMINI GENERATION
    # ==============================================================

    def _generate_with_gemini(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        jurisdiction: str,
        language: str,
        response_mode: ResponseMode = "detailed",
    ) -> str:
        """
        Generate a grounded answer using Gemini.
        """

        if not self.client:
            raise RuntimeError(
                "Gemini client is not configured."
            )

        prompt = self._build_grounded_prompt(
            query=query,
            evidence=evidence,
            jurisdiction=jurisdiction,
            language=language,
            response_mode=response_mode,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        text = getattr(
            response,
            "text",
            None,
        )

        if not text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return text.strip()

    # ==============================================================
    # FALLBACK NORMALIZATION
    # ==============================================================

    @staticmethod
    def _clean_fallback_text(
        text: str,
    ) -> str:
        """
        Clean OCR/PDF artifacts.

        Only affects fallback display text; original evidence is
        preserved unchanged inside the knowledge base.
        """

        text = str(text or "")

        replacements = {
            "â€™": "'",
            "â€œ": '"',
            "â€\x9d": '"',
            "â€“": "-",
            "â€”": "-",
            "â†’": "->",
            "Â": "",
            "�": "",
            "\x92": "'",
            "\x93": '"',
            "\x94": '"',
            "\x96": "-",
            "\x97": "-",
        }

        for old, new in replacements.items():
            text = text.replace(
                old,
                new,
            )

        # Remove isolated mojibake marker.
        text = text.replace(
            "â",
            "",
        )

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        fixes = [
            (
                r"\bpur\s+poses\b",
                "purposes",
            ),
            (
                r"\bapplic\s+ation\b",
                "application",
            ),
            (
                r"\bgeograph\s+ical\b",
                "geographical",
            ),
            (
                r"\bbiolog\s+ical\b",
                "biological",
            ),
            (
                r"\binvent\s+ive\b",
                "inventive",
            ),
            (
                r"\btrad\s+itional\b",
                "traditional",
            ),
            (
                r"\bknow\s+ledge\b",
                "knowledge",
            ),
        ]

        for pattern, replacement in fixes:
            text = re.sub(
                pattern,
                replacement,
                text,
                flags=re.IGNORECASE,
            )

        return text.strip()

    # ==============================================================
    # EVIDENCE CONTENT
    # ==============================================================

    @staticmethod
    def _get_evidence_content(
        item: dict[str, Any],
    ) -> str:
        """
        Return the actual retrieved evidence text.
        """

        return str(
            item.get("text")
            or item.get("content")
            or item.get("document")
            or ""
        )

    # ==============================================================
    # EVIDENCE FLAGS
    # ==============================================================

    @staticmethod
    def _contains_any(
        text: str,
        terms: tuple[str, ...],
    ) -> bool:
        """
        Check whether any term occurs in the normalized evidence.
        """

        text_lower = text.lower()

        return any(
            term in text_lower
            for term in terms
        )

    # ==============================================================
    # STRUCTURED FALLBACK POINTS
    # ==============================================================

    def _build_structured_fallback_points(
        self,
        evidence: list[dict[str, Any]],
    ) -> list[str]:
        """
        Convert retrieved legal evidence into concise user-facing
        statements without introducing facts outside that evidence.

        This is intentionally rule-based because it is only used when
        Gemini is unavailable.
        """

        points: list[str] = []
        used_evidence: set[int] = set()

        for evidence_number, item in enumerate(
            evidence[:6],
            start=1,
        ):
            raw_content = self._get_evidence_content(
                item
            )

            content = self._clean_fallback_text(
                raw_content
            )

            if not content:
                continue

            lower = content.lower()

            # ------------------------------------------------------
            # Source / geographical origin
            # ------------------------------------------------------

            if (
                "source and geographical origin"
                in lower
                or
                "source and geographic origin"
                in lower
            ):
                points.append(
                    "The evidence addresses disclosure of the "
                    "source and geographical origin of biological "
                    "material used in an invention "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

            # ------------------------------------------------------
            # Indian biological material / permission
            # ------------------------------------------------------

            if (
                "biological material from india"
                in lower
                and
                "permission from the competent authority"
                in lower
            ):
                points.append(
                    "The evidence states that when biological "
                    "material from India is used, necessary "
                    "permission from the competent authority is "
                    "to be submitted before grant "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

            # ------------------------------------------------------
            # Budapest Treaty / deposit
            # ------------------------------------------------------

            if (
                "budapest treaty"
                in lower
                and
                "biological material"
                in lower
                and
                "deposit"
                in lower
            ):
                points.append(
                    "The evidence describes a biological-material "
                    "deposit requirement connected with the "
                    "Budapest Treaty "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

            # ------------------------------------------------------
            # Inventive step / obviousness
            # ------------------------------------------------------

            if (
                "inventive step"
                in lower
                and
                (
                    "obvious"
                    in lower
                    or
                    "priority date"
                    in lower
                )
            ):
                points.append(
                    "The evidence addresses whether the claimed "
                    "invention is obvious and involves an inventive "
                    "step, with reference to published material or "
                    "what was used in India before the relevant "
                    "priority date "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

            # ------------------------------------------------------
            # Complete specification / claims
            # ------------------------------------------------------

            if (
                "complete specification"
                in lower
                and
                (
                    "describe the invention"
                    in lower
                    or
                    "claim or claims"
                    in lower
                    or
                    "claims"
                    in lower
                )
            ):
                points.append(
                    "The evidence identifies requirements relating "
                    "to the complete specification and its claims "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

            # ------------------------------------------------------
            # Traditional knowledge
            # ------------------------------------------------------

            if (
                "traditional knowledge"
                in lower
                and
                (
                    "invention"
                    in lower
                    or
                    "prior art"
                    in lower
                )
            ):
                points.append(
                    "The evidence identifies traditional knowledge "
                    "as relevant to assessment of the invention "
                    f"(EVIDENCE {evidence_number})."
                )

                used_evidence.add(
                    evidence_number
                )

                continue

        return points

    # ==============================================================
    # GENERIC FALLBACK
    # ==============================================================

    def _build_generic_fallback_points(
        self,
        evidence: list[dict[str, Any]],
        used_evidence: set[int],
        max_points: int,
    ) -> list[str]:
        """
        Controlled generic fallback for evidence that does not match
        a specialized rule.

        This is intentionally conservative.
        """

        points: list[str] = []

        for evidence_number, item in enumerate(
            evidence[:6],
            start=1,
        ):
            if evidence_number in used_evidence:
                continue

            content = self._clean_fallback_text(
                self._get_evidence_content(item)
            )

            if not content:
                continue

            # Split into sentence-like fragments.
            sentences = re.split(
                r"(?<=[.!?;])\s+",
                content,
            )

            chosen = None

            for sentence in sentences:
                sentence = sentence.strip()

                if len(sentence) < 55:
                    continue

                # Remove common leading OCR/clause markers.
                sentence = re.sub(
                    r"^\s*\(?\d+\s*(?:\([a-zA-Z0-9]+\))?\s*",
                    "",
                    sentence,
                )

                sentence = sentence.strip()

                if len(sentence) >= 55:
                    chosen = sentence
                    break

            if not chosen:
                continue

            if len(chosen) > 220:
                chosen = (
                    chosen[:217]
                    .rsplit(" ", 1)[0]
                    + "..."
                )

            points.append(
                "The retrieved evidence states: "
                f"{chosen} "
                f"(EVIDENCE {evidence_number})."
            )

            if len(points) >= max_points:
                break

        return points

    # ==============================================================
    # FINAL FALLBACK RESPONSE
    # ==============================================================

    def _build_evidence_fallback(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        rag_response: dict[str, Any],
        response_mode: ResponseMode,
    ) -> str:
        """
        Build a clean deterministic answer when Gemini is unavailable.

        Important:
        - Uses only retrieved evidence.
        - Does not call another model.
        - Does not invent legal requirements.
        """

        if not evidence:
            return (
                "Reliable evidence was not found in the available "
                "knowledge base.\n\n"
                "This information is not legal advice."
            )

        if response_mode == "simple":
            max_points = 4
        elif response_mode == "technical":
            max_points = 6
        else:
            max_points = 5

        # ----------------------------------------------------------
        # First use specialized, evidence-aware statements.
        # ----------------------------------------------------------

        points = self._build_structured_fallback_points(
            evidence=evidence
        )

        # ----------------------------------------------------------
        # Track which evidence numbers were already represented.
        # ----------------------------------------------------------

        used_evidence: set[int] = set()

        for point in points:
            match = re.search(
                r"EVIDENCE\s+(\d+)",
                point,
                flags=re.IGNORECASE,
            )

            if match:
                used_evidence.add(
                    int(match.group(1))
                )

        # ----------------------------------------------------------
        # Add controlled generic statements only if necessary.
        # ----------------------------------------------------------

        if len(points) < max_points:
            generic_points = (
                self._build_generic_fallback_points(
                    evidence=evidence,
                    used_evidence=used_evidence,
                    max_points=max_points - len(points),
                )
            )

            points.extend(
                generic_points
            )

        points = points[:max_points]

        # ----------------------------------------------------------
        # If nothing usable could be produced.
        # ----------------------------------------------------------

        if not points:
            return (
                "Relevant evidence was retrieved from the knowledge "
                "base, but a clean evidence-grounded explanation "
                "could not be generated automatically.\n\n"
                "Please review the cited knowledge-base sources.\n\n"
                "This information is not legal advice."
            )

        # ----------------------------------------------------------
        # Opening.
        # ----------------------------------------------------------

        if response_mode == "simple":
            opening = (
                "Based on the available evidence, the main points "
                "to consider are:"
            )
        elif response_mode == "technical":
            opening = (
                "Based on the retrieved evidence, the following "
                "patent-related considerations are relevant:"
            )
        else:
            opening = (
                "Based on the available evidence, the following "
                "considerations are relevant:"
            )

        # ----------------------------------------------------------
        # Final response.
        # ----------------------------------------------------------

        lines = [
            opening,
            "",
        ]

        for point in points:
            lines.append(
                f"- {point}"
            )

        lines.extend(
            [
                "",
                "These points are based only on the evidence currently "
                "available in the knowledge base. Further review of "
                "the applicable official documents may be required.",
                "",
                "This information is not legal advice.",
            ]
        )

        return "\n".join(lines)

    # ==============================================================
    # GENERATE RESPONSE
    # ==============================================================

    def generate_response(
        self,
        query: str,
        jurisdiction: str = "india",
        language: str = "en",
        innovation_id: str | None = None,
        response_mode: ResponseMode = "detailed",
    ) -> dict[str, Any]:
        """
        Generate a grounded response using the existing RAG pipeline.

        Gemini is preferred when available. If Gemini is unavailable
        or quota-limited, a deterministic evidence-grounded fallback
        is generated from retrieved evidence.
        """

        # ----------------------------------------------------------
        # Validate response mode.
        # ----------------------------------------------------------

        if response_mode not in {
            "simple",
            "detailed",
            "technical",
        }:
            response_mode = "detailed"

        # ----------------------------------------------------------
        # RAG first.
        # ----------------------------------------------------------

        rag_response = self.rag_service.answer_query(
            query=query,
            jurisdiction=jurisdiction,
            language=language,
            innovation_id=innovation_id,
        )

        # ----------------------------------------------------------
        # Retrieve final evidence.
        # ----------------------------------------------------------

        evidence = getattr(
            self.rag_service,
            "_last_evidence",
            [],
        )

        # ----------------------------------------------------------
        # No evidence.
        # ----------------------------------------------------------

        if not evidence:
            return rag_response

        # ----------------------------------------------------------
        # Gemini unavailable.
        # ----------------------------------------------------------

        if not self.client:
            return {
                **rag_response,
                "answer": self._build_evidence_fallback(
                    query=query,
                    evidence=evidence,
                    rag_response=rag_response,
                    response_mode=response_mode,
                ),
                "disclaimer": (
                    "This information is not legal advice."
                ),
            }

        # ----------------------------------------------------------
        # Gemini generation.
        # ----------------------------------------------------------

        try:
            generated_answer = (
                self._generate_with_gemini(
                    query=query,
                    evidence=evidence,
                    jurisdiction=jurisdiction,
                    language=language,
                    response_mode=response_mode,
                )
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
            error_text = str(exc).lower()

            is_quota_error = (
                "429" in error_text
                or "resource_exhausted" in error_text
                or "quota exceeded" in error_text
                or "rate limit" in error_text
            )

            if is_quota_error:
                logger.warning(
                    "Gemini quota/rate limit reached. "
                    "Using evidence-grounded fallback."
                )
            else:
                logger.exception(
                    "Gemini generation failed. "
                    "Using evidence-grounded fallback: %s",
                    exc,
                )

            fallback_answer = (
                self._build_evidence_fallback(
                    query=query,
                    evidence=evidence,
                    rag_response=rag_response,
                    response_mode=response_mode,
                )
            )

            return {
                "answer": fallback_answer,
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