from __future__ import annotations

import re
from typing import Any


class CitationService:
    def __init__(self) -> None:
        self.enabled = True

    def extract_section(self, text: str) -> str | None:
        if not text:
            return None
        patterns = [
            r'\bSection\s+[A-Za-z0-9.-]+\b',
            r'\bArticle\s+[A-Za-z0-9.-]+\b',
            r'\bRule\s+[A-Za-z0-9.-]+\b',
            r'\bClause\s+[A-Za-z0-9.-]+\b',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def build_source_entry(self, item: dict[str, Any]) -> dict[str, Any]:
        metadata = item.get('metadata') or {}
        text = item.get('text') or ''
        page = metadata.get('page')
        section = self.extract_section(text)

        entry: dict[str, Any] = {
            'id': metadata.get('source_id', ''),
            'title': metadata.get('title', 'Official document'),
            'authority': metadata.get('authority', ''),
            'jurisdiction': metadata.get('jurisdiction', ''),
            'domain': metadata.get('domain', ''),
            'page': int(page) if page is not None and str(page).strip() else None,
            'relevance': round(float(item.get('score', 0.0)), 4),
        }
        if section:
            entry['section'] = section
        if metadata.get('official_url'):
            entry['url'] = metadata.get('official_url')
        return entry

    def validate_sources(self, evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
        valid: list[dict[str, Any]] = []
        for item in evidence:
            metadata = item.get('metadata') or {}
            if not metadata.get('source_id') or not metadata.get('title'):
                continue
            valid.append(item)
        return valid

    def format_citations(self, evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
        valid = self.validate_sources(evidence)
        if not valid:
            return []
        return [self.build_source_entry(item) for item in valid]

    def insufficient_message(self) -> str:
        return 'Reliable evidence was not found in the available knowledge base.'
