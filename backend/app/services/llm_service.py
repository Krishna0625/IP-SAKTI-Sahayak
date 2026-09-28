"""Gemini-backed service for grounded RAG responses."""

from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any, Literal

from dotenv import load_dotenv
from google import genai

from app.knowledge_graph.service import KnowledgeGraphService
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
        self.knowledge_graph = KnowledgeGraphService()

        self.api_key = os.getenv("GEMINI_API_KEY")

        self.model = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.8-flash",
        ).strip()

        if self.model.startswith("models/"):
            self.model = self.model[len("models/"):]

        # Prevent the old unavailable model from being used accidentally.
        if self.model.lower() == "gemini-2.5-flash":
            self.model = "gemini-3.8-flash"

        # Request-level generation metadata exposed through ChatResponse.
        self.last_generation_status = "rag_only"
        self.last_generation_model = None
        self.last_generation_note = None

        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
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
        """Return response-style instructions for Gemini."""
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

    @staticmethod
    def _get_question_structure_instruction(query: str) -> str:
        """Select answer-organization guidance from the user's question."""
        normalized = query.lower().strip()

        is_comparison = (
            "difference between" in normalized
            or "differences between" in normalized
            or "compare" in normalized
            or "comparison" in normalized
            or "distinguish" in normalized
            or "versus" in normalized
            or bool(re.search(r"\bvs\.?\b", normalized))
        )

        is_checklist = (
            "what should be checked" in normalized
            or "what issues should" in normalized
            or "what should i check" in normalized
            or "what needs to be checked" in normalized
            or "what considerations" in normalized
            or "what are the issues" in normalized
        )

        is_patent = (
            "patent" in normalized
            or "patentability" in normalized
            or "prior art" in normalized
        )

        if is_comparison:
            return """
QUESTION TYPE: COMPARISON

The user explicitly asks for a comparison.

- Start with a one- or two-sentence plain-language distinction.
- Name BOTH concepts explicitly in the opening.
- Explain what each concept protects or identifies, but only when the
  retrieved evidence supports the statement.
- Compare the concepts using parallel attributes such as purpose,
  scope, eligibility/use, or the type of identifier involved.
- Use a compact table or parallel bullets when that makes the
  distinction clearer.
- Do not merely summarize the retrieved documents.
- Do not present a list of unrelated evidence snippets.
- Do not let the highest-ranked evidence for one concept dominate the
  comparison.
- If an important comparison point is not supported by the evidence,
  say that it is not established by the available evidence.
""".strip()

        if is_checklist:
            return """
QUESTION TYPE: PRACTICAL CHECKLIST

The user is asking what should be checked.

- State the main areas to check first.
- Group related issues logically.
- Connect each issue to the relevant retrieved evidence.
- Distinguish IP issues from TK, biodiversity, ABS, or regulatory issues
  when the evidence supports that distinction.
- Do not merely repeat document excerpts.
""".strip()

        if is_patent:
            return """
QUESTION TYPE: PATENT / PATENTABILITY

- Answer the patent-related question directly and cautiously.
- Distinguish statutory exclusion, novelty, inventive step, prior art,
  traditional knowledge, biodiversity/ABS, and procedure when the
  retrieved evidence supports those distinctions.
- Do not turn possible relevance into a definitive legal conclusion.
- Explain what the evidence establishes and what requires further review.
""".strip()

        return """
QUESTION TYPE: GENERAL EXPLANATION

- Answer the user's actual question directly.
- Synthesize the evidence into a coherent explanation.
- Prefer explanation over quotation.
- Do not simply list retrieved snippets.
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
        graph_context: dict[str, list[dict[str, Any]]] | None = None,
    ) -> str:
        """Build a strict evidence-grounded Gemini prompt."""
        evidence_text: list[str] = []
        for index, item in enumerate(evidence[:6], start=1):
            metadata = item.get("metadata") or {}
            title = metadata.get("title", "Official document")
            source = (
                metadata.get("source")
                or metadata.get("source_id")
                or ""
            )
            source_id = metadata.get("source_id", "")
            domain = metadata.get("domain", "")
            page = metadata.get("page", "")
            section = metadata.get("section", "")
            authority = metadata.get("authority", "")
            content = self._clean_evidence_for_prompt(
                item.get("text")
                or item.get("content")
                or item.get("document")
                or ""
            )
            evidence_text.append(
                f"""
EVIDENCE {index}

Title: {title}
Source ID: {source_id}
Source: {source}
Authority: {authority}
Domain: {domain}
Section/Rule: {section}
Page: {page}

Content:

{content}
""".strip()
            )

        combined_evidence = "\n\n".join(evidence_text)

        graph_context_text = ""
        if graph_context and (
            graph_context.get("entities")
            or graph_context.get("relationships")
        ):
            graph_context_text = json.dumps(
                graph_context,
                ensure_ascii=True,
                separators=(",", ":"),
            )

        # ----------------------------------------------------------
        # Language
        # ----------------------------------------------------------
        if language.lower() in {"en", "english"}:
            language_instruction = "Respond in English."
        else:
            language_instruction = (
                "Respond in the requested language: "
                f"{language}."
            )

        # ----------------------------------------------------------
        # Response mode / question structure
        # ----------------------------------------------------------
        response_mode_instruction = self._get_response_mode_instruction(
            response_mode
        )
        question_structure_instruction = (
            self._get_question_structure_instruction(query)
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

1. Use ONLY the retrieved evidence provided below for legal or factual claims.
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
ANSWER SYNTHESIS
============================================================

The retrieved evidence is SOURCE MATERIAL, not the answer itself.
Your task is to SYNTHESIZE the evidence into a direct answer to the
user's question.

{question_structure_instruction}

General synthesis rules:
- Answer the user's actual question before discussing supporting details.
- Do not copy retrieved evidence snippets as the main answer.
- Do not repeatedly begin sentences with "The evidence states".
- Do not list retrieved documents without explaining their relevance.
- Do not answer only the highest-ranked evidence if the question has
  multiple concepts or parts.
- When evidence supports a comparison, address both sides explicitly.
- When evidence supports a checklist, organize the issues into a few
  meaningful points and explain why each matters.
- When evidence is missing for an important point, state that clearly.
- Never use the Knowledge Graph as a substitute for retrieved legal evidence.
- Do not claim that a rule applies specifically to Ayurvedic products unless
  the retrieved evidence supports that product-specific statement.
- Do not convert general legal-source evidence into product-specific advice
  when the knowledge base does not establish the connection.

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
23. Use short paragraphs and bullets only when they improve readability.
24. For comparison questions, a compact Markdown table is allowed when
    it makes the difference clearer and the evidence supports the fields.
25. For multilingual responses, keep the answer in the requested language
    while preserving legal names, source titles, evidence labels, and
    statutory identifiers accurately.
26. End the response with exactly:

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
KNOWLEDGE GRAPH CONTEXT
============================================================

This is a lightweight relationship/context layer.
It is NOT authoritative legal evidence.
Do not cite or treat graph relationships as legal authority.
Use retrieved source evidence for legal and factual claims.

{graph_context_text}

============================================================
FINAL RESPONSE REQUIREMENTS
============================================================

Write one coherent response for the user.

Start naturally with the direct answer.
Synthesize the retrieved evidence rather than copying evidence snippets.
For comparison questions, explicitly explain both concepts and the key
supported differences.
For practical questions, organize the supported issues into a clear set
of points.
Important legal or factual claims must include evidence references such as
(EVIDENCE 1).
Do not attach evidence numbers to graph-only relationships.
Stay within the requested response mode.
Do not introduce facts that are absent from the evidence.
If evidence is insufficient for an important part, say so explicitly.
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
        graph_context: dict[str, list[dict[str, Any]]] | None = None,
    ) -> str:
        """Generate a grounded Gemini answer with transient-error failover."""
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
            graph_context=graph_context,
        )

        fallback_model = os.getenv(
            "GEMINI_FALLBACK_MODEL",
            "gemini-3.7-flash",
        ).strip()

        if fallback_model.startswith("models/"):
            fallback_model = fallback_model[len("models/"):]

        models_to_try = [self.model]

        if fallback_model and fallback_model != self.model:
            models_to_try.append(fallback_model)

        retry_delays = (2, 5, 10)
        last_exception: Exception | None = None

        for model_index, model_name in enumerate(models_to_try):
            for attempt in range(1, len(retry_delays) + 1):
                try:
                    logger.info(
                        "Generating Gemini response with model=%s "
                        "(attempt %s/%s).",
                        model_name,
                        attempt,
                        len(retry_delays),
                    )

                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )

                    text = getattr(response, "text", None)
                    if not text or not str(text).strip():
                        raise RuntimeError(
                            f"Gemini model {model_name} returned an empty response."
                        )

                    self.last_generation_model = model_name

                    if model_index == 0:
                        self.last_generation_status = "gemini"
                        self.last_generation_note = None
                    else:
                        self.last_generation_status = "gemini_fallback"
                        self.last_generation_note = (
                            "The primary Gemini model was temporarily unavailable; "
                            "the response was generated using fallback model "
                            f"{model_name}."
                        )

                    return str(text).strip()

                except Exception as exc:
                    last_exception = exc
                    error_text = str(exc).lower()

                    is_retryable = any(
                        marker in error_text
                        for marker in (
                            "503",
                            "service unavailable",
                            "temporarily unavailable",
                            "high demand",
                            "overloaded",
                            "429",
                            "resource_exhausted",
                            "rate limit",
                            "too many requests",
                            "quota exceeded",
                        )
                    )

                    if not is_retryable:
                        raise

                    if attempt >= len(retry_delays):
                        logger.warning(
                            "Gemini model %s remained unavailable after %s "
                            "custom retry attempts.",
                            model_name,
                            len(retry_delays),
                        )
                        break

                    delay = retry_delays[attempt - 1]
                    logger.warning(
                        "Gemini model %s temporarily unavailable. "
                        "Retrying in %s seconds (attempt %s/%s).",
                        model_name,
                        delay,
                        attempt,
                        len(retry_delays),
                    )
                    time.sleep(delay)

            if model_index < len(models_to_try) - 1:
                next_model = models_to_try[model_index + 1]
                logger.warning(
                    "Switching Gemini model from %s to fallback model %s.",
                    model_name,
                    next_model,
                )

        if last_exception:
            raise last_exception

        raise RuntimeError(
            "Gemini generation failed after all configured models and retries."
        )

    # ==============================================================
    # EVIDENCE PROMPT NORMALIZATION
    # ==============================================================

    @staticmethod
    def _clean_evidence_for_prompt(text: str) -> str:
        """Clean common PDF/encoding artifacts before sending evidence to Gemini."""
        text = str(text or "")
        replacements = {
            "â€™": "'",
            "â€œ": '"',
            "â€�": '"',
            "â€“": "-",
            "â€”": "-",
            "â†’": "->",
            "Â": "",
            "�": "",
            "âkindâtypeâstyleâimitationâ": '"kind"/"type"/"style"/"imitation"',
            "usurpationâeven": "usurpation — even",
            "doesnot": "does not",
            "e quitable": "equitable",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text

    # ==============================================================
    # FALLBACK NORMALIZATION
    # ==============================================================

    @staticmethod
    def _clean_fallback_text(text: str) -> str:
        """Clean OCR/PDF artifacts for fallback display text."""
        text = str(text or "")
        replacements = {
            "â€™": "'",
            "â€œ": '"',
            "â€�": '"',
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
            "âkindâtypeâstyleâimitationâ": '"kind"/"type"/"style"/"imitation"',
            "usurpationâeven": "usurpation — even",
            "doesnot": "does not",
            "e quitable": "equitable",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)

        text = text.replace("â", "")
        text = re.sub(r"\s+", " ", text)

        fixes = [
            (r"\bpur\s+poses\b", "purposes"),
            (r"\bapplic\s+ation\b", "application"),
            (r"\bgeograph\s+ical\b", "geographical"),
            (r"\bbiolog\s+ical\b", "biological"),
            (r"\binvent\s+ive\b", "inventive"),
            (r"\btrad\s+itional\b", "traditional"),
            (r"\bknow\s+ledge\b", "knowledge"),
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
    def _get_evidence_content(item: dict[str, Any]) -> str:
        """Return the actual retrieved evidence text."""
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
        """Check whether any term occurs in the normalized evidence."""
        text_lower = text.lower()
        return any(term in text_lower for term in terms)

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

        for evidence_number, item in enumerate(evidence[:6], start=1):
            raw_content = self._get_evidence_content(item)
            content = self._clean_fallback_text(raw_content)
            if not content:
                continue

            lower = content.lower()

            # ------------------------------------------------------
            # Source / geographical origin
            # ------------------------------------------------------
            if (
                "source and geographical origin" in lower
                or "source and geographic origin" in lower
            ):
                points.append(
                    "The evidence addresses disclosure of the source "
                    "and geographical origin of biological material "
                    "used in an invention "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
                continue

            # ------------------------------------------------------
            # Indian biological material / permission
            # ------------------------------------------------------
            if (
                "biological material from india" in lower
                and "permission from the competent authority" in lower
            ):
                points.append(
                    "The evidence states that when biological material "
                    "from India is used, necessary permission from the "
                    "competent authority is to be submitted before grant "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
                continue

            # ------------------------------------------------------
            # Budapest Treaty / deposit
            # ------------------------------------------------------
            if (
                "budapest treaty" in lower
                and "biological material" in lower
                and "deposit" in lower
            ):
                points.append(
                    "The evidence describes a biological-material "
                    "deposit requirement connected with the Budapest "
                    "Treaty "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
                continue

            # ------------------------------------------------------
            # Inventive step / obviousness
            # ------------------------------------------------------
            if (
                "inventive step" in lower
                and ("obvious" in lower or "priority date" in lower)
            ):
                points.append(
                    "The evidence addresses whether the claimed "
                    "invention is obvious and involves an inventive "
                    "step, with reference to published material or "
                    "what was used in India before the relevant "
                    "priority date "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
                continue

            # ------------------------------------------------------
            # Complete specification / claims
            # ------------------------------------------------------
            if (
                "complete specification" in lower
                and (
                    "describe the invention" in lower
                    or "claim or claims" in lower
                    or "claims" in lower
                )
            ):
                points.append(
                    "The evidence identifies requirements relating to "
                    "the complete specification and its claims "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
                continue

            # ------------------------------------------------------
            # Traditional knowledge
            # ------------------------------------------------------
            if (
                "traditional knowledge" in lower
                and ("invention" in lower or "prior art" in lower)
            ):
                points.append(
                    "The evidence identifies traditional knowledge as "
                    "relevant to assessment of the invention "
                    f"(EVIDENCE {evidence_number})."
                )
                used_evidence.add(evidence_number)
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
        """Controlled generic fallback for unmatched evidence."""
        points: list[str] = []

        for evidence_number, item in enumerate(evidence[:6], start=1):
            if evidence_number in used_evidence:
                continue

            content = self._clean_fallback_text(
                self._get_evidence_content(item)
            )
            if not content:
                continue

            sentences = re.split(
                r"(?<=[.!?;])\s+",
                content,
            )
            chosen = None

            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) < 55:
                    continue

                sentence = re.sub(
                    r"^\s*[0-9]+\s*(?:[A-Za-z0-9]+)?\s*[:.)-]?\s*",
                    "",
                    sentence,
                ).strip()

                if len(sentence) >= 55:
                    chosen = sentence
                    break

            if not chosen:
                continue

            if len(chosen) > 220:
                chosen = chosen[:217].rsplit(" ", 1)[0] + "..."

            points.append(
                f"{chosen} (EVIDENCE {evidence_number})."
            )

            if len(points) >= max_points:
                break

        return points

    # ==============================================================
    # FALLBACK OPENING
    # ==============================================================

    @staticmethod
    def _build_fallback_opening(
        query: str,
        response_mode: ResponseMode,
    ) -> str:
        """Choose a question-aware opening for the deterministic fallback."""
        normalized = query.lower().strip()

        if (
            "difference between" in normalized
            or "differences between" in normalized
            or "compare" in normalized
            or "comparison" in normalized
            or "distinguish" in normalized
            or "versus" in normalized
            or re.search(r"\bvs\.?\b", normalized)
        ):
            return (
                "Based on the available evidence, the key distinction "
                "between the concepts is:"
            )

        if (
            "what should be checked" in normalized
            or "what issues should" in normalized
            or "what should i check" in normalized
            or "what needs to be checked" in normalized
            or "what considerations" in normalized
            or "what are the issues" in normalized
        ):
            return (
                "Based on the available evidence, the main areas "
                "to check are:"
            )

        if "patentability" in normalized or "patent" in normalized:
            if response_mode == "technical":
                return (
                    "Based on the retrieved evidence, the main "
                    "patent-related considerations are:"
                )
            return (
                "Based on the available evidence, the main "
                "patent-related points are:"
            )

        return "Based on the available evidence, the main points are:"

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
        del rag_response

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

        points = self._build_structured_fallback_points(evidence=evidence)

        used_evidence: set[int] = set()
        for point in points:
            match = re.search(
                r"EVIDENCE\s+(\d+)",
                point,
                flags=re.IGNORECASE,
            )
            if match:
                used_evidence.add(int(match.group(1)))

        if len(points) < max_points:
            points.extend(
                self._build_generic_fallback_points(
                    evidence=evidence,
                    used_evidence=used_evidence,
                    max_points=max_points - len(points),
                )
            )

        points = points[:max_points]

        if not points:
            return (
                "Relevant evidence was retrieved from the knowledge "
                "base, but a clean evidence-grounded explanation "
                "could not be generated automatically.\n\n"
                "Please review the cited knowledge-base sources.\n\n"
                "This information is not legal advice."
            )

        opening = self._build_fallback_opening(
            query=query,
            response_mode=response_mode,
        )

        lines = [opening, ""]
        for point in points:
            lines.append(f"- {point}")

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

        Gemini is preferred when available. When the primary model is
        temporarily unavailable, _generate_with_gemini() can switch to
        the configured backup Gemini model. If all Gemini generation
        attempts fail, the deterministic evidence-grounded fallback
        is returned.
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

        # Reset request-level generation metadata.
        self.last_generation_status = "rag_only"
        self.last_generation_model = None
        self.last_generation_note = None

        # ----------------------------------------------------------
        # Knowledge Graph context.
        # ----------------------------------------------------------
        try:
            graph_context = (
                self.knowledge_graph
                .get_context_for_query(query)
            )
        except Exception as exc:
            logger.warning(
                "Knowledge graph context unavailable; "
                "continuing without it: %s",
                exc,
            )
            graph_context = {}

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
            return {
                **rag_response,
                "generation_status": "rag_only",
                "generation_model": None,
                "generation_note": (
                    "No supporting evidence was available "
                    "for Gemini generation."
                ),
            }

        # ----------------------------------------------------------
        # Gemini unavailable / not configured.
        # ----------------------------------------------------------
        if not self.client:
            fallback_answer = (
                self._build_evidence_fallback(
                    query=query,
                    evidence=evidence,
                    rag_response=rag_response,
                    response_mode=response_mode,
                )
            )

            return {
                **rag_response,
                "answer": fallback_answer,
                "disclaimer": (
                    "This information is not legal advice."
                ),
                "generation_status": "evidence_fallback",
                "generation_model": None,
                "generation_note": (
                    "Gemini is not configured; the response "
                    "was generated from retrieved "
                    "knowledge-base evidence."
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
                    graph_context=graph_context,
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
                "generation_status": getattr(
                    self,
                    "last_generation_status",
                    "gemini",
                ),
                "generation_model": getattr(
                    self,
                    "last_generation_model",
                    self.model,
                ),
                "generation_note": getattr(
                    self,
                    "last_generation_note",
                    None,
                ),
            }

        # ----------------------------------------------------------
        # All Gemini generation attempts failed.
        # ----------------------------------------------------------
        except Exception as exc:
            error_text = str(exc).lower()

            is_quota_error = (
                "429" in error_text
                or "resource_exhausted" in error_text
                or "quota exceeded" in error_text
                or "rate limit" in error_text
            )

            is_temporary_error = (
                "503" in error_text
                or "service unavailable" in error_text
                or "temporarily unavailable" in error_text
                or "high demand" in error_text
                or "overloaded" in error_text
            )

            if is_quota_error:
                generation_note = (
                    "Gemini request limits were reached across "
                    "the configured generation attempts; "
                    "evidence-grounded fallback was used."
                )

                logger.warning(
                    "Gemini quota/rate limit reached across "
                    "configured models. "
                    "Using evidence-grounded fallback."
                )

            elif is_temporary_error:
                generation_note = (
                    "Gemini was temporarily unavailable across "
                    "the configured models; evidence-grounded "
                    "fallback was used."
                )

                logger.warning(
                    "Gemini remained temporarily unavailable "
                    "across configured models. "
                    "Using evidence-grounded fallback: %s",
                    exc,
                )

            else:
                generation_note = (
                    "Gemini generation failed; "
                    "evidence-grounded fallback was used."
                )

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
                "generation_status": "evidence_fallback",
                "generation_model": None,
                "generation_note": generation_note,
            }
