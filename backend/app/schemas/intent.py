"""
Intent detection schemas.
"""

from typing import List, Dict
from pydantic import BaseModel, Field


class IntentCandidate(BaseModel):
    intent: str
    confidence: float


class IntentPredictionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=10)


class IntentPredictionResponse(BaseModel):
    query: str
    predicted_intent: str
    confidence: float
    confidence_level: str
    is_known_intent: bool
    threshold_applied: float
    top_candidates: List[IntentCandidate]
    recommended_action: str
    relevant_policy_doc: str


class IntentItem(BaseModel):
    intent: str
    domain: str
    description: str
    sample_queries: List[str]
