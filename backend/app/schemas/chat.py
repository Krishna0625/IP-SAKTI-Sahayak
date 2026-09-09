from typing import Any

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    jurisdiction: str = Field(default='india')
    language: str = Field(default='en')
    innovation_id: str | None = None

    @field_validator('jurisdiction')
    @classmethod
    def validate_jurisdiction(cls, value: str) -> str:
        allowed = {'india', 'international'}
        if value.lower() not in allowed:
            raise ValueError('jurisdiction must be either "india" or "international"')
        return value.lower()

    @field_validator('language')
    @classmethod
    def validate_language(cls, value: str) -> str:
        valid = {'en', 'hi', 'bn', 'ta', 'te', 'ml', 'mr', 'gu', 'kn', 'or', 'pa'}
        if value.lower() not in valid:
            raise ValueError('language is not supported for this prototype')
        return value.lower()

    @field_validator('query')
    @classmethod
    def validate_query(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError('query must not be empty')
        return stripped


class ChatResponse(BaseModel):
    answer: str
    confidence: float
    key_points: list[str]
    sources: list[dict[str, Any]]
    disclaimer: str
