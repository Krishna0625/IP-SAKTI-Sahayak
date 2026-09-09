from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import chromadb

from app.rag.embeddings import embed_query, embed_texts

logger = logging.getLogger(__name__)


class DocumentRetriever:
    def __init__(
        self,
        persist_directory: str | None = None,
        collection_name: str = 'ip_sakti_knowledge_base',
    ) -> None:
        base_dir = Path(__file__).resolve().parents[2]
        self.persist_directory = Path(persist_directory) if persist_directory else base_dir / 'chroma_db'
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(self.persist_directory))
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={'hnsw:space': 'cosine'},
        )

    def _build_filters(
        self,
        jurisdiction: str | None = None,
        domain: str | None = None,
        source_id: str | None = None,
    ) -> dict[str, Any] | None:
        conditions: list[dict[str, Any]] = []
        if jurisdiction:
            conditions.append({'jurisdiction': {'$eq': jurisdiction.lower()}})
        if domain:
            conditions.append({'domain': {'$eq': domain.lower()}})
        if source_id:
            conditions.append({'source_id': {'$eq': source_id}})
        if not conditions:
            return None
        if len(conditions) == 1:
            return conditions[0]
        return {'$and': conditions}

    def index_documents(self, chunks: list[dict[str, Any]]) -> int:
        if not chunks:
            return 0

        texts: list[str] = []
        metadatas: list[dict[str, Any]] = []
        ids: list[str] = []

        for chunk in chunks:
            text = (chunk.get('text') or '').strip()
            if not text:
                continue
            chunk_id = str(chunk.get('chunk_id') or chunk.get('source_id') or text)
            meta = dict(chunk.get('metadata') or {})
            ids.append(chunk_id)
            texts.append(text)
            metadatas.append(meta)

        if not ids:
            return 0

        embeddings = embed_texts(texts)
        batch_size = 5000
        for start in range(0, len(ids), batch_size):
            end = start + batch_size
            self.collection.upsert(
                ids=ids[start:end],
                documents=texts[start:end],
                metadatas=metadatas[start:end],
                embeddings=embeddings[start:end],
            )
        return len(ids)

    def retrieve(
        self,
        query: str,
        jurisdiction: str | None = None,
        domain: str | None = None,
        source_id: str | None = None,
        k: int = 5,
    ) -> list[dict[str, Any]]:
        if not query or not query.strip():
            return []

        query_embedding = embed_query(query)
        where = self._build_filters(jurisdiction=jurisdiction, domain=domain, source_id=source_id)
        logger.info('Retrieving evidence for query=%s filters=%s', query[:120], where)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=max(1, k),
            where=where,
            include=['documents', 'metadatas', 'distances'],
        )

        hits: list[dict[str, Any]] = []
        docs = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]
        distances = results.get('distances', [[]])[0]

        for index, text in enumerate(docs):
            metadata = metadatas[index] if index < len(metadatas) else {}
            distance = distances[index] if index < len(distances) else 1.0
            score = max(0.0, 1.0 - min(float(distance), 1.0))
            hits.append({
                'text': text,
                'metadata': metadata,
                'score': round(score, 4),
                'distance': round(float(distance), 4),
            })

        return hits
