from app.rag.ingestion import discover_documents, ingest_documents
from app.rag.retriever import DocumentRetriever


def test_ingestion_discovers_official_files():
    documents = discover_documents()
    assert documents
    assert any('India' in str(doc['file_path']) or 'International' in str(doc['file_path']) for doc in documents)


def test_retriever_accepts_filters_and_returns_hits():
    retriever = DocumentRetriever()
    hits = retriever.retrieve('Can I patent my Ashwagandha formulation?', jurisdiction='india', k=3)
    assert isinstance(hits, list)
    assert len(hits) >= 1
    assert 'metadata' in hits[0]
    assert 'text' in hits[0]


def test_ingest_documents_is_idempotent():
    summary = ingest_documents()
    assert summary['documents_found'] >= 1
    assert summary['chunks_indexed'] >= 1
    summary_again = ingest_documents()
    assert summary_again['documents_indexed'] == summary['documents_indexed']
