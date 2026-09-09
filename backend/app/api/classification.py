from fastapi import APIRouter, HTTPException

from app.services.classification_service import ClassificationService

router = APIRouter(prefix='/api', tags=['classification'])
classification_service = ClassificationService()


@router.post('/classification')
async def classify_innovation(payload: dict):
    description = payload.get('description') or payload.get('product_description') or payload.get('text')
    product_type = payload.get('product_type')

    if not description or not str(description).strip():
        raise HTTPException(status_code=400, detail='description is required')

    result = classification_service.classify(str(description), product_type)
    return {
        'classification': result['classification'],
        'confidence': result['confidence'],
        'reason': result['reason'],
        'ip_implications': result['ip_implications'],
        'tk_implications': result['tk_implications'],
        'regulatory_pathway': result['regulatory_pathway'],
        'disclaimer': result['disclaimer'],
    }
