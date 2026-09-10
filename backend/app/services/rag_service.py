from __future__ import annotations

import logging
import re
from typing import Any

from app.rag.ingestion import discover_documents, ingest_documents
from app.rag.retriever import DocumentRetriever
from app.services.citation_service import CitationService

logger = logging.getLogger(__name__)

_ALLOWED_JURISDICTIONS = {'india', 'international'}


class RAGService:
    def __init__(self) -> None:
        self.retriever = DocumentRetriever()
        self.citation_service = CitationService()
        self._last_evidence: list[dict[str, Any]] = []

    def normalize_query(self, query: str) -> str:
        if not query:
            return ''

        text = re.sub(r'\s+', ' ', query).strip()
        return text[:500]

    def interpret_filters(
        self,
        query: str,
        jurisdiction: str | None,
    ) -> tuple[str | None, str | None]:

        q = query.lower()

        jurisdiction_value = jurisdiction.lower() if jurisdiction else None

        if jurisdiction_value and jurisdiction_value not in _ALLOWED_JURISDICTIONS:
            jurisdiction_value = None

        domain: str | None = None

        if any(
            term in q
            for term in [
                'ashwagandha',
                'patent',
                'patents',
                'novelty',
                'inventive step',
            ]
        ):
            domain = 'patents'

        elif any(
            term in q
            for term in [
                'abs',
                'benefit sharing',
                'genetic resource',
                'biological resource',
                'biodiversity',
            ]
        ):
            domain = 'biodiversity'

        elif any(
            term in q
            for term in [
                'ayush',
                'ayurveda',
                'ayurvedic',
                'aahara',
                'drugs and cosmetics',
            ]
        ):
            domain = 'ayush'

        elif any(
            term in q
            for term in [
                'traditional knowledge',
                'tkdl',
                'traditional knowledge digital library',
            ]
        ):
            domain = 'tk'

        elif any(
            term in q
            for term in [
                'cbd',
                'convention on biological diversity',
            ]
        ):
            domain = 'cbd'

        elif any(
            term in q
            for term in [
                'nagoya',
                'protocol',
            ]
        ):
            domain = 'nagoya'

        elif any(
            term in q
            for term in [
                'wipo',
                'international framework',
                'international treaty',
            ]
        ):
            domain = 'wipo'

        elif 'trips' in q:
            domain = 'trips'

        return jurisdiction_value, domain

    def retrieve_evidence(
        self,
        query: str,
        jurisdiction: str | None = None,
        domain: str | None = None,
        k: int = 5,
    ) -> list[dict[str, Any]]:

        normalized = self.normalize_query(query)

        jurisdiction_value = jurisdiction.lower() if jurisdiction else None

        if jurisdiction_value and jurisdiction_value not in _ALLOWED_JURISDICTIONS:
            jurisdiction_value = None

        logger.info(
            'RAG query=%s jurisdiction=%s domain=%s',
            normalized[:120],
            jurisdiction_value,
            domain,
        )

        hits = self.retriever.retrieve(
            normalized,
            jurisdiction=jurisdiction_value,
            domain=domain,
            k=k,
        )

        if not hits and jurisdiction_value:
            hits = self.retriever.retrieve(
                normalized,
                jurisdiction=None,
                domain=domain,
                k=k,
            )

        if not hits and domain:
            hits = self.retriever.retrieve(
                normalized,
                jurisdiction=jurisdiction_value,
                k=k,
            )

        return hits

    def build_answer(
        self,
        query: str,
        evidence: list[dict[str, Any]],
        jurisdiction: str | None = None,
    ) -> dict[str, Any]:

        if not evidence:
            return {
                'answer': (
                    'Reliable evidence was not found in the available '
                    'knowledge base. This is a preliminary assessment only, '
                    'based on the available evidence, and further legal '
                    'review may be required.'
                ),
                'confidence': 0.0,
                'key_points': [
                    'No reliable evidence found in the available knowledge base.'
                ],
                'sources': [],
                'disclaimer': 'This information is not legal advice.',
            }

        key_points: list[str] = []
        seen: set[str] = set()

        for item in evidence[:3]:
            metadata = item.get('metadata') or {}

            title = metadata.get('title') or 'Official document'

            if title not in seen:
                seen.add(title)
                key_points.append(
                    f'Relevant official material: {title}.'
                )

        q = query.lower()

        if 'ashwagandha' in q or 'patent' in q:

            answer = (
                'Based on the available evidence, patentability questions '
                'should be assessed against the relevant statutory framework, '
                'novelty, inventive step, and any traditional-knowledge or '
                'biological-resource considerations. This is a preliminary '
                'assessment based on the available evidence, and further '
                'legal review may be required.'
            )

        elif (
            'abs' in q
            or 'biological resource' in q
            or 'genetic resource' in q
        ):

            answer = (
                'Based on the available evidence, ABS and biological-resource '
                'considerations may be relevant where a product uses '
                'biological resources or associated traditional knowledge. '
                'This is a preliminary assessment based on the available '
                'evidence, and further legal review may be required.'
            )

        elif 'ayurveda aahara' in q or 'aahara' in q:

            answer = (
                'Based on the available evidence, Ayurveda Aahara raises '
                'product-category and regulatory questions that should be '
                'reviewed alongside AYUSH, food-safety, and product-use '
                'classifications. This is a preliminary assessment based on '
                'the available evidence, and further legal review may be '
                'required.'
            )

        elif (
            'international framework' in q
            or 'genetic resources' in q
            or 'traditional knowledge' in q
        ):

            answer = (
                'Based on the available international evidence, the relevant '
                'framework includes biodiversity and traditional-knowledge '
                'considerations under international instruments, with legal '
                'analysis to be confirmed against the specific facts. This '
                'is a preliminary assessment based on the available evidence, '
                'and further legal review may be required.'
            )

        else:

            answer = (
                'Based on the available evidence, this issue requires a '
                'preliminary assessment of the relevant sources and the '
                'specific facts. Further legal review may be required.'
            )

        citations = self.citation_service.format_citations(evidence)

        score = (
            max(float(item.get('score', 0.0)) for item in evidence)
            if evidence
            else 0.0
        )

        return {
            'answer': answer,
            'confidence': round(
                min(max(score + 0.15, 0.0), 0.98),
                2,
            ),
            'key_points': key_points,
            'sources': citations,
            'disclaimer': 'This information is not legal advice.',
        }

    def answer_query(
        self,
        query: str,
        jurisdiction: str = 'india',
        language: str = 'en',
        innovation_id: str | None = None,
    ) -> dict[str, Any]:

        normalized_query = self.normalize_query(query)

        if not normalized_query:
            self._last_evidence = []

            return {
                'answer': (
                    'Reliable evidence was not found in the '
                    'available knowledge base.'
                ),
                'confidence': 0.0,
                'key_points': ['No query was provided.'],
                'sources': [],
                'disclaimer': 'This information is not legal advice.',
            }

        documents = discover_documents()

        if not documents and not self.retriever.collection.count():
            ingest_documents()

        elif self.retriever.collection.count() == 0:
            ingest_documents()

        jurisdiction_value = (
            jurisdiction.lower()
            if jurisdiction
            else 'india'
        )

        if jurisdiction_value not in _ALLOWED_JURISDICTIONS:
            jurisdiction_value = 'india'

        _, domain_hint = self.interpret_filters(
            normalized_query,
            jurisdiction_value,
        )

        evidence = self.retrieve_evidence(
            normalized_query,
            jurisdiction=jurisdiction_value,
            domain=domain_hint,
            k=6,
        )

        if not evidence:
            evidence = self.retriever.retrieve(
                normalized_query,
                jurisdiction=jurisdiction_value,
                k=6,
            )

        if not evidence:
            evidence = self.retriever.retrieve(
                normalized_query,
                k=6,
            )

        # Store retrieved evidence so the LLM service
        # can use it to generate a grounded response.
        self._last_evidence = evidence

        answer = self.build_answer(
            normalized_query,
            evidence,
            jurisdiction=jurisdiction_value,
        )

        return answer