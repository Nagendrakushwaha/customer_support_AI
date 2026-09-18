"""
System health, diagnostic status, and analytics schemas.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class SubsystemStatus(BaseModel):
    name: str
    status: str  # Operational, Degraded, Unavailable
    latency_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str
    subsystems: Dict[str, SubsystemStatus]


class ModelEvaluationMetrics(BaseModel):
    accuracy: float
    macro_f1: float
    macro_precision: float
    macro_recall: float
    weighted_f1: float
    val_accuracy: float


class ModelInfoResponse(BaseModel):
    model_name: str
    model_type: str
    training_dataset: str
    classes_count: int
    train_samples: int
    test_samples: int
    confidence_threshold: float
    metrics: ModelEvaluationMetrics
    confidence_stats: Dict[str, float]
    status: str


class AnalyticsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    resolved_count: int
    escalated_count: int
    average_response_time_ms: float
    top_intents: List[Dict[str, Any]]
    confidence_distribution: Dict[str, int]
    escalation_rate_pct: float
    knowledge_retrieval_success_rate_pct: float


class DatasetInfo(BaseModel):
    name: str
    purpose: str
    total_records: int
    classes: int
    splits: Dict[str, int]
