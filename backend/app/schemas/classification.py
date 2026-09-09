from pydantic import BaseModel, Field


class ClassificationRequest(BaseModel):
    description: str = Field(..., min_length=1)
    product_type: str | None = None


class ClassificationResponse(BaseModel):
    classification: str
    confidence: float
    reason: str
    ip_implications: list[str]
    tk_implications: list[str]
    regulatory_pathway: list[str]
    disclaimer: str
