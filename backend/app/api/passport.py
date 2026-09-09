from __future__ import annotations

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix='/api', tags=['passport'])


@router.get('/passport/{innovation_id}')
async def get_passport(innovation_id: str):
    if innovation_id != 'INV-DEMO-001':
        raise HTTPException(status_code=404, detail='Innovation passport not found.')

    return {
        'innovation_id': 'INV-DEMO-001',
        'name': 'Ashwagandha + Brahmi Wellness Capsule',
        'classification': 'Ayurveda-Aahar / Wellness Product',
        'readiness': 72,
        'ip_review': {
            'status': 'Pending review',
            'summary': 'Preliminary review of formulation and branding signals is required.',
            'demo_note': 'Demo / Placeholder'
        },
        'tk_review': {
            'status': 'Requires TK check',
            'summary': 'Traditional knowledge implications should be reviewed before commercialization.',
            'demo_note': 'Demo / Placeholder'
        },
        'abs_assessment': {
            'status': 'Needs assessment',
            'summary': 'Source origin and access considerations should be reviewed with ABS guidance.',
            'demo_note': 'Demo / Placeholder'
        },
        'regulatory_pathway': {
            'status': 'Preliminary pathway',
            'summary': 'Regulatory classification and local compliance requirements must be confirmed.',
            'demo_note': 'Demo / Placeholder'
        },
        'recommended_next_actions': [
            'Confirm botanical ingredients and source origin',
            'Review TK and prior art for formulation naming',
            'Assess packaging trademarks and product labeling',
            'Prepare a regulatory filing checklist for the target jurisdiction'
        ],
        'evidence': [
            {
                'title': 'Formulation Summary',
                'type': 'Internal note',
                'status': 'Demo / Placeholder',
                'summary': 'This evidence is a prototype demonstration only and not an official legal or regulatory record.'
            },
            {
                'title': 'TK Review Memo',
                'type': 'Traditional Knowledge Review',
                'status': 'Demo / Placeholder',
                'summary': 'This memo is a demonstration placeholder for potential TK review work.'
            }
        ],
        'disclaimer': 'This passport is a prototype demo and not a legal determination.'
    }
