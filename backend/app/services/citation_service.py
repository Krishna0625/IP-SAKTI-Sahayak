from __future__ import annotations

import re
from typing import Any


class CitationService:
    """
    Formats and validates RAG evidence for the API response.

    Evidence numbers remain aligned with the final evidence order
    passed to Gemini and displayed by the frontend.
    """

    def __init__(self) -> None:
        self.enabled = True

    # ==============================================================
    # TITLE NORMALIZATION
    # ==============================================================

    @staticmethod
    def normalize_title(title: Any) -> str:
        """
        Clean known source-title spelling/capitalization issues.
        """
        original = str(title or "Official document").strip()

        if not original:
            return "Official document"

        normalized = " ".join(original.split())

        known_titles = {
            "tkdl traditional knowlage information":
                "TKDL Traditional Knowledge Information",
            "tkdl traditional knowledge information":
                "TKDL Traditional Knowledge Information",
            "tkdl public avilable resources":
                "TKDL Publicly Available Resources",
            "tkdl public available resources":
                "TKDL Publicly Available Resources",
        }

        key = normalized.lower()

        if key in known_titles:
            return known_titles[key]

        normalized = re.sub(
            r"\btkdl\b",
            "TKDL",
            normalized,
            flags=re.IGNORECASE,
        )

        normalized = re.sub(
            r"\bknowlage\b",
            "Knowledge",
            normalized,
            flags=re.IGNORECASE,
        )

        normalized = re.sub(
            r"\bavilable\b",
            "Available",
            normalized,
            flags=re.IGNORECASE,
        )

        return normalized

    # ==============================================================
    # NORMALIZE OCR TEXT
    # ==============================================================

    @staticmethod
    def _normalize_text(text: str) -> str:
        """
        Normalize extracted/OCR text for reliable matching.
        """
        text = str(text or "").lower()

        replacements = {
            "\n": " ",
            "\r": " ",
            "\t": " ",
            "–": "-",
            "—": "-",
        }

        for old, new in replacements.items():
            text = text.replace(old, new)

        return " ".join(text.split())

    # ==============================================================
    # EXPLICIT SECTION DETECTION
    # ==============================================================

    @staticmethod
    def _has_explicit_section(
        normalized_text: str,
        section_pattern: str,
    ) -> bool:
        """
        Check whether the retrieved evidence text explicitly contains
        the requested legal section reference.

        This is deliberately conservative. We do not infer an exact
        provision number merely because the wording resembles a known
        provision.
        """
        return bool(
            re.search(
                section_pattern,
                normalized_text,
                flags=re.IGNORECASE,
            )
        )

    # ==============================================================
    # MEANINGFUL PROVISION EXTRACTION
    # ==============================================================

    def extract_section(self, text: str) -> str | None:
        """
        Extract the most meaningful legal provision/reference
        supported by the retrieved evidence text.

        Exact provision numbers are returned only when the evidence
        text explicitly supports them. Otherwise, descriptive labels
        are used.
        """
        if not text:
            return None

        normalized = self._normalize_text(text)

        # ==========================================================
        # 1. TRADITIONAL KNOWLEDGE / SECTION 3(P)
        # ==========================================================

        explicit_section_3p = (
            self._has_explicit_section(
                normalized,
                r"\bsection\s*3\s*\(\s*p\s*\)",
            )
            or self._has_explicit_section(
                normalized,
                r"\bsection\s+3\s+p\b",
            )
        )

        if explicit_section_3p:
            return "Section 3(p)"

        # Strong textual evidence for Section 3(p), even if OCR
        # removed the literal section heading.
        if (
            "invention which, in effect, is traditional knowledge"
            in normalized
            or
            "invention which in effect is traditional knowledge"
            in normalized
            or (
                "traditional knowledge" in normalized
                and
                "known properties of traditionally known"
                in normalized
            )
        ):
            return "Traditional Knowledge / Section 3(p)"

        # ==========================================================
        # 2. SOURCE / GEOGRAPHICAL ORIGIN
        # ==========================================================

        biological_origin_signals = (
            "source and geographical origin",
            "source and geographic origin",
            "geographical origin of the biological material",
            "geographic origin of the biological material",
        )

        if any(
            signal in normalized
            for signal in biological_origin_signals
        ):
            # Only show Section 10(4)(D) if the text explicitly
            # identifies Section 10(4)(D).
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*10\s*\(\s*4\s*\)\s*\(\s*d\s*\)",
            ):
                return "Section 10(4)(D)"

            # OCR/PDF extraction may preserve "(D)" but omit
            # the section heading. In that case use a descriptive
            # label instead of pretending the exact provision was
            # explicitly present.
            if re.search(
                r"\(\s*d\s*\)\s*disclose\s+the\s+source\s+and\s+"
                r"geographical\s+origin",
                normalized,
                flags=re.IGNORECASE,
            ):
                return "Source / geographical origin disclosure"

            if "disclose the source and geographical origin" in normalized:
                return "Source / geographical origin disclosure"

        # ==========================================================
        # 3. BUDAPEST TREATY / BIOLOGICAL MATERIAL DEPOSIT
        # ==========================================================

        if (
            "budapest treaty" in normalized
            and "deposit" in normalized
            and "biological material" in normalized
        ):
            # Exact section only when explicitly present.
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*10\s*\(\s*4\s*\)\s*\(\s*a\s*\)",
            ):
                return "Section 10(4)(A)"

            if self._has_explicit_section(
                normalized,
                r"\bsection\s*10\s*\(\s*4\s*\)",
            ):
                return "Section 10(4)"

            if "not later than the date of filing" in normalized:
                return "Budapest Treaty / biological material deposit"

            return "Budapest Treaty / biological material deposit"

        # ==========================================================
        # 4. FORM 2 / COMPLETE SPECIFICATION
        # ==========================================================

        if (
            "form 2" in normalized
            and "complete specification" in normalized
        ):
            has_rule_13 = (
                "rule13" in normalized
                or "rule 13" in normalized
            )

            # Form 2 itself commonly includes the explicit
            # "See section 10 and rule 13" wording. Only label
            # the exact provision when that wording exists.
            has_section_10 = self._has_explicit_section(
                normalized,
                r"\bsection\s*10\b",
            )

            if has_rule_13 and has_section_10:
                return "Form 2 / Section 10 / Rule 13"

            if has_rule_13:
                return "Form 2 / Rule 13"

            if has_section_10:
                return "Form 2 / Section 10"

            return "Form 2 / Complete Specification"

        # ==========================================================
        # 5. COMPLETE SPECIFICATION / CLAIMS
        # ==========================================================

        if (
            "the claim or claims of a complete specification"
            in normalized
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*10\b",
            ):
                return "Section 10"

            return "Complete Specification / Claims"

        if (
            "complete specification does not sufficiently"
            in normalized
            and
            "clearly describe the invention"
            in normalized
        ):
            return "Complete Specification"

        # ==========================================================
        # 6. SOURCE / ORIGIN AS A REVOCATION GROUND
        # ==========================================================

        if (
            "wrongly mentions the source and geographical origin"
            in normalized
            or
            "does not disclose or wrongly mentions the source"
            in normalized
        ):
            # Exact section only if explicitly visible.
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*64\s*\(\s*1\s*\)\s*\(\s*j\s*\)",
            ):
                return "Section 64(1)(j)"

            return "Source / geographical origin as revocation ground"

        # ==========================================================
        # 7. INVENTIVE STEP / OBVIOUSNESS
        # ==========================================================

        if (
            "does not involve any inventive step"
            in normalized
            or
            "inventive step" in normalized
            or
            "obvious" in normalized
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*64\s*\(\s*1\s*\)\s*\(\s*e\s*\)",
            ):
                return "Section 64(1)(e)"

            if self._has_explicit_section(
                normalized,
                r"\bsection\s*2\s*\(\s*1\s*\)\s*\(\s*ja\s*\)",
            ):
                return "Section 2(1)(ja)"

            return "Inventive Step / Obviousness"

        # ==========================================================
        # 8. SECTION 8 DISCLOSURE
        # ==========================================================

        if (
            "information required by section 8"
            in normalized
            or
            (
                "failed to disclose to the controller"
                in normalized
                and
                "section 8" in normalized
            )
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s*64\s*\(\s*1\s*\)\s*\(\s*h\s*\)",
            ):
                return "Section 64(1)(h)"

            return "Section 8 disclosure"

        # ==========================================================
        # 9. GENERIC SECTION / ARTICLE / RULE / CLAUSE
        # ==========================================================

        patterns = [
            r"\bsection\s+\d+(?:\s*\(\s*[a-z0-9]+\s*\))*",
            r"\barticle\s+[a-z0-9.-]+",
            r"\brule\s+[a-z0-9.-]+",
            r"\bclause\s+[a-z0-9.-]+",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                normalized,
                flags=re.IGNORECASE,
            )

            if not match:
                continue

            value = match.group(0).strip()

            value = re.sub(
                r"^section\b",
                "Section",
                value,
                flags=re.IGNORECASE,
            )

            value = re.sub(
                r"^article\b",
                "Article",
                value,
                flags=re.IGNORECASE,
            )

            value = re.sub(
                r"^rule\b",
                "Rule",
                value,
                flags=re.IGNORECASE,
            )

            value = re.sub(
                r"^clause\b",
                "Clause",
                value,
                flags=re.IGNORECASE,
            )

            return value

        return None

    # ==============================================================
    # SOURCE ENTRY
    # ==============================================================

    def build_source_entry(
        self,
        item: dict[str, Any],
        evidence_number: int,
    ) -> dict[str, Any]:
        """
        Convert one evidence item into a citation/source entry.

        Content-aware extraction is preferred over generic metadata
        section values when the evidence text gives a supported
        provision or descriptive citation label.
        """

        metadata = item.get("metadata") or {}

        text = str(
            item.get("text") or ""
        )

        metadata_section = str(
            metadata.get("section") or ""
        ).strip()

        # Prefer what the evidence text actually supports.
        extracted_section = self.extract_section(text)

        section = (
            extracted_section
            or metadata_section
        )

        # ==========================================================
        # PAGE
        # ==============================================================

        page = metadata.get("page")

        parsed_page: int | None = None

        if (
            page is not None
            and str(page).strip()
        ):
            try:
                parsed_page = int(page)
            except (
                TypeError,
                ValueError,
            ):
                parsed_page = None

        # ==========================================================
        # RELEVANCE
        # ==============================================================

        try:
            relevance = round(
                float(
                    item.get(
                        "score",
                        0.0,
                    )
                ),
                4,
            )
        except (
            TypeError,
            ValueError,
        ):
            relevance = 0.0

        # ==========================================================
        # DISPLAY TITLE
        # ==============================================================

        display_title = self.normalize_title(
            metadata.get(
                "title",
                "Official document",
            )
        )

        # ==========================================================
        # CITATION ENTRY
        # ==============================================================

        entry: dict[str, Any] = {
            "evidence_number": evidence_number,
            "id": metadata.get(
                "source_id",
                "",
            ),
            "title": display_title,
            "authority": metadata.get(
                "authority",
                "",
            ),
            "jurisdiction": metadata.get(
                "jurisdiction",
                "",
            ),
            "domain": metadata.get(
                "domain",
                "",
            ),
            "page": parsed_page,
            "relevance": relevance,
        }

        if section:
            entry["section"] = section

        if metadata.get("official_url"):
            entry["url"] = metadata.get(
                "official_url"
            )

        return entry

    # ==============================================================
    # SOURCE VALIDATION
    # ==============================================================

    def validate_sources(
        self,
        evidence: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Remove evidence without minimum citation metadata.
        """

        valid: list[dict[str, Any]] = []

        for item in evidence:
            metadata = (
                item.get("metadata")
                or {}
            )

            if not metadata.get("source_id"):
                continue

            if not metadata.get("title"):
                continue

            valid.append(item)

        return valid

    # ==============================================================
    # FORMAT CITATIONS
    # ==============================================================

    def format_citations(
        self,
        evidence: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Convert validated evidence into numbered citation entries.

        evidence[0] -> EVIDENCE 1
        evidence[1] -> EVIDENCE 2
        evidence[2] -> EVIDENCE 3
        """

        valid = self.validate_sources(evidence)

        if not valid:
            return []

        sources: list[dict[str, Any]] = []

        for number, item in enumerate(
            valid,
            start=1,
        ):
            sources.append(
                self.build_source_entry(
                    item=item,
                    evidence_number=number,
                )
            )

        return sources

    # ==============================================================
    # INSUFFICIENT EVIDENCE
    # ==============================================================

    def insufficient_message(self) -> str:
        return (
            "Reliable evidence was not found in the "
            "available knowledge base."
        )