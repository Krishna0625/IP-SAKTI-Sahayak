from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.classification import router as classification_router
from app.api.innovation import router as innovation_router
from app.api.passport import router as passport_router
from app.api.sources import router as sources_router
from app.core.config import settings

app = FastAPI(title='IP-SAKTI Sahayak API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/')
async def root():
    return {
        'status': 'ok',
        'service': 'IP-SAKTI Sahayak API',
    }


@app.get('/api/health')
async def healthcheck():
    return {
        'status': 'healthy',
    }


app.include_router(chat_router)
app.include_router(innovation_router)
app.include_router(classification_router)
app.include_router(passport_router)
app.include_router(sources_router)
