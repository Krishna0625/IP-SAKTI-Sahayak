"""Lightweight classification stub for Stage 2."""


class ClassificationService:
    def classify(self, description: str, product_type: str | None = None):
        return {
            "classification": "Ayurveda-Aahar / Wellness Product",
            "confidence": 0.86,
            "reason": "Preliminary classification based on the submitted product characteristics.",
            "ip_implications": [],
            "tk_implications": [],
            "regulatory_pathway": [],
            "disclaimer": "This is an AI-assisted preliminary assessment and is not a legal determination.",
        }
