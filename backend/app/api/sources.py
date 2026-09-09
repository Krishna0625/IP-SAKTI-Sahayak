from fastapi import APIRouter

router = APIRouter(prefix='/api', tags=['sources'])


@router.get('/sources')
async def get_sources():
    return [
        {
            'id': 'SRC-001',
            'title': 'Ayurveda Product Classification Notes',
            'authority': 'Demo Authority',
            'jurisdiction': 'india',
            'category': 'Classification',
            'source_type': 'Reference Note',
            'version': 'v0.1',
            'status': 'Demo / Placeholder'
        },
        {
            'id': 'SRC-002',
            'title': 'Traditional Knowledge Screening Memo',
            'authority': 'Demo Authority',
            'jurisdiction': 'india',
            'category': 'Traditional Knowledge',
            'source_type': 'Internal Review',
            'version': 'v0.1',
            'status': 'Demo / Placeholder'
        }
    ]
