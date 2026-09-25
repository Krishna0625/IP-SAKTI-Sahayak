from app.rag.ingestion import discover_documents, ingest_documents
from app.rag.retriever import DocumentRetriever
from app.services.rag_service import RAGService


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


def test_gi_and_trademark_query_preserves_both_domains():
    query = 'What is the difference between a geographical indication and a trademark for an Ayurvedic product?'
    service = RAGService()
    filters = service.interpret_filters(query)

    assert filters['domains'] == ['gi', 'trademarks']

    evidence = service.retrieve_evidence(
        query=query,
        filters={**filters, 'jurisdiction': 'india'},
        k=6,
    )

    assert {'gi', 'trademarks'} <= {
        item['metadata']['domain']
        for item in evidence
    }


def test_tk_abs_biodiversity_query_preserves_all_domains():
    query = 'If an Ayurvedic product uses traditional knowledge and biological resources, what IP and Access and Benefit Sharing issues should be checked?'
    service = RAGService()
    filters = service.interpret_filters(query)

    assert filters['domains'] == ['tk', 'abs', 'biodiversity']

    evidence = service.retrieve_evidence(
        query=query,
        filters={**filters, 'jurisdiction': 'india'},
        k=6,
    )

    assert {'tk', 'abs', 'biodiversity'} <= {
        item['metadata']['domain']
        for item in evidence
    }


def test_single_domain_and_unrelated_domain_behavior_remain_scoped():
    service = RAGService()

    trademark_filters = service.interpret_filters(
        'What is a trademark for an Ayurvedic product?'
    )
    assert trademark_filters['domain'] == 'trademarks'
    assert trademark_filters['domains'] == ['trademarks']

    unrelated_filters = service.interpret_filters(
        'What are the copyright rules for packaging artwork?'
    )
    assert unrelated_filters['domains'] == ['copyright']
    assert 'gi' not in unrelated_filters['domains']
    assert 'abs' not in unrelated_filters['domains']
