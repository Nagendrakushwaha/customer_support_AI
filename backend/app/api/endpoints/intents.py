"""
Intent detection endpoints.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Query
from app.schemas.intent import (
    IntentPredictionRequest,
    IntentPredictionResponse,
    IntentCandidate
)
from app.services.intent_service import intent_service

router = APIRouter()


@router.get("/intents")
async def list_intents():
    """Returns list of all 77 recognizable intent classes with taxonomies."""
    classes = intent_service.get_all_intents()
    return {
        "total_intents": len(classes),
        "intents": [
            {
                "id": idx,
                "name": name,
                "domain": "Customer Support / Banking",
                "sample_query": name.replace("_", " ")
            }
            for idx, name in enumerate(classes)
        ]
    }


@router.post("/intents/predict", response_model=IntentPredictionResponse)
async def predict_intent(request: IntentPredictionRequest):
    """
    Dedicated endpoint to test intent classification and confidence evaluation
    on any arbitrary user query.
    """
    result = intent_service.predict(request.text, top_k=request.top_k)
    return IntentPredictionResponse(
        query=request.text,
        predicted_intent=result["intent"],
        confidence=result["confidence"],
        confidence_level=result["confidence_level"],
        is_known_intent=result["is_known_intent"],
        threshold_applied=result["threshold_applied"],
        top_candidates=[
            IntentCandidate(intent=c["intent"], confidence=c["confidence"])
            for c in result["top_candidates"]
        ],
        recommended_action=result["recommended_action"],
        relevant_policy_doc=result["relevant_policy_doc"]
    )
