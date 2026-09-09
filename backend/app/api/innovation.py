from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.innovation import InnovationCreateRequest, InnovationCreateResponse

router = APIRouter(prefix='/api', tags=['innovation'])


@router.post('/innovation', response_model=InnovationCreateResponse)
async def create_innovation(payload: InnovationCreateRequest):
    required_fields = {
        'name': payload.name,
        'product_type': payload.product_type,
        'ingredients': payload.ingredients,
        'intended_use': payload.intended_use,
        'description': payload.description,
    }

    missing = [name for name, value in required_fields.items() if not str(value).strip()]
    if missing:
        raise HTTPException(status_code=400, detail=f'Missing required fields: {", ".join(missing)}')

    innovation_id = 'INV-DEMO-' + str(abs(hash(payload.name + payload.product_type + payload.jurisdiction)) % 100000).zfill(5)

    return InnovationCreateResponse(
        innovation_id=innovation_id,
        name=payload.name,
        product_type=payload.product_type,
        ingredients=payload.ingredients,
        intended_use=payload.intended_use,
        description=payload.description,
        jurisdiction=payload.jurisdiction,
    )
