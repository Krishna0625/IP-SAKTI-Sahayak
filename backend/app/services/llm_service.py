"""Provider-agnostic service wrapper for RAG-generated answers."""

from app.services.rag_service import RAGService


class LLMService:
    def __init__(self) -> None:
        self.enabled = True
        self.rag_service = RAGService()

    def generate_response(self, query: str, jurisdiction: str = 'india', language: str = 'en', innovation_id: str | None = None):
        return self.rag_service.answer_query(
            query=query,
            jurisdiction=jurisdiction,
            language=language,
            innovation_id=innovation_id,
        )
