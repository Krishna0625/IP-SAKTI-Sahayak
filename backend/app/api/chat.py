from fastapi import APIRouter, HTTPException

from app.multilingual.bhashini import (
    BhashiniTranslationError,
    BhashiniTranslator,
)
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["chat"],
)

llm_service = LLMService()
bhashini_translator = BhashiniTranslator()


@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def post_chat(
    payload: ChatRequest,
):
    """
    Handle chat requests and forward the selected response mode
    to the Gemini/RAG service.
    """

    if not payload.query or not payload.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query must not be empty.",
        )

    processing_query = payload.query
    multilingual_request = payload.language in {
        "hi",
        "te",
        "ta",
        "kn",
        "ml",
        "bn",
    }

    if multilingual_request:
        try:
            processing_query = (
                bhashini_translator.translate_to_english(
                    payload.query,
                    payload.language,
                )
            )
        except BhashiniTranslationError as exc:
            logger.warning(
                "Bhashini input translation unavailable; "
                "continuing with original query. diagnostics=%s",
                exc.diagnostics,
            )
            multilingual_request = False

    response = llm_service.generate_response(
        query=processing_query,
        jurisdiction=payload.jurisdiction,
        language="en" if multilingual_request else payload.language,
        innovation_id=payload.innovation_id,
        response_mode=payload.response_mode,
    )

    if multilingual_request:
        try:
            response = {
                **response,
                "answer": (
                    bhashini_translator.translate_from_english(
                        response["answer"],
                        payload.language,
                    )
                ),
            }
        except BhashiniTranslationError as exc:
            logger.warning(
                "Bhashini output translation unavailable; "
                "returning English answer. diagnostics=%s",
                exc.diagnostics,
            )

    return ChatResponse(
        **response
    )