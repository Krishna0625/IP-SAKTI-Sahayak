from __future__ import annotations

import re
from typing import Any


class CitationService:
    """
    Formats and validates RAG evidence for the API response.

    Evidence numbers remain aligned with the final evidence order
    passed to Gemini and displayed by the frontend.

    Citation labels are intentionally conservative:
    - Exact statutory provisions are shown only when supported by
      the retrieved evidence text.
    - Descriptive labels are used when the evidence clearly supports
      a topic but does not expose an exact provision number.
    - Metadata section values are not trusted unless the evidence
      text itself supports them.
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
        original = str(
            title or "Official document"
        ).strip()

        if not original:
            return "Official document"

        normalized = " ".join(
            original.split()
        )

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
            "−": "-",
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
    # METADATA SECTION SUPPORT
    # ==============================================================

    @staticmethod
    def _metadata_section_supported_by_text(
        metadata_section: str,
        normalized_text: str,
    ) -> bool:
        """
        Return True only when the metadata section/reference is
        actually supported by the retrieved evidence text.

        This prevents metadata such as "Section 5" or "Section 134"
        from being displayed when the evidence chunk itself does not
        contain or support that provision.
        """
        value = str(
            metadata_section or ""
        ).strip()

        if not value:
            return False

        normalized_section = value.lower()

        # ----------------------------------------------------------
        # Exact Section references.
        # ----------------------------------------------------------
        section_matches = re.findall(
            r"\bsection\s+\d+[a-z]?(?:\s*\([a-z0-9]+\))*",
            normalized_section,
            flags=re.IGNORECASE,
        )

        for section_reference in section_matches:
            if self._has_explicit_section(
                normalized_text,
                rf"\b{re.escape(section_reference)}\b",
            ):
                return True

        # ----------------------------------------------------------
        # Generic named provisions.
        # ----------------------------------------------------------
        cleaned = re.sub(
            r"\s+",
            " ",
            normalized_section,
        ).strip()

        if cleaned in normalized_text:
            return True

        # ----------------------------------------------------------
        # Split combined labels such as:
        # "Form 2 / Section 10 / Rule 13"
        # ----------------------------------------------------------
        components = [
            part.strip()
            for part in re.split(
                r"\s*/\s*",
                cleaned,
            )
            if part.strip()
        ]

        if components:
            supported_components = 0

            for component in components:
                component = component.strip()

                if component in {
                    "form 2",
                    "complete specification",
                    "rule 13",
                    "section 10",
                    "section 11b",
                    "section 12",
                    "section 13",
                    "section 3(p)",
                    "section 6",
                }:
                    if component in normalized_text:
                        supported_components += 1

            if supported_components == len(components):
                return True

        return False

    # ==============================================================
    # MEANINGFUL PROVISION EXTRACTION
    # ==============================================================

    def extract_section(
        self,
        text: str,
    ) -> str | None:
        """
        Extract the most meaningful legal provision/reference
        supported by the retrieved evidence text.

        Exact provision numbers are returned only when the evidence
        text explicitly supports them. Otherwise descriptive labels
        are used.
        """
        if not text:
            return None

        normalized = self._normalize_text(text)

        # ==========================================================
        # 1. PERSONS ENTITLED TO APPLY / SECTION 6
        # ==========================================================

        if self._has_explicit_section(
            normalized,
            r"\bsection\s+6\b",
        ):
            if (
                "true and first inventor" in normalized
                or "true and first inventors" in normalized
                or "person claiming to be the true and first inventor"
                in normalized
                or "assignee of such person" in normalized
                or "legal representative of any deceased person"
                in normalized
                or "persons entitled to apply" in normalized
            ):
                return "Section 6"

        # The exact section heading may not survive OCR, but the
        # evidence may still clearly describe the applicant entitlement.
        if (
            (
                "true and first inventor" in normalized
                or "true and first inventors" in normalized
            )
            and (
                "assignee" in normalized
                or "legal representative" in normalized
            )
        ):
            return "Persons entitled to apply"

        # ==========================================================
        # 2. TRADITIONAL KNOWLEDGE / SECTION 3(P)
        # ==========================================================

        explicit_section_3p = (
            self._has_explicit_section(
                normalized,
                r"\bsection\s+3\s*\(\s*p\s*\)",
            )
            or self._has_explicit_section(
                normalized,
                r"\bsection\s+3\s+p\b",
            )
        )

        if explicit_section_3p:
            return "Section 3(p)"

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
        # 3. REQUEST FOR EXAMINATION / SECTION 11B
        # ==========================================================

        if self._has_explicit_section(
            normalized,
            r"\bsection\s+11\s*b\b",
        ):
            if (
                "request for examination" in normalized
                or "request for examination of application"
                in normalized
            ):
                return "Section 11B"

        if (
            "request for examination" in normalized
            or
            "request for examination of the application"
            in normalized
        ):
            return "Request for examination"

        if (
            "treated as withdrawn" in normalized
            and (
                "request for examination" in normalized
                or "examined" in normalized
            )
        ):
            return "Request for examination"

        # ==========================================================
        # 4. EXAMINATION / SECTION 12
        # ==========================================================

        if self._has_explicit_section(
            normalized,
            r"\bsection\s+12\b",
        ):
            if (
                "examination" in normalized
                or "examiner" in normalized
                or "controller" in normalized
            ):
                return "Section 12"

        if (
            "examiner shall make a report" in normalized
            or
            "examiner shall examine" in normalized
            or
            (
                "examination of the application" in normalized
                and "examiner" in normalized
            )
        ):
            return "Examination of application"

        # ==========================================================
        # 5. ANTICIPATION / PREVIOUS PUBLICATION / SECTION 13
        # ==========================================================

        if self._has_explicit_section(
            normalized,
            r"\bsection\s+13\b",
        ):
            if (
                "previous publication" in normalized
                or "prior claim" in normalized
                or "anticipation" in normalized
                or "search for anticipation" in normalized
            ):
                return "Section 13"

        if (
            "search for anticipation" in normalized
            or
            "previous publication" in normalized
            or
            "previously published" in normalized
            or
            "prior claim" in normalized
        ):
            return "Anticipation / prior publication"

        # ==========================================================
        # 6. SOURCE / GEOGRAPHICAL ORIGIN
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
            if self._has_explicit_section(
                normalized,
                r"\bsection\s+10\s*\(\s*4\s*\)\s*\(\s*d\s*\)",
            ):
                return "Section 10(4)(D)"

            if re.search(
                r"\(\s*d\s*\)\s*disclose\s+the\s+source\s+and\s+"
                r"geographical\s+origin",
                normalized,
                flags=re.IGNORECASE,
            ):
                return "Source / geographical origin disclosure"

            if (
                "disclose the source and geographical origin"
                in normalized
            ):
                return "Source / geographical origin disclosure"

            return "Source / geographical origin"

        # ==========================================================
        # 7. BUDAPEST TREATY / BIOLOGICAL MATERIAL DEPOSIT
        # ==========================================================

        if (
            "budapest treaty" in normalized
            and "deposit" in normalized
            and "biological material" in normalized
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s+10\s*\(\s*4\s*\)\s*\(\s*a\s*\)",
            ):
                return "Section 10(4)(A)"

            if self._has_explicit_section(
                normalized,
                r"\bsection\s+10\s*\(\s*4\s*\)",
            ):
                return "Section 10(4)"

            return "Budapest Treaty / biological material deposit"

        # ==========================================================
        # 8. FORM 2 / COMPLETE SPECIFICATION
        # ==========================================================

        if (
            "form 2" in normalized
            and "complete specification" in normalized
        ):
            has_rule_13 = (
                "rule 13" in normalized
                or "rule13" in normalized
            )

            has_section_10 = self._has_explicit_section(
                normalized,
                r"\bsection\s+10\b",
            )

            if has_rule_13 and has_section_10:
                return "Form 2 / Section 10 / Rule 13"

            if has_rule_13:
                return "Form 2 / Rule 13"

            if has_section_10:
                return "Form 2 / Section 10"

            return "Form 2 / Complete Specification"

        # ==========================================================
        # 9. COMPLETE SPECIFICATION / CLAIMS
        # ==========================================================

        if (
            "the claim or claims of a complete specification"
            in normalized
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s+10\b",
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
        # 10. SOURCE / ORIGIN AS A REVOCATION GROUND
        # ==========================================================

        if (
            "wrongly mentions the source and geographical origin"
            in normalized
            or
            "does not disclose or wrongly mentions the source"
            in normalized
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s+64\s*\(\s*1\s*\)\s*\(\s*j\s*\)",
            ):
                return "Section 64(1)(j)"

            return (
                "Source / geographical origin as revocation ground"
            )

        # ==========================================================
        # 11. INVENTIVE STEP / OBVIOUSNESS
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
                r"\bsection\s+64\s*\(\s*1\s*\)\s*\(\s*e\s*\)",
            ):
                return "Section 64(1)(e)"

            if self._has_explicit_section(
                normalized,
                r"\bsection\s+2\s*\(\s*1\s*\)\s*\(\s*ja\s*\)",
            ):
                return "Section 2(1)(ja)"

            return "Inventive Step / Obviousness"

        # ==========================================================
        # 12. SECTION 8 DISCLOSURE
        # ==========================================================

        if (
            "information required by section 8" in normalized
            or
            (
                "failed to disclose to the controller" in normalized
                and "section 8" in normalized
            )
        ):
            if self._has_explicit_section(
                normalized,
                r"\bsection\s+64\s*\(\s*1\s*\)\s*\(\s*h\s*\)",
            ):
                return "Section 64(1)(h)"

            return "Section 8 disclosure"

        # ==========================================================
        # 13. GENERIC SECTION / ARTICLE / RULE / CLAUSE
        # ==========================================================

        patterns = [
            r"\bsection\s+\d+[a-z]?(?:\s*\(\s*[a-z0-9]+\s*\))*",
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
        section values.

        A metadata section is used only when the retrieved evidence
        text itself supports that same reference.
        """
        metadata = item.get("metadata") or {}

        text = str(
            item.get("text")
            or item.get("content")
            or item.get("document")
            or ""
        )

        normalized_text = self._normalize_text(text)

        metadata_section = str(
            metadata.get("section") or ""
        ).strip()

        extracted_section = self.extract_section(
            text
        )

        if extracted_section:
            section = extracted_section
        elif (
            metadata_section
            and normalized_text
            and self._metadata_section_supported_by_text(
                metadata_section,
                normalized_text,
            )
        ):
            section = metadata_section
        else:
            # Do not display unsupported metadata such as
            # "Section 5" or "Section 134" when the evidence
            # text does not establish that reference.
            section = None

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

        official_url = metadata.get(
            "official_url"
        )

        if official_url:
            entry["url"] = official_url

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
        valid = self.validate_sources(
            evidence
        )

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