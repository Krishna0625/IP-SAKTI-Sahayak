from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import chromadb

from app.rag.embeddings import embed_query, embed_texts

logger = logging.getLogger(__name__)


class DocumentRetriever:
    """
    ChromaDB-backed document retriever for IP-SAKTI Sahayak.

    The persistence directory can be configured using the
    CHROMA_PERSIST_DIRECTORY environment variable.

    Local default:
        backend/chroma_db

    Deployment:
        Set CHROMA_PERSIST_DIRECTORY to the persistent storage path
        provided by the deployment platform.
    """

    def __init__(
        self,
        persist_directory: str | None = None,
        collection_name: str = "ip_sakti_knowledge_base",
    ) -> None:

        # ----------------------------------------------------------
        # Project/backend directory
        # ----------------------------------------------------------

        base_dir = Path(
            __file__
        ).resolve().parents[2]

        # For:
        # backend/app/rag/retriever.py
        #
        # parents[0] -> backend/app/rag
        # parents[1] -> backend/app
        # parents[2] -> backend

        # ----------------------------------------------------------
        # Determine Chroma persistence path
        # ----------------------------------------------------------

        environment_path = os.getenv(
            "CHROMA_PERSIST_DIRECTORY"
        )

        configured_path = (
            persist_directory
            or environment_path
        )

        if configured_path:

            configured_path = os.path.expandvars(
                os.path.expanduser(
                    configured_path
                )
            )

            persistence_path = Path(
                configured_path
            )

            # Relative deployment paths are resolved relative
            # to the backend directory.
            if not persistence_path.is_absolute():
                persistence_path = (
                    base_dir / persistence_path
                )

        else:

            # Preserve the current local behavior.
            persistence_path = (
                base_dir / "chroma_db"
            )

        # ----------------------------------------------------------
        # Create directory if necessary
        # ----------------------------------------------------------

        self.persist_directory = (
            persistence_path
        )

        self.persist_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        logger.info(
            "Chroma persistence directory: %s",
            self.persist_directory,
        )

        # ----------------------------------------------------------
        # Create persistent Chroma client
        # ----------------------------------------------------------

        self.client = chromadb.PersistentClient(
            path=str(
                self.persist_directory
            )
        )

        # ----------------------------------------------------------
        # Open existing collection or create it
        # ----------------------------------------------------------

        self.collection = (
            self.client.get_or_create_collection(
                name=collection_name,
                metadata={
                    "hnsw:space": "cosine"
                },
            )
        )

        logger.info(
            "Chroma collection '%s' contains %d chunks.",
            collection_name,
            self.collection.count(),
        )

    # ==============================================================
    # FILTER BUILDING
    # ==============================================================

    def _build_filters(
        self,
        jurisdiction: str | None = None,
        domain: str | None = None,
        source_id: str | None = None,
    ) -> dict[str, Any] | None:

        conditions: list[
            dict[str, Any]
        ] = []

        if jurisdiction:

            conditions.append(
                {
                    "jurisdiction": {
                        "$eq": jurisdiction.lower()
                    }
                }
            )

        if domain:

            conditions.append(
                {
                    "domain": {
                        "$eq": domain.lower()
                    }
                }
            )

        if source_id:

            conditions.append(
                {
                    "source_id": {
                        "$eq": source_id
                    }
                }
            )

        if not conditions:
            return None

        if len(conditions) == 1:
            return conditions[0]

        return {
            "$and": conditions
        }

    # ==============================================================
    # INDEX DOCUMENTS
    # ==============================================================

    def index_documents(
        self,
        chunks: list[dict[str, Any]],
    ) -> int:

        if not chunks:
            return 0

        texts: list[str] = []
        metadatas: list[
            dict[str, Any]
        ] = []
        ids: list[str] = []

        for chunk in chunks:

            text = (
                chunk.get("text")
                or ""
            ).strip()

            if not text:
                continue

            chunk_id = str(
                chunk.get("chunk_id")
                or chunk.get("source_id")
                or text
            )

            meta = dict(
                chunk.get("metadata")
                or {}
            )

            ids.append(
                chunk_id
            )

            texts.append(
                text
            )

            metadatas.append(
                meta
            )

        if not ids:
            return 0

        embeddings = embed_texts(
            texts
        )

        batch_size = 5000

        for start in range(
            0,
            len(ids),
            batch_size,
        ):

            end = (
                start + batch_size
            )

            self.collection.upsert(
                ids=ids[start:end],
                documents=texts[start:end],
                metadatas=metadatas[start:end],
                embeddings=embeddings[
                    start:end
                ],
            )

        logger.info(
            "Indexed/upserted %d chunks. Collection now contains %d chunks.",
            len(ids),
            self.collection.count(),
        )

        return len(ids)

    # ==============================================================
    # RETRIEVE
    # ==============================================================

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

        query_embedding = embed_query(
            query
        )

        where = self._build_filters(
            jurisdiction=jurisdiction,
            domain=domain,
            source_id=source_id,
        )

        logger.info(
            "Retrieving evidence for query=%s filters=%s",
            query[:120],
            where,
        )

        results = self.collection.query(
            query_embeddings=[
                query_embedding
            ],
            n_results=max(
                1,
                k,
            ),
            where=where,
            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )

        hits: list[
            dict[str, Any]
        ] = []

        docs = results.get(
            "documents",
            [[]],
        )[0]

        metadatas = results.get(
            "metadatas",
            [[]],
        )[0]

        distances = results.get(
            "distances",
            [[]],
        )[0]

        for index, text in enumerate(
            docs
        ):

            metadata = (
                metadatas[index]
                if index < len(metadatas)
                else {}
            )

            distance = (
                distances[index]
                if index < len(distances)
                else 1.0
            )

            score = max(
                0.0,
                1.0
                - min(
                    float(distance),
                    1.0,
                ),
            )

            hits.append(
                {
                    "text": text,
                    "metadata": metadata,
                    "score": round(
                        score,
                        4,
                    ),
                    "distance": round(
                        float(distance),
                        4,
                    ),
                }
            )

        return hits