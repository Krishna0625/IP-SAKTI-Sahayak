from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    title: str
    type: str
    status: str = Field(default='Demo / Placeholder')
    summary: str


class PassportResponse(BaseModel):
    innovation_id: str
    name: str
    classification: str
    readiness: int
    ip_review: dict
    tk_review: dict
    abs_assessment: dict
    regulatory_pathway: dict
    recommended_next_actions: list[str]
    evidence: list[EvidenceItem]
    disclaimer: str
