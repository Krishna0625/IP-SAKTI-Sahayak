from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')


class Settings:
    app_name: str = 'IP-SAKTI Sahayak API'
    database_url: str = os.getenv('DATABASE_URL', 'sqlite:///./ip_sakti.db')
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
        if origin.strip()
    ]


settings = Settings()
