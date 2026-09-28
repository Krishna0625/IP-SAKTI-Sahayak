from __future__ import annotations

from typing import Any

from app.rag.retriever import DocumentRetriever
from app.services.citation_service import CitationService


class RAGService:
    """
    Retrieval-Augmented Generation service for IP-SAKTI Sahayak.

    Responsibilities:
    - Interpret jurisdiction and domain
    - Detect traditional-knowledge + patent queries
    - Detect ordinary patent queries
    - Retrieve evidence from appropriate knowledge domains
    - Expand targeted legal queries
    - Rank evidence using relevance and authority
    - Apply final evidence-quality filtering
    - Preserve useful source diversity
    - Prioritize relevant statutory Patent Act evidence
    - Prioritize relevant TKDL evidence
    - Prioritize relevant patent evidence for ordinary patent queries
    - Prioritize statutory workflow evidence for patent application and grant queries
    - Store latest evidence for LLMService
    - Format citations using CitationService
    - Provide a stable answer_query() interface for LLMService
    """

    def __init__(self) -> None:
        self.retriever = DocumentRetriever()
        self.citation_service = CitationService()

        # LLMService expects this attribute.
        self._last_evidence: list[dict[str, Any]] = []

    # ==============================================================
    # QUERY INTERPRETATION
    # ==============================================================

    def interpret_filters(
        self,
        query: str,
    ) -> dict[str, Any]:

        q = query.lower()

        jurisdiction: str | None = None
        domain: str | None = None
        source_id: str | None = None

        # ----------------------------------------------------------
        # Jurisdiction
        # ----------------------------------------------------------

        if any(
            term in q
            for term in (
                "india",
                "indian",
                "in india",
                "indian law",
                "indian patent",
                "indian patents",
                "ip india",
                "government of india",
            )
        ):
            jurisdiction = "india"

        elif any(
            term in q
            for term in (
                "international",
                "global",
                "wipo",
                "pct",
                "worldwide",
                "international patent",
            )
        ):
            jurisdiction = "international"

        # ----------------------------------------------------------
        # Domain
        # ----------------------------------------------------------

        if any(
            term in q
            for term in (
                "traditional knowledge",
                "traditional knowledge digital library",
                "tkdl",
                "traditionally known",
                "traditional use",
            )
        ):
            domain = "tk"

        elif any(
            term in q
            for term in (
                "patent",
                "patent application",
                "patentability",
                "prior art",
                "novelty",
                "inventive step",
                "invention",
                "patent office",
                "patent examination",
                "patent specification",
                "patent filing",
            )
        ):
            domain = "patents"

        elif any(
            term in q
            for term in (
                "trademark",
                "trade mark",
                "brand",
                "logo",
            )
        ):
            domain = "trademarks"

        elif any(
            term in q
            for term in (
                "geographical indication",
                "geographical indications",
            )
        ):
            domain = "gi"

        elif any(
            term in q
            for term in (
                "copyright",
                "author rights",
                "literary work",
                "artistic work",
            )
        ):
            domain = "copyright"

        elif any(
            term in q
            for term in (
                "biodiversity",
                "access and benefit sharing",
                "benefit sharing",
                "biological resource",
                "abs",
            )
        ):
            domain = "abs"

        elif any(
            term in q
            for term in (
                "ayurveda",
                "ayurvedic medicine",
                "classical medicine",
                "proprietary medicine",
                "new drug",
                "phytopharmaceutical",
                "ayurveda-aahar",
                "ayurveda aahar",
                "nutraceutical",
                "cosmetic",
            )
        ):
            domain = "regulatory"

        multi_domains: list[str] = []

        if any(
            term in q
            for term in (
                "geographical indication",
                "geographical indications",
            )
        ):
            multi_domains.append("gi")

        if any(
            term in q
            for term in (
                "trademark",
                "trade mark",
                "brand",
                "logo",
            )
        ):
            multi_domains.append("trademarks")

        has_tk_concept = any(
            term in q
            for term in (
                "traditional knowledge",
                "traditional medicine",
                "tkdl",
                "traditional use",
                "traditionally known",
                "traditional knowledge digital library",
            )
        )

        has_abs_concept = any(
            term in q
            for term in (
                "access and benefit sharing",
                "benefit sharing",
                "abs",
            )
        )

        has_biological_resource_concept = any(
            term in q
            for term in (
                "biological resource",
                "biological resources",
                "biodiversity",
                "national biodiversity authority",
                "nba",
            )
        )

        if has_tk_concept:
            multi_domains.append("tk")

        if has_abs_concept:
            multi_domains.append("abs")

        if (
            has_biological_resource_concept
            and (has_tk_concept or has_abs_concept)
        ):
            multi_domains.append("biodiversity")

        if len(multi_domains) > 1:
            return {
                "jurisdiction": jurisdiction,
                "domain": None,
                "domains": list(dict.fromkeys(multi_domains)),
                "source_id": source_id,
            }

        return {
            "jurisdiction": jurisdiction,
            "domain": domain,
            "domains": [domain] if domain else [],
            "source_id": source_id,
        }

    # ==============================================================
    # INTENT DETECTION
    # ==============================================================

    @staticmethod
    def _is_traditional_knowledge_patent_query(
        query: str,
    ) -> bool:
        """
        Detect patentability questions involving traditional knowledge,
        Ayurveda, Ayurvedic medicine, or traditional medicine.
        """

        q = RAGService._normalize_text(query)

        tk_terms = (
            "traditional knowledge",
            "traditional medicine",
            "traditional use",
            "traditionally known",
            "traditional knowledge digital library",
            "tkdl",
            "ayurvedic knowledge",
        )

        patent_terms = (
            "patent",
            "patented",
            "patentable",
            "patentability",
            "patent application",
            "patent filing",
            "patent claim",
            "patent claims",
            "prior art",
            "novelty",
            "inventive step",
            "patent office",
            "patent examination",
            "grant of patent",
            "get a patent",
            "obtain a patent",
            "apply for a patent",
            "be patented",
        )

        has_tk = any(
            term in q
            for term in tk_terms
        )

        has_patent = any(
            term in q
            for term in patent_terms
        )

        return has_tk and has_patent


    @staticmethod
    def _is_patent_query(
        query: str,
    ) -> bool:
        """
        Detect ordinary patent/IP questions that are not specifically
        traditional-knowledge + patent questions.
        """

        q = query.lower()

        patent_terms = (
            "patent",
            "patent application",
            "patentability",
            "prior art",
            "novelty",
            "inventive step",
            "invention",
            "patent office",
            "patent examination",
            "grant of patent",
            "patent specification",
            "patent filing",
            "complete specification",
            "patent claim",
            "claims",
        )

        return any(
            term in q
            for term in patent_terms
        )

    @staticmethod
    def _is_patent_workflow_query(
        query: str,
    ) -> bool:
        """
        Detect questions about obtaining, applying for, examining,
        or receiving a patent rather than post-grant or enforcement issues.
        """

        q = query.lower()

        workflow_terms = (
            "how to get a patent",
            "how to apply for a patent",
            "how do i apply for a patent",
            "how is a patent granted",
            "how is a patent issued",
            "how a patent is granted",
            "how a patent is issued",
            "patent application process",
            "patent filing process",
            "patent grant process",
            "patent issuance",
            "patent issued",
            "patent granted",
            "obtain a patent",
            "getting a patent",
            "apply for a patent",
            "application for a patent",
            "who can apply for a patent",
            "eligible to apply for a patent",
            "eligible applicant for a patent",
            "patent examination process",
            "request for examination",
            "steps to get a patent",
            "steps for getting a patent",

            # Natural-language patentability questions
            "can be patented",
            "can i patent",
            "can we patent",
            "can this be patented",
            "can this invention be patented",
            "is this patentable",
            "is it patentable",
            "is patentable",
            "patentable in india",
            "can traditional knowledge be patented",
            "can ayurvedic knowledge be patented",
            "can ayurvedic medicine be patented",
        )

        subject_terms = (
            "patent",
            "invention",
        )

        return (
            any(term in q for term in workflow_terms)
            or (
                any(term in q for term in subject_terms)
                and any(
                    term in q
                    for term in (
                        "how",
                        "apply",
                        "application",
                        "file",
                        "filing",
                        "issue",
                        "issued",
                        "grant",
                        "granted",
                        "obtain",
                        "obtaining",
                        "process",
                        "steps",
                        "eligible",
                        "eligibility",
                        "who can",
                    )
                )
            )
        )

    # ==============================================================
    # TEXT NORMALIZATION
    # ==============================================================

    @staticmethod
    def _normalize_text(
        text: str,
    ) -> str:
        """
        Normalize OCR/extracted text for matching.
        Original evidence is never modified.
        """

        text = text.lower()

        replacements = {
            "-": " ",
            "â€“": " ",
            "â€”": " ",
            "\n": " ",
            "\r": " ",
            "\t": " ",
        }

        for old, new in replacements.items():
            text = text.replace(
                old,
                new,
            )

        return " ".join(
            text.split()
        )

    # ==============================================================
    # TARGETED STATUTORY TK/PATENT CANDIDATE
    # ==============================================================

    @classmethod
    def _is_targeted_tk_patent_candidate(
        cls,
        evidence: dict[str, Any],
    ) -> bool:
        """
        Identify the actual traditional-knowledge patent-law chunk.

        The candidate must:
        1. Come from a patent source.
        2. Contain actual TK language.
        3. Have been retrieved using a targeted TK/patent query.
        """

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = str(
            metadata.get("title")
            or ""
        ).lower()

        domain = str(
            metadata.get("domain")
            or ""
        ).lower()

        source_id = str(
            metadata.get("source_id")
            or ""
        ).lower()

        text = cls._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        retrieval_query = cls._normalize_text(
            str(
                evidence.get(
                    "_retrieval_query"
                )
                or ""
            )
        )

        # ----------------------------------------------------------
        # Patent source
        # ----------------------------------------------------------

        is_patent_source = (
            domain == "patents"
            or "patent act" in title
            or "patents act" in title
            or "patent" in title
            or "pat-" in source_id
        )

        if not is_patent_source:
            return False

        # ----------------------------------------------------------
        # Actual traditional-knowledge language
        # ----------------------------------------------------------

        text_signal = (
            "traditional knowledge" in text
            or "traditionally known" in text
            or "in effect is traditional knowledge"
            in text
            or "known properties of traditionally known"
            in text
        )

        if not text_signal:
            return False

        # ----------------------------------------------------------
        # Targeted query signal
        # ----------------------------------------------------------

        query_signal = (
            "invention which in effect is traditional knowledge"
            in retrieval_query
            or "aggregation or duplication of known properties"
            in retrieval_query
            or "section 3 p traditional knowledge"
            in retrieval_query
            or "patents act traditional knowledge"
            in retrieval_query
            or "traditional knowledge patentability"
            in retrieval_query
            or "prior art traditional knowledge patent"
            in retrieval_query
            or "traditional knowledge traditionally known patent"
            in retrieval_query
        )

        return query_signal

    # ==============================================================
    # TKDL / TRADITIONAL KNOWLEDGE EVIDENCE
    # ==============================================================

    @classmethod
    def _is_tkdl_evidence(
        cls,
        evidence: dict[str, Any],
    ) -> bool:
        """
        Identify evidence specifically related to TKDL or
        documented traditional knowledge.
        """

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = cls._normalize_text(
            str(
                metadata.get("title")
                or ""
            )
        )

        domain = cls._normalize_text(
            str(
                metadata.get("domain")
                or ""
            )
        )

        source_id = cls._normalize_text(
            str(
                metadata.get("source_id")
                or ""
            )
        )

        text = cls._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        return (
            "tkdl" in title
            or "traditional knowledge digital library"
            in title
            or domain == "tk"
            or "tkdl" in source_id
            or "traditional knowledge digital library"
            in text
            or (
                "traditional knowledge" in text
                and (
                    "prior art" in text
                    or "misappropriation" in text
                    or "search service" in text
                )
            )
        )

    # ==============================================================
    # RELEVANT TK + PATENT EVIDENCE
    # ==============================================================

    @classmethod
    def _is_relevant_tk_patent_evidence(
        cls,
        evidence: dict[str, Any],
        query: str,
    ) -> bool:

        if cls._is_targeted_tk_patent_candidate(
            evidence
        ):
            return True

        if cls._is_tkdl_evidence(
            evidence
        ):
            return True

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = cls._normalize_text(
            str(
                metadata.get("title")
                or ""
            )
        )

        domain = cls._normalize_text(
            str(
                metadata.get("domain")
                or ""
            )
        )

        text = cls._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        q = cls._normalize_text(
            query
        )

        # ----------------------------------------------------------
        # Relevant Patent Act material
        # ----------------------------------------------------------

        if (
            domain == "patents"
            and (
                "patent act" in title
                or "patents act" in title
            )
        ):
            relevant_terms = (
                "traditional knowledge",
                "traditionally known",
                "prior art",
                "novelty",
                "inventive step",
                "invention",
                "patentability",
                "section 3",
            )

            if any(
                term in text
                for term in relevant_terms
            ):
                return True

        # ----------------------------------------------------------
        # Generic relevant evidence
        # ----------------------------------------------------------

        relevant_terms = (
            "traditional knowledge",
            "traditionally known",
            "prior art",
            "tkdl",
        )

        patent_context = (
            "patent" in q
            or "invention" in q
            or "novelty" in q
            or "inventive step" in q
            or "patentability" in q
        )

        if (
            patent_context
            and any(
                term in text
                for term in relevant_terms
            )
        ):
            return True

        return False

    # ==============================================================
    # STATUTORY TK PRIORITY
    # ==============================================================

    def _statutory_tk_priority(
        self,
        evidence: dict[str, Any],
    ) -> float:

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = str(
            metadata.get("title")
            or ""
        ).lower()

        source_id = str(
            metadata.get("source_id")
            or ""
        ).lower()

        text = self._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        retrieval_query = self._normalize_text(
            str(
                evidence.get("_retrieval_query")
                or ""
            )
        )

        score = float(
            evidence.get("score")
            or 0.0
        )

        # ----------------------------------------------------------
        # Targeted query signals
        # ----------------------------------------------------------

        if (
            "invention which in effect is traditional knowledge"
            in retrieval_query
        ):
            score += 0.70

        if (
            "aggregation or duplication of known properties"
            in retrieval_query
        ):
            score += 0.60

        if (
            "section 3 p traditional knowledge"
            in retrieval_query
        ):
            score += 0.55

        if (
            "patents act traditional knowledge"
            in retrieval_query
        ):
            score += 0.45

        if (
            "traditional knowledge patentability"
            in retrieval_query
        ):
            score += 0.40

        if (
            "prior art traditional knowledge patent"
            in retrieval_query
        ):
            score += 0.35

        # ----------------------------------------------------------
        # Actual text signals
        # ----------------------------------------------------------

        if "in effect is traditional knowledge" in text:
            score += 0.60

        if "traditional knowledge" in text:
            score += 0.40

        if "traditionally known" in text:
            score += 0.35

        if "known properties of traditionally known" in text:
            score += 0.35

        if "aggregation" in text:
            score += 0.10

        if "duplication" in text:
            score += 0.10

        # ----------------------------------------------------------
        # Authority
        # ----------------------------------------------------------

        if "patent act" in title:
            score += 0.40

        if "patents act" in title:
            score += 0.40

        if "pat-002" in source_id:
            score += 0.10

        return score

    # ==============================================================
    # TK + PATENT FINAL EVIDENCE SCORE
    # ==============================================================

    def _tk_patent_evidence_score(
        self,
        evidence: dict[str, Any],
        query: str,
    ) -> float:

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = self._normalize_text(
            str(
                metadata.get("title")
                or ""
            )
        )

        text = self._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        domain = self._normalize_text(
            str(
                metadata.get("domain")
                or ""
            )
        )

        score = float(
            evidence.get("score")
            or 0.0
        )

        if self._is_targeted_tk_patent_candidate(
            evidence
        ):
            score += 2.00

            if (
                "section 3(p)"
                in text
            ):
                score += 0.80

            if (
                "section 3 p"
                in text
            ):
                score += 0.80

        if self._is_tkdl_evidence(
            evidence
        ):
            score += 1.40

            if "prior art" in text:
                score += 0.35

            if "misappropriation" in text:
                score += 0.20

            if "search" in text:
                score += 0.15

        if (
            domain == "patents"
            and (
                "patent act" in title
                or "patents act" in title
            )
        ):
            score += 0.45

        for phrase, weight in (
            (
                "traditional knowledge",
                0.25,
            ),
            (
                "traditionally known",
                0.20,
            ),
            (
                "prior art",
                0.20,
            ),
            (
                "patentability",
                0.15,
            ),
            (
                "novelty",
                0.10,
            ),
            (
                "inventive step",
                0.10,
            ),
        ):
            if phrase in text:
                score += weight

        return score

    # ==============================================================
    # NORMAL PATENT EVIDENCE RELEVANCE
    # ==============================================================

    @classmethod
    def _is_relevant_patent_evidence(
        cls,
        evidence: dict[str, Any],
        query: str,
    ) -> bool:
        """
        Final relevance gate for ordinary patent questions.

        Prevents unrelated material from being selected solely
        because it has a high vector similarity.
        """

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = cls._normalize_text(
            str(
                metadata.get("title")
                or ""
            )
        )

        domain = cls._normalize_text(
            str(
                metadata.get("domain")
                or ""
            )
        )

        text = cls._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        q = cls._normalize_text(
            query
        )

        # ----------------------------------------------------------
        # Patent-domain evidence
        # ----------------------------------------------------------

        if domain == "patents":
            return True

        if (
            "patent act" in title
            or "patents act" in title
            or "patent rules" in title
            or "patent amendment" in title
        ):
            return True

        # ----------------------------------------------------------
        # Relevant patent language
        # ----------------------------------------------------------

        patent_terms = (
            "patent",
            "invention",
            "prior art",
            "novelty",
            "inventive step",
            "patentability",
            "specification",
            "claim",
            "claims",
            "biological material",
            "source and geographical origin",
        )

        if any(
            term in text
            for term in patent_terms
        ):
            return True

        # ----------------------------------------------------------
        # For clearly patent-related questions, reject unrelated
        # material.
        # ----------------------------------------------------------

        if any(
            term in q
            for term in (
                "patent",
                "invention",
                "novelty",
                "inventive step",
            )
        ):
            return False

        return False

    # ==============================================================
    # PATENT WORKFLOW EVIDENCE SCORING
    # ==============================================================

    @classmethod
    def _patent_workflow_evidence_score(
        cls,
        evidence: dict[str, Any],
        query: str,
    ) -> float:
        """
        Prioritize evidence that directly supports the normal
        patent-obtaining workflow:
        applicant eligibility -> patentability/TK exclusions ->
        examination -> grant.
        """

        score = cls._base_patent_score_for_workflow(evidence, query)

        metadata = evidence.get("metadata") or {}
        title = cls._normalize_text(str(metadata.get("title") or ""))
        text = cls._normalize_text(str(evidence.get("text") or ""))
        retrieval_query = cls._normalize_text(
            str(evidence.get("_retrieval_query") or "")
        )

        # Strong statutory workflow anchors.
        section_signals = (
            (
                (
                    "persons entitled to apply for patents" in text
                    or "true and first inventor" in text
                ),
                1.15,
            ),
            (
                (
                    "in effect is traditional knowledge" in text
                    or "aggregation or duplication of known properties" in text
                    or "known properties of traditionally known" in text
                ),
                1.05,
            ),
            (
                "request for examination" in text,
                1.00,
            ),
            (
                (
                    "grant of patents" in title
                    or "found to be in order for grant" in text
                    or "patent shall be granted" in text
                ),
                1.05,
            ),
        )

        for matched, weight in section_signals:
            if matched:
                score += weight

        # Retrieval-query intent should reinforce targeted statutory searches.
        for phrase, weight in (
            ("true and first inventor", 0.30),
            ("section 3 p", 0.30),
            ("traditional knowledge", 0.22),
            ("request for examination", 0.30),
            ("section 11b", 0.25),
            ("grant of patent", 0.30),
            ("section 43", 0.25),
        ):
            if phrase in retrieval_query:
                score += weight

        # Ayurvedic/TK workflow queries should prefer the statutory
        # traditional-knowledge restriction over generic patent procedure.
        query_normalized = cls._normalize_text(query)
        if any(
            term in query_normalized
            for term in (
                "ayurvedic",
                "ayurveda",
                "traditional knowledge",
                "traditional medicine",
                "tkdl",
            )
        ):
            if (
                "in effect is traditional knowledge" in text
                or "traditionally known" in text
                or "traditional knowledge" in text
            ):
                score += 0.45

        return score

    @classmethod
    def _base_patent_score_for_workflow(
        cls,
        evidence: dict[str, Any],
        query: str,
    ) -> float:
        metadata = evidence.get("metadata") or {}
        title = cls._normalize_text(str(metadata.get("title") or ""))
        domain = cls._normalize_text(str(metadata.get("domain") or ""))
        text = cls._normalize_text(str(evidence.get("text") or ""))

        score = float(evidence.get("score") or 0.0)

        if domain == "patents":
            score += 0.35

        if "patent act" in title or "patents act" in title:
            score += 0.30

        if "government of india" in cls._normalize_text(
            str(metadata.get("authority") or "")
        ):
            score += 0.05

        # Retain a small semantic-overlap component without allowing
        # long queries to overpower statutory relevance.
        query_terms = [
            term
            for term in cls._normalize_text(query).split()
            if len(term) >= 4
        ]

        matched_terms = sum(
            1
            for term in query_terms
            if term in text
        )

        score += min(matched_terms * 0.025, 0.20)

        return score

    # ==============================================================
    # NORMAL PATENT EVIDENCE SCORING
    # ==============================================================

    def _patent_evidence_score(
        self,
        evidence: dict[str, Any],
        query: str,
    ) -> float:
        """
        Score patent evidence according to the actual query.
        """

        metadata = (
            evidence.get("metadata")
            or {}
        )

        title = self._normalize_text(
            str(
                metadata.get("title")
                or ""
            )
        )

        text = self._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        domain = self._normalize_text(
            str(
                metadata.get("domain")
                or ""
            )
        )

        retrieval_query = self._normalize_text(
            str(
                evidence.get(
                    "_retrieval_query"
                )
                or ""
            )
        )

        query_normalized = self._normalize_text(
            query
        )

        score = float(
            evidence.get("score")
            or 0.0
        )

        # ----------------------------------------------------------
        # Authority
        # ----------------------------------------------------------

        if domain == "patents":
            score += 0.35

        if "patent act" in title:
            score += 0.30

        if "patents act" in title:
            score += 0.30

        if "patent rules" in title:
            score += 0.18

        if "patent amendment" in title:
            score += 0.18

        # ----------------------------------------------------------
        # Query-specific overlap
        # ----------------------------------------------------------

        query_terms = [
            term
            for term in query_normalized.split()
            if len(term) >= 4
        ]

        matched_terms = sum(
            1
            for term in query_terms
            if term in text
        )

        score += min(
            matched_terms * 0.035,
            0.25,
        )

        # ----------------------------------------------------------
        # Patent concepts
        # ----------------------------------------------------------

        concept_weights = {
            "inventive step": 0.30,
            "prior art": 0.30,
            "novelty": 0.28,
            "patentability": 0.25,
            "invention": 0.12,
            "patent specification": 0.20,
            "complete specification": 0.20,
            "claims": 0.14,
            "claim": 0.12,
            "biological material": 0.28,
            "source and geographical origin": 0.40,
            "geographical origin": 0.28,
            "source of biological material": 0.28,
        }

        for phrase, weight in concept_weights.items():

            if phrase in text:
                score += weight

        # ----------------------------------------------------------
        # Retrieval-query relevance
        # ----------------------------------------------------------

        for phrase in (
            "patentability",
            "prior art",
            "novelty",
            "inventive step",
            "biological material",
            "source geographical origin",
            "complete specification",
        ):

            if phrase in retrieval_query:
                score += 0.10

        return score

    # ==============================================================
    # TK + PATENT FINAL EVIDENCE SELECTION
    # ==============================================================

    def _select_tk_patent_evidence(
        self,
        candidates: list[dict[str, Any]],
        query: str,
        max_results: int = 4,
    ) -> list[dict[str, Any]]:
        """
        Select high-quality evidence for traditional-knowledge
        + patent questions.
        """

        relevant = [
            item
            for item in candidates
            if self._is_relevant_tk_patent_evidence(
                item,
                query,
            )
        ]

        if not relevant:
            return []

        for item in relevant:
            item["_final_evidence_score"] = (
                self._tk_patent_evidence_score(
                    item,
                    query,
                )
            )

        relevant.sort(
            key=lambda item: float(
                item.get(
                    "_final_evidence_score"
                )
                or 0.0
            ),
            reverse=True,
        )

        statutory = [
            item
            for item in relevant
            if self._is_targeted_tk_patent_candidate(
                item
            )
        ]

        tkdl = [
            item
            for item in relevant
            if self._is_tkdl_evidence(
                item
            )
        ]

        other = [
            item
            for item in relevant
            if item not in statutory
            and item not in tkdl
        ]

        selected: list[
            dict[str, Any]
        ] = []

        selected_keys: set[
            tuple[Any, Any, str]
        ] = set()

        def evidence_key(
            item: dict[str, Any],
        ) -> tuple[Any, Any, str]:

            metadata = (
                item.get("metadata")
                or {}
            )

            text = self._normalize_text(
                str(
                    item.get("text")
                    or ""
                )
            )

            return (
                metadata.get(
                    "source_id"
                ),
                metadata.get(
                    "page"
                ),
                text[:300],
            )

        def add_item(
            item: dict[str, Any],
        ) -> None:

            key = evidence_key(
                item
            )

            if key in selected_keys:
                return

            if len(selected) >= max_results:
                return

            selected.append(
                item
            )

            selected_keys.add(
                key
            )

        # Strongest statutory result.
        if statutory:
            add_item(
                statutory[0]
            )

        # Up to two TKDL results.
        tkdl_count = 0

        for item in tkdl:

            if len(selected) >= max_results:
                break

            before = len(selected)

            add_item(
                item
            )

            if len(selected) > before:
                tkdl_count += 1

            if tkdl_count >= 2:
                break

        # Another statutory result.
        for item in statutory[1:]:

            if len(selected) >= max_results:
                break

            before = len(selected)

            add_item(
                item
            )

            if len(selected) > before:
                break

        # Other relevant evidence.
        for item in other:

            if len(selected) >= max_results:
                break

            add_item(
                item
            )

        # Final fallback.
        if len(selected) < max_results:

            for item in relevant:

                if len(selected) >= max_results:
                    break

                add_item(
                    item
                )

        for item in selected:
            item.pop(
                "_final_evidence_score",
                None,
            )

        return selected[:max_results]

    # ==============================================================
    # NORMAL PATENT FINAL EVIDENCE SELECTION
    # ==============================================================

    def _select_patent_evidence(
        self,
        candidates: list[dict[str, Any]],
        query: str,
        max_results: int = 4,
    ) -> list[dict[str, Any]]:
        """
        Select the strongest evidence for an ordinary patent query.

        Priority:
        1. Evidence directly matching the patent concept in question
        2. Patent Act evidence
        3. Relevant Patent Rules / amendments
        4. Other clearly relevant patent evidence
        """

        relevant = [
            item
            for item in candidates
            if self._is_relevant_patent_evidence(
                item,
                query,
            )
        ]

        if not relevant:
            return []

        for item in relevant:
            item["_final_evidence_score"] = (
                self._patent_evidence_score(
                    item,
                    query,
                )
            )

        relevant.sort(
            key=lambda item: float(
                item.get(
                    "_final_evidence_score"
                )
                or 0.0
            ),
            reverse=True,
        )

        selected: list[
            dict[str, Any]
        ] = []

        selected_keys: set[
            tuple[Any, Any, str]
        ] = set()

        source_counts: dict[
            str,
            int,
        ] = {}

        def evidence_key(
            item: dict[str, Any],
        ) -> tuple[Any, Any, str]:

            metadata = (
                item.get("metadata")
                or {}
            )

            text = self._normalize_text(
                str(
                    item.get("text")
                    or ""
                )
            )

            return (
                metadata.get(
                    "source_id"
                ),
                metadata.get(
                    "page"
                ),
                text[:300],
            )

        # ----------------------------------------------------------
        # First pass:
        # relevant source diversity
        # ----------------------------------------------------------

        for item in relevant:

            if len(selected) >= max_results:
                break

            key = evidence_key(
                item
            )

            if key in selected_keys:
                continue

            metadata = (
                item.get("metadata")
                or {}
            )

            source = str(
                metadata.get(
                    "source_id"
                )
                or "__unknown__"
            )

            if (
                source_counts.get(
                    source,
                    0,
                )
                >= 2
            ):
                continue

            selected.append(
                item
            )

            selected_keys.add(
                key
            )

            source_counts[source] = (
                source_counts.get(
                    source,
                    0,
                )
                + 1
            )

        # ----------------------------------------------------------
        # Second pass:
        # fill if needed
        # ----------------------------------------------------------

        if len(selected) < max_results:

            for item in relevant:

                if len(selected) >= max_results:
                    break

                key = evidence_key(
                    item
                )

                if key in selected_keys:
                    continue

                selected.append(
                    item
                )

                selected_keys.add(
                    key
                )

        for item in selected:
            item.pop(
                "_final_evidence_score",
                None,
            )

        return selected[:max_results]

    def _select_patent_workflow_evidence(
        self,
        candidates: list[dict[str, Any]],
        query: str,
        max_results: int = 6,
    ) -> list[dict[str, Any]]:
        """
        Select a balanced set of statutory evidence for patent-obtaining
        workflow questions.

        Workflow retrieval jobs may deliberately fetch statutory anchors
        that are not semantically close enough to the user's wording to pass
        the normal patent-relevance filter. Preserve those explicitly
        targeted workflow anchors so that key stages such as Section 6,
        Section 3(p), Section 11B, Section 16, and Section 43 are not lost.
        """

        relevant = []

        for item in candidates:
            evidence_text = self._normalize_text(
                str(item.get("text") or "")
            )

            # Form 12 is a special statutory request form under Sections
            # 26(1) and 52(2).
            #
            # OCR can represent "FORM 12" in several ways, including:
            #   "form 12"
            #   "f o r m 12"
            #   "f 0 r m 12"
            #
            # The last form is observed in the indexed OCR for page 66,
            # where the letter "O" is recognized as the digit "0".
            #
            # Exclude it before relevance scoring/bucketing so that the
            # document cannot consume the application/workflow slot merely
            # because it contains the words "request for grant of patent".
            is_form_12_special_request = (
                (
                    "form 12" in evidence_text
                    or "f o r m 12" in evidence_text
                    or "f 0 r m 12" in evidence_text
                )
                and (
                    "request for grant of patent under section 26(1)" in evidence_text
                    or "request for grant of patent under section 52(2)" in evidence_text
                    or "sections 26(1) & 52(2)" in evidence_text
                )
            )

            if is_form_12_special_request:
                continue

            # Section 3(p) is a critical statutory anchor for Ayurvedic /
            # traditional-knowledge patent workflow questions. Preserve it
            # before applying the generic patent relevance gate.
            is_section_3p = any(
                marker in evidence_text
                for marker in (
                    "in effect is traditional knowledge",
                    "known properties of traditionally known",
                    "traditionally known component",
                    "aggregation or duplication of known properties",
                    "section 3(p)",
                    "section 3 p",
                )
            )

            if is_section_3p:
                relevant.append(item)
                continue

            if self._is_relevant_patent_evidence(
                item,
                query,
            ):
                relevant.append(item)

        if not relevant:
            return []

        for item in relevant:
            item["_final_evidence_score"] = (
                self._patent_workflow_evidence_score(
                    item,
                    query,
                )
            )

        ranked = sorted(
            relevant,
            key=lambda item: float(
                item.get("_final_evidence_score") or 0.0
            ),
            reverse=True,
        )

        buckets = {
            "eligibility": [],
            "traditional_knowledge": [],
            "application": [],
            "examination": [],
            "grant": [],
            "other": [],
        }

        for item in ranked:
            text = self._normalize_text(
                str(item.get("text") or "")
            )
            title = self._normalize_text(
                str(
                    (item.get("metadata") or {}).get("title")
                    or ""
                )
            )

            # Exclude PCT / convention-application material from the core
            # domestic patent-issuance workflow. These provisions are valid
            # patent-law evidence but are not part of the normal workflow
            # the user is asking about.
            if any(
                marker in text
                for marker in (
                    "patent cooperation treaty",
                    "pct",
                    "convention application",
                    "convention applications",
                    "special provisions relating to convention applications",
                )
            ):
                buckets["other"].append(item)
                continue

            if (
                "persons entitled to apply for patents" in text
                or "true and first inventor" in text
                or "section 6" in text
            ):
                buckets["eligibility"].append(item)

            elif (
                "in effect is traditional knowledge" in text
                or "traditionally known" in text
                or "known properties of traditionally known" in text
                or "section 3(p)" in text
                or "section 3 p" in text
            ):
                buckets["traditional_knowledge"].append(item)

            elif (
                "request for examination" in text
                or "section 11b" in text
            ):
                buckets["examination"].append(item)

            elif (
                "grant of patents" in title
                or "found to be in order for grant" in text
                or "patent shall be granted" in text
                or "section 43" in text
            ):
                buckets["grant"].append(item)

            elif (
                (
                    "application for grant of patent" in text
                    or "application for a patent" in text
                    or "form 1" in text
                    or "provisional or a complete specification" in text
                    or "provisional/complete specification" in text
                )
                and "form 12" not in text
                and "request for grant of patent under section 26(1)" not in text
                and "request for grant of patent under section 52(2)" not in text
            ):
                buckets["application"].append(item)

            else:
                buckets["other"].append(item)

        selected = []
        selected_keys = set()

        def evidence_key(item):
            metadata = item.get("metadata") or {}
            text = self._normalize_text(
                str(item.get("text") or "")
            )

            return (
                metadata.get("source_id"),
                metadata.get("page"),
                text[:300],
            )

        def add_item(item):
            if len(selected) >= max_results:
                return

            key = evidence_key(item)

            if key in selected_keys:
                return

            selected.append(item)
            selected_keys.add(key)

        # Reserve the workflow slots around the actual patent-issuance path.
        #
        # Target composition:
        #   1 eligibility item
        #   1 traditional-knowledge / Section 3(p) item
        #   1 application/specification item
        #   2 examination items
        #   1 grant item
        #
        # This prevents unrelated PCT/convention/secrecy material from
        # displacing the examiner evidence needed to explain the workflow.
        bucket_limits = {
            "eligibility": 1,
            "traditional_knowledge": 1,
            "application": 1,
            "examination": 1,
            "grant": 1,
        }

        for bucket_name in (
            "eligibility",
            "traditional_knowledge",
            "application",
            "examination",
            "grant",
        ):
            added = 0

            for item in buckets[bucket_name]:
                before = len(selected)
                add_item(item)

                if len(selected) > before:
                    added += 1

                if added >= bucket_limits[bucket_name]:
                    break

                if len(selected) >= max_results:
                    break

            if len(selected) >= max_results:
                break

        # Do not fill remaining workflow slots with generic "other" patent
        # evidence. For statutory workflow questions, a smaller set of
        # directly relevant anchors is preferable to unrelated material.

        for item in selected:
            item.pop("_final_evidence_score", None)

        return selected[:max_results]

    def _select_multi_domain_evidence(
        self,
        candidates: list[dict[str, Any]],
        query: str,
        domains: list[str],
        max_results: int = 6,
    ) -> list[dict[str, Any]]:
        """Select evidence while preserving explicit domain coverage."""

        for item in candidates:
            item["_ranking_score"] = self._general_ranking_score(
                item,
                query,
                tk_patent_query=False,
            )

        ranked = sorted(
            candidates,
            key=lambda item: float(
                item.get("_ranking_score") or 0.0
            ),
            reverse=True,
        )

        selected: list[dict[str, Any]] = []
        selected_keys: set[tuple[Any, Any, str]] = set()
        source_counts: dict[str, int] = {}

        def evidence_key(item: dict[str, Any]) -> tuple[Any, Any, str]:
            metadata = item.get("metadata") or {}
            text = self._normalize_text(str(item.get("text") or ""))
            return (
                metadata.get("source_id"),
                metadata.get("page"),
                text[:300],
            )

        def add_item(item: dict[str, Any]) -> None:
            if len(selected) >= max_results:
                return

            key = evidence_key(item)
            if key in selected_keys:
                return

            metadata = item.get("metadata") or {}
            source_id = str(metadata.get("source_id") or "__unknown__")
            if source_counts.get(source_id, 0) >= 2:
                return

            selected.append(item)
            selected_keys.add(key)
            source_counts[source_id] = source_counts.get(source_id, 0) + 1

        for domain in domains:
            for item in ranked:
                metadata = item.get("metadata") or {}
                if metadata.get("domain") == domain:
                    before = len(selected)
                    add_item(item)
                    if len(selected) > before:
                        break

        for item in ranked:
            add_item(item)

        for item in selected:
            item.pop("_ranking_score", None)

        return selected[:max_results]

    # ==============================================================
    # GENERAL RANKING
    # ==============================================================

    def _general_ranking_score(
        self,
        evidence: dict[str, Any],
        query: str,
        tk_patent_query: bool,
    ) -> float:

        metadata = (
            evidence.get("metadata")
            or {}
        )

        text = self._normalize_text(
            str(
                evidence.get("text")
                or ""
            )
        )

        title = str(
            metadata.get("title")
            or ""
        ).lower()

        authority = str(
            metadata.get("authority")
            or ""
        ).lower()

        domain = str(
            metadata.get("domain")
            or ""
        ).lower()

        document_type = str(
            metadata.get("document_type")
            or ""
        ).lower()

        score = float(
            evidence.get("score")
            or 0.0
        )

        # ----------------------------------------------------------
        # General authority
        # ----------------------------------------------------------

        if domain == "patents":
            score += 0.12

        if "patent act" in title:
            score += 0.10

        if "patents act" in title:
            score += 0.10

        if "government of india" in authority:
            score += 0.03

        if "act" in document_type:
            score += 0.03

        # ----------------------------------------------------------
        # Query overlap
        # ----------------------------------------------------------

        query_terms = [
            term
            for term in query.lower().split()
            if len(term) >= 4
        ]

        matched_terms = sum(
            1
            for term in query_terms
            if term in text
        )

        score += min(
            matched_terms * 0.015,
            0.10,
        )

        # ----------------------------------------------------------
        # TK relevance
        # ----------------------------------------------------------

        if tk_patent_query:

            for phrase in (
                "traditional knowledge",
                "traditionally known",
                "known properties",
                "prior art",
                "patent",
                "invention",
            ):
                if phrase in text:
                    score += 0.04

        return score

    # ==============================================================
    # EVIDENCE RETRIEVAL
    # ==============================================================

    def retrieve_evidence(
        self,
        query: str,
        filters: dict[str, Any],
        k: int = 6,
    ) -> list[dict[str, Any]]:

        jurisdiction = filters.get(
            "jurisdiction"
        )

        source_id = filters.get(
            "source_id"
        )

        domain = filters.get(
            "domain"
        )

        domains = [
            str(item)
            for item in (filters.get("domains") or [])
            if item
        ]

        if not domains and domain:
            domains = [str(domain)]

        is_tk_patent_query = (
            self._is_traditional_knowledge_patent_query(
                query
            )
        )

        is_patent_query = (
            self._is_patent_query(
                query
            )
        )

        retrieval_jobs: list[
            tuple[str, str | None]
        ] = []

        if len(domains) > 1:
            for selected_domain in domains:
                if selected_domain == "gi":
                    retrieval_jobs.extend(
                        [
                            (
                                query,
                                "gi",
                            ),
                            (
                                f"{query} geographical indication definition GI Act India",
                                "gi",
                            ),
                            (
                                "geographical indication definition meaning "
                                "GI Act 1999 India",
                                "gi",
                            ),
                        ]
                    )

                elif selected_domain == "trademarks":
                    retrieval_jobs.extend(
                        [
                            (
                                query,
                                "trademarks",
                            ),
                            (
                                f"{query} trademark definition Trade Marks Act India",
                                "trademarks",
                            ),
                            (
                                "trade mark definition meaning "
                                "Trade Marks Act 1999 India",
                                "trademarks",
                            ),
                        ]
                    )

                elif selected_domain == "tk":
                    retrieval_jobs.extend(
                        [
                            (
                                query,
                                "tk",
                            ),
                            (
                                "traditional knowledge TKDL prior art India",
                                "tk",
                            ),
                        ]
                    )

                elif selected_domain == "abs":
                    retrieval_jobs.extend(
                        [
                            (
                                query,
                                "abs",
                            ),
                            (
                                "biological resources access benefit sharing India requirements",
                                "abs",
                            ),
                        ]
                    )

                elif selected_domain == "biodiversity":
                    retrieval_jobs.extend(
                        [
                            (
                                query,
                                "biodiversity",
                            ),
                            (
                                "National Biodiversity Authority biological resources "
                                "benefit sharing India",
                                "biodiversity",
                            ),
                        ]
                    )

        # ==========================================================
        # TK + PATENT QUERY
        # ==========================================================

        elif is_tk_patent_query:

            retrieval_jobs = [
                (
                    query,
                    "tk",
                ),
                (
                    query,
                    "patents",
                ),
                (
                    "traditional knowledge TKDL prior art "
                    "patent examination India",
                    "tk",
                ),
                (
                    "traditional knowledge TKDL prior art "
                    "patent examination India",
                    "patents",
                ),
                (
                    "traditional knowledge traditionally known "
                    "patent India",
                    "patents",
                ),
                (
                    "prior art traditional knowledge patent India",
                    "patents",
                ),
                (
                    "an invention which in effect is "
                    "traditional knowledge",
                    "patents",
                ),
                (
                    "aggregation or duplication of known "
                    "properties of traditionally known component",
                    "patents",
                ),
                (
                    "Section 3(p) traditional knowledge "
                    "patent India",
                    "patents",
                ),
                (
                    "Patents Act traditional knowledge "
                    "known properties",
                    "patents",
                ),
                (
                    "traditional knowledge patentability "
                    "India known properties",
                    "patents",
                ),
            ]

        # ==========================================================
        # NORMAL PATENT QUERY
        # ==========================================================

        elif is_patent_query or domain == "patents":

            is_patent_workflow = self._is_patent_workflow_query(
                query
            )

            if is_patent_workflow:
                retrieval_jobs = [
                    (
                        query,
                        "patents",
                    ),
                    (
                        "patent application true and first inventor India",
                        "patents",
                    ),
                    (
                        "patent application who can apply section 6 India",
                        "patents",
                    ),
                    (
                        "Section 3(p) traditional knowledge patent India",
                        "patents",
                    ),
                    (
                        "an invention which in effect is traditional knowledge",
                        "patents",
                    ),
                    (
                        "aggregation or duplication of known properties of traditionally known component",
                        "patents",
                    ),
                    (
                        "request for examination section 11B patent India",
                        "patents",
                    ),
                    (
                        "grant of patent section 43 India application in order",
                        "patents",
                    ),
                ]
            else:
                retrieval_jobs = [
                    (
                        query,
                        "patents",
                    ),
                    (
                        f"{query} patentability prior art novelty",
                        "patents",
                    ),
                    (
                        f"{query} inventive step patent examination",
                        "patents",
                    ),
                ]

            query_normalized = self._normalize_text(
                query
            )

            # ------------------------------------------------------
            # Biological-resource / source-origin queries
            # ------------------------------------------------------

            if any(
                phrase in query_normalized
                for phrase in (
                    "ashwagandha",
                    "biological material",
                    "biological resource",
                    "source",
                    "geographical origin",
                )
            ):

                retrieval_jobs.extend(
                    [
                        (
                            "patent biological material "
                            "source geographical origin India",
                            "patents",
                        ),
                        (
                            "patent biological resource "
                            "source geographical origin "
                            "disclosure India",
                            "patents",
                        ),
                    ]
                )

            # ------------------------------------------------------
            # Specification queries
            # ------------------------------------------------------

            if any(
                phrase in query_normalized
                for phrase in (
                    "specification",
                    "complete specification",
                    "claims",
                    "claim",
                    "disclosure",
                )
            ):

                retrieval_jobs.extend(
                    [
                        (
                            "complete specification "
                            "patent India requirements",
                            "patents",
                        ),
                        (
                            "patent claims disclosure "
                            "specification India",
                            "patents",
                        ),
                    ]
                )

        # ==========================================================
        # NORMAL TK QUERY
        # ==========================================================

        elif domain == "tk":

            retrieval_jobs = [
                (
                    query,
                    "tk",
                ),
                (
                    "traditional knowledge TKDL prior art "
                    "patent examination India",
                    "tk",
                ),
                (
                    "aggregation duplication known properties "
                    "traditionally known component",
                    "tk",
                ),
            ]

        # ==========================================================
        # ABS QUERY
        # ==========================================================

        elif domain == "abs":

            retrieval_jobs = [
                (
                    query,
                    "abs",
                ),
                (
                    "biological resources access "
                    "benefit sharing India requirements",
                    "abs",
                ),
            ]

        # ==========================================================
        # OTHER DOMAIN
        # ==========================================================

        else:

            retrieval_jobs = [
                (
                    query,
                    domain,
                ),
            ]

        # ==========================================================
        # DEDUPLICATE RETRIEVAL JOBS
        # ==============================================================

        unique_jobs: list[
            tuple[str, str | None]
        ] = []

        seen_jobs: set[
            tuple[str, str | None]
        ] = set()

        for search_query, search_domain in retrieval_jobs:

            key = (
                search_query.strip().lower(),
                search_domain,
            )

            if key in seen_jobs:
                continue

            seen_jobs.add(
                key
            )

            unique_jobs.append(
                (
                    search_query,
                    search_domain,
                )
            )

        # ==========================================================
        # RETRIEVE MANY CANDIDATES
        # ==============================================================

        all_candidates: list[
            dict[str, Any]
        ] = []

        for search_query, search_domain in unique_jobs:

            if not search_domain and not domain:
                continue

            try:

                results = self.retriever.retrieve(
                    search_query,
                    jurisdiction=jurisdiction,
                    domain=search_domain,
                    source_id=source_id,
                    k=max(k, 50),
                )

            except TypeError:

                results = self.retriever.retrieve(
                    search_query,
                    jurisdiction=jurisdiction,
                    domain=search_domain,
                    k=max(k, 50),
                )

            if not results:
                continue

            for result in results:

                result["_retrieval_query"] = (
                    search_query
                )

                all_candidates.append(
                    result
                )

        if not all_candidates:
            return []

        # ==========================================================
        # DEDUPLICATE EVIDENCE CHUNKS
        # ==============================================================

        deduped: dict[
            tuple[Any, Any, str],
            dict[str, Any],
        ] = {}

        for item in all_candidates:

            metadata = (
                item.get("metadata")
                or {}
            )

            text = self._normalize_text(
                str(
                    item.get("text")
                    or ""
                )
            )

            key = (
                metadata.get(
                    "source_id"
                ),
                metadata.get(
                    "page"
                ),
                text[:300],
            )

            if key not in deduped:

                deduped[key] = item
                continue

            existing = deduped[key]

            if is_tk_patent_query:

                existing_score = (
                    self._statutory_tk_priority(
                        existing
                    )
                )

                new_score = (
                    self._statutory_tk_priority(
                        item
                    )
                )

            elif is_patent_query:

                if self._is_patent_workflow_query(query):
                    existing_score = (
                        self._patent_workflow_evidence_score(
                            existing,
                            query,
                        )
                    )

                    new_score = (
                        self._patent_workflow_evidence_score(
                            item,
                            query,
                        )
                    )
                else:
                    existing_score = (
                        self._patent_evidence_score(
                            existing,
                            query,
                        )
                    )

                    new_score = (
                        self._patent_evidence_score(
                            item,
                            query,
                        )
                    )

            else:

                existing_score = float(
                    existing.get("score")
                    or 0.0
                )

                new_score = float(
                    item.get("score")
                    or 0.0
                )

            if new_score > existing_score:
                deduped[key] = item

        candidates = list(
            deduped.values()
        )

        # ==========================================================
        # GENERAL RANKING
        # ==============================================================

        is_patent_workflow = self._is_patent_workflow_query(
            query
        )

        for item in candidates:

            if is_patent_workflow:
                item["_ranking_score"] = (
                    self._patent_workflow_evidence_score(
                        item,
                        query,
                    )
                )
            else:
                item["_ranking_score"] = (
                    self._general_ranking_score(
                        item,
                        query,
                        is_tk_patent_query,
                    )
                )

        candidates.sort(
            key=lambda item: float(
                item.get(
                    "_ranking_score"
                )
                or 0.0
            ),
            reverse=True,
        )

        # ==========================================================
        # FINAL PRECISION SELECTION
        # ==============================================================

        if len(domains) > 1:

            final_results = self._select_multi_domain_evidence(
                candidates=candidates,
                query=query,
                domains=domains,
                max_results=6,
            )

        elif is_tk_patent_query:

            final_results = (
                self._select_tk_patent_evidence(
                    candidates=candidates,
                    query=query,
                    max_results=4,
                )
            )

        elif is_patent_query or domain == "patents":

            if self._is_patent_workflow_query(query):
                final_results = (
                    self._select_patent_workflow_evidence(
                        candidates=candidates,
                        query=query,
                        max_results=6,
                    )
                )
            else:
                final_results = (
                    self._select_patent_evidence(
                        candidates=candidates,
                        query=query,
                        max_results=4,
                    )
                )

        else:

            # ======================================================
            # NORMAL QUERY SELECTION
            # ======================================================

            selected: list[
                dict[str, Any]
            ] = []

            source_counts: dict[
                str,
                int,
            ] = {}

            for item in candidates:

                if len(selected) >= k:
                    break

                metadata = (
                    item.get("metadata")
                    or {}
                )

                source = str(
                    metadata.get(
                        "source_id"
                    )
                    or "__unknown__"
                )

                if (
                    source_counts.get(
                        source,
                        0,
                    )
                    >= 2
                ):
                    continue

                selected.append(
                    item
                )

                source_counts[source] = (
                    source_counts.get(
                        source,
                        0,
                    )
                    + 1
                )

            if len(selected) < k:

                for item in candidates:

                    if len(selected) >= k:
                        break

                    if item in selected:
                        continue

                    selected.append(
                        item
                    )

            final_results = selected[:k]

        # ==========================================================
        # CLEAN INTERNAL FIELDS
        # ==============================================================

        for item in final_results:

            item.pop(
                "_ranking_score",
                None,
            )

            item.pop(
                "_final_evidence_score",
                None,
            )

            item.pop(
                "_retrieval_query",
                None,
            )

        return final_results

    # ==============================================================
    # ANSWER QUERY
    # ==============================================================

    def answer_query(
        self,
        query: str,
        jurisdiction: str = "india",
        language: str = "en",
        innovation_id: str | None = None,
    ) -> dict[str, Any]:

        filters = self.interpret_filters(
            query
        )

        # Explicit API jurisdiction takes priority.
        if jurisdiction:
            filters["jurisdiction"] = (
                jurisdiction.lower()
            )

        evidence = self.retrieve_evidence(
            query=query,
            filters=filters,
            k=6,
        )

        self._last_evidence = evidence

        result = self.build_answer(
            query=query,
            evidence=evidence,
        )

        # ----------------------------------------------------------
        # Format citations
        # ----------------------------------------------------------

        try:

            sources = (
                self.citation_service.format_citations(
                    evidence
                )
            )

        except Exception:

            sources = []

        return {
            "answer": result.get(
                "answer",
                "",
            ),
            "confidence": result.get(
                "confidence",
                0.0,
            ),
            "key_points": result.get(
                "key_points",
                [],
            ),
            "sources": sources,
            "evidence": evidence,
            "language": language,
            "jurisdiction": filters.get(
                "jurisdiction"
            ),
            "domain": filters.get(
                "domain"
            ),
            "innovation_id": innovation_id,
            "disclaimer": (
                "This information is not legal advice."
            ),
        }

    # ==============================================================
    # FALLBACK ANSWER
    # ==============================================================

    def build_answer(
        self,
        query: str,
        evidence: list[dict[str, Any]],
    ) -> dict[str, Any]:

        if not evidence:

            return {
                "answer": (
                    "Reliable evidence was not found in the "
                    "available knowledge base."
                ),
                "confidence": 0.0,
                "key_points": [],
            }

        # ==========================================================
        # EVIDENCE-QUALITY CONFIDENCE
        # ==========================================================

        scores = [
            float(
                item.get("score")
                or 0.0
            )
            for item in evidence
        ]

        best_score = (
            max(scores)
            if scores
            else 0.0
        )

        metadata_items = [
            item.get("metadata")
            or {}
            for item in evidence
        ]

        titles = [
            str(
                metadata.get("title")
                or ""
            ).lower()
            for metadata in metadata_items
        ]

        domains = [
            str(
                metadata.get("domain")
                or ""
            ).lower()
            for metadata in metadata_items
        ]

        evidence_text = [
            self._normalize_text(
                str(
                    item.get("text")
                    or ""
                )
            )
            for item in evidence
        ]

        confidence = 0.45

        confidence += min(
            best_score * 0.15,
            0.12,
        )

        if len(evidence) >= 2:
            confidence += 0.05

        if len(evidence) >= 3:
            confidence += 0.05

        # ----------------------------------------------------------
        # Statutory evidence
        # ----------------------------------------------------------

        has_statutory_evidence = any(
            (
                "patent act" in title
                or "patents act" in title
            )
            and (
                "traditional knowledge" in text
                or "traditionally known" in text
                or "section 3" in text
            )
            for title, text in zip(
                titles,
                evidence_text,
            )
        )

        if has_statutory_evidence:
            confidence += 0.12

        # ----------------------------------------------------------
        # TKDL / TK evidence
        # ----------------------------------------------------------

        has_tk_evidence = any(
            (
                domain == "tk"
                or "tkdl" in title
                or (
                    "traditional knowledge digital library"
                    in text
                )
            )
            for domain, title, text in zip(
                domains,
                titles,
                evidence_text,
            )
        )

        if has_tk_evidence:
            confidence += 0.10

        # ----------------------------------------------------------
        # Direct Section 3(p)
        # ----------------------------------------------------------

        has_section_3p = any(
            (
                "section 3(p)" in text
                or "section 3 p" in text
                or (
                    "in effect is traditional knowledge"
                    in text
                )
            )
            for text in evidence_text
        )

        if has_section_3p:
            confidence += 0.10

        # ----------------------------------------------------------
        # TK + patent combination
        # ----------------------------------------------------------

        if self._is_traditional_knowledge_patent_query(
            query
        ):

            if (
                has_statutory_evidence
                and has_tk_evidence
            ):
                confidence += 0.05

        # ----------------------------------------------------------
        # General patent evidence
        # ----------------------------------------------------------

        if self._is_patent_query(
            query
        ):

            if self._is_patent_workflow_query(query):
                workflow_text = evidence_text
                has_eligibility = any(
                    "true and first inventor" in item
                    or "persons entitled to apply for patents" in item
                    for item in workflow_text
                )
                has_examination = any(
                    "request for examination" in item
                    for item in workflow_text
                )
                has_grant = any(
                    "found to be in order for grant" in item
                    or "patent shall be granted" in item
                    for item in workflow_text
                )
                has_tk_guard = any(
                    "in effect is traditional knowledge" in item
                    or "traditionally known" in item
                    for item in workflow_text
                )

                workflow_anchor_count = sum(
                    (
                        has_eligibility,
                        has_examination,
                        has_grant,
                        has_tk_guard,
                    )
                )

                confidence += min(
                    workflow_anchor_count * 0.04,
                    0.16,
                )

            patent_evidence_count = sum(
                1
                for item in evidence
                if self._is_relevant_patent_evidence(
                    item,
                    query,
                )
            )

            if patent_evidence_count >= 2:
                confidence += 0.05

            if patent_evidence_count >= 3:
                confidence += 0.04

        # ----------------------------------------------------------
        # Clamp
        # ----------------------------------------------------------

        confidence = min(
            0.95,
            max(
                0.35,
                confidence,
            ),
        )

        # ==========================================================
        # ==========================================================
        # PATENT WORKFLOW ANSWER
        # ==========================================================

        if (
            self._is_patent_workflow_query(query)
            and not self._is_traditional_knowledge_patent_query(query)
        ):

            workflow_text = evidence_text

            has_eligibility = any(
                "persons entitled to apply for patents" in item
                or "true and first inventor" in item
                or "assignee of the person claiming to be the true and first inventor" in item
                or "legal representative of any deceased person" in item
                for item in workflow_text
            )

            # Section 6 evidence can be split across
            # multiple retrieved chunks/pages. Therefore the
            # three statutory categories must NOT be required
            # to occur in the same evidence item.
            has_section6_inventor = any(
                "true and first inventor" in item
                for item in workflow_text
            )

            has_section6_assignee = any(
                "assignee of the person claiming to be the true and first inventor"
                in item
                for item in workflow_text
            )

            has_section6_legal_representative = any(
                "legal representative of any deceased person" in item
                for item in workflow_text
            )

            has_section6_categories = (
                has_section6_inventor
                or has_section6_assignee
                or has_section6_legal_representative
            )

            has_tk_guard = any(
                "in effect is traditional knowledge" in item
                or "traditionally known" in item
                or "known properties of traditionally known" in item
                for item in workflow_text
            )

            has_examination = any(
                "request for examination" in item
                or "application shall be examined" in item
                for item in workflow_text
            )

            has_examiner = any(
                "examiner" in item
                and (
                    "investigation" in item
                    or "ascertaining whether" in item
                )
                for item in workflow_text
            )

            has_grant = any(
                "found to be in order for grant" in item
                or "patent shall be granted" in item
                or "grant of patents" in item
                for item in workflow_text
            )

            query_normalized = self._normalize_text(query)

            is_ayurvedic = any(
                term in query_normalized
                for term in (
                    "ayurvedic",
                    "ayurveda",
                    
                )
            )

            answer_parts = []

            if is_ayurvedic:
                answer_parts.append(
                    "For an Ayurvedic practitioner, being an Ayurvedic "
                    "practitioner by itself does not determine whether "
                    "a patent will be granted. The practitioner may apply "
                    "if the practitioner is legally entitled to apply "
                    "under the Patents Act, and the claimed invention "
                    "must satisfy the applicable patent requirements."
                )

            if has_eligibility or (
                is_ayurvedic and has_section6_categories
            ):
                if has_section6_categories:
                    answer_parts.append(
                        "Under Section 6 of the Patents Act, an application "
                        "may be made by the true and first inventor, by an "
                        "assignee of the person claiming to be the true and "
                        "first inventor in respect of the right to make the "
                        "application, or by the legal representative of a "
                        "deceased person who was entitled to make the "
                        "application. These applicants may apply alone or "
                        "jointly with another person."
                    )
                else:
                    answer_parts.append(
                        "The applicant must be a person entitled to "
                        "apply for a patent. The cited Patent Act evidence "
                        "identifies the true and first inventor and persons "
                        "deriving the right to apply from that inventor."
                    )

            if is_ayurvedic and has_tk_guard:
                answer_parts.append(
                    "For Ayurvedic or traditional-knowledge subject "
                    "matter, Section 3(p) is particularly important. "
                    "The cited Act excludes an invention which, in "
                    "effect, is traditional knowledge, as well as an "
                    "aggregation or duplication of known properties "
                    "of traditionally known components. A genuinely "
                    "new invention must still satisfy the other "
                    "applicable patentability requirements."
                )

            if has_examination:
                answer_parts.append(
                    "After the application is filed, a request for "
                    "examination is required within the applicable "
                    "prescribed period. The cited evidence identifies "
                    "this requirement under Section 11B."
                )

            if has_examiner:
                answer_parts.append(
                    "The examiner then investigates the application "
                    "against the applicable patent requirements and "
                    "prior-art provisions."
                )

            if has_grant:
                answer_parts.append(
                    "If the application is found to be in order for "
                    "grant, is not refused, and is not in contravention "
                    "of the applicable provisions, the patent is granted "
                    "under the cited grant provision."
                )

            if len(answer_parts) == 1:
                answer_parts.append(
                    "The available evidence supports reviewing the "
                    "patent application, examination, and grant "
                    "requirements before determining whether the "
                    "claimed invention can receive a patent."
                )

            key_points = []

            if has_eligibility or (
                is_ayurvedic and has_section6_categories
            ):
                if has_section6_categories:
                    key_points.append(
                        "Section 6 permits application by the true and "
                        "first inventor, an eligible assignee, or the "
                        "legal representative of a deceased entitled person."
                    )
                else:
                    key_points.append(
                        "Confirm that the applicant is entitled to apply "
                        "for the patent."
                    )

            if is_ayurvedic and has_tk_guard:
                key_points.append(
                    "Check Section 3(p) carefully where the claimed "
                    "subject matter involves Ayurvedic or traditional "
                    "knowledge."
                )
                key_points.append(
                    "Traditional knowledge itself, or duplication of "
                    "known properties of traditionally known "
                    "components, may be excluded from patentability."
                )

            if has_examination:
                key_points.append(
                    "A request for examination is part of the "
                    "patent-obtaining process."
                )

            if has_examiner:
                key_points.append(
                    "The examiner investigates the claimed invention "
                    "against the applicable patent requirements."
                )

            if has_grant:
                key_points.append(
                    "Grant follows when the application is found "
                    "to be in order and is not refused or otherwise "
                    "in contravention of the Act."
                )

            return {
                "answer": " ".join(answer_parts),
                "confidence": round(confidence, 2),
                "key_points": key_points,
            }

        # TK + PATENT FALLBACK
        # ==============================================================

        if self._is_traditional_knowledge_patent_query(
            query
        ):

            answer = (
                "Traditional knowledge can affect a patent "
                "application in India because Indian patent law "
                "excludes certain inventions that are effectively "
                "traditional knowledge or that amount to an "
                "aggregation or duplication of known properties "
                "of traditionally known components. The relevant "
                "patent-law provisions and available traditional "
                "knowledge or prior-art material should therefore "
                "be considered when assessing patentability."
            )

            key_points = [
                (
                    "Check whether the claimed subject matter "
                    "is already traditional knowledge or reflects "
                    "traditionally known properties."
                ),
                (
                    "Review the relevant provisions of the "
                    "Patents Act together with available TKDL "
                    "or prior-art material."
                ),
                (
                    "Use the cited official evidence before "
                    "making a patentability decision."
                ),
            ]

            return {
                "answer": answer,
                "confidence": round(
                    confidence,
                    2,
                ),
                "key_points": key_points,
            }

        # ==========================================================
        # GENERIC FALLBACK
        # ==============================================================

        titles_for_answer: list[str] = []

        for item in evidence[:3]:

            metadata = (
                item.get("metadata")
                or {}
            )

            title = str(
                metadata.get("title")
                or ""
            ).strip()

            if (
                title
                and title not in titles_for_answer
            ):
                titles_for_answer.append(
                    title
                )

        if titles_for_answer:

            answer = (
                "Relevant evidence was retrieved from the "
                "knowledge base, including: "
                + ", ".join(
                    titles_for_answer
                )
                + "."
            )

        else:

            answer = (
                "Relevant evidence was retrieved from the "
                "available knowledge base."
            )

        key_points = [
            (
                "Review the cited evidence for the specific "
                "legal or regulatory requirement."
            ),
            (
                "Confirm the applicable jurisdiction and current "
                "rules before taking action."
            ),
        ]

        return {
            "answer": answer,
            "confidence": round(
                confidence,
                2,
            ),
            "key_points": key_points,
        }

