from __future__ import annotations

from functools import lru_cache

from sentence_transformers import SentenceTransformer

# Multilingual sentence-transformer for cross-language retrieval.
MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'


@lru_cache(maxsize=1)
def load_embedding_model(model_name: str = MODEL_NAME) -> SentenceTransformer:
    return SentenceTransformer(model_name)


def embed_query(text: str, model_name: str = MODEL_NAME) -> list[float]:
    if not text or not text.strip():
        return []
    model = load_embedding_model(model_name)
    embedding = model.encode([text], normalize_embeddings=True)[0]
    return embedding.tolist()


def embed_texts(texts: list[str], model_name: str = MODEL_NAME) -> list[list[float]]:
    if not texts:
        return []
    model = load_embedding_model(model_name)
    embeddings = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
    return embeddings.tolist()
