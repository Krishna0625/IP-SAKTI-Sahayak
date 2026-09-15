from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    jurisdiction: str = Field(default="india")
    language: str = Field(default="en")
    innovation_id: str | None = None
    response_mode: Literal[
        "simple",
        "detailed",
        "technical",
    ] = "detailed"

    @field_validator("jurisdiction")
    @classmethod
    def validate_jurisdiction(
        cls,
        value: str,
    ) -> str:

        allowed = {
            "india",
            "international",
        }

        normalized = value.lower()

        if normalized not in allowed:
            raise ValueError(
                'jurisdiction must be either "india" or "international"'
            )

        return normalized

    @field_validator("language")
    @classmethod
    def validate_language(
        cls,
        value: str,
    ) -> str:

        valid = {
            "en",
            "hi",
            "bn",
            "ta",
            "te",
            "ml",
            "mr",
            "gu",
            "kn",
            "or",
            "pa",
        }

        normalized = value.lower()

        if normalized not in valid:
            raise ValueError(
                "language is not supported for this prototype"
            )

        return normalized

    @field_validator("query")
    @classmethod
    def validate_query(
        cls,
        value: str,
    ) -> str:

        stripped = value.strip()

        if not stripped:
            raise ValueError(
                "query must not be empty"
            )

        return stripped


class ChatResponse(BaseModel):
    answer: str
    confidence: float
    key_points: list[str]
    sources: list[dict[str, Any]]
    disclaimer: str