from pydantic import BaseModel, Field, field_validator


class InnovationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    product_type: str = Field(..., min_length=1)
    ingredients: str = Field(..., min_length=1)
    intended_use: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    jurisdiction: str = Field(default='india')

    @field_validator('jurisdiction')
    @classmethod
    def validate_jurisdiction(cls, value: str) -> str:
        allowed = {'india', 'international'}
        normalized = value.lower()
        if normalized not in allowed:
            raise ValueError('jurisdiction must be either "india" or "international"')
        return normalized


class InnovationCreateResponse(BaseModel):
    innovation_id: str
    name: str
    product_type: str
    ingredients: str
    intended_use: str
    description: str
    jurisdiction: str
