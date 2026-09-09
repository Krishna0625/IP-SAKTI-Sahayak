from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService

router = APIRouter(prefix='/api', tags=['chat'])
llm_service = LLMService()


@router.post('/chat', response_model=ChatResponse)
async def post_chat(payload: ChatRequest):
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail='Query must not be empty.')

    response = llm_service.generate_response(
        payload.query,
        payload.jurisdiction,
        payload.language,
        payload.innovation_id,
    )
    return ChatResponse(**response)
