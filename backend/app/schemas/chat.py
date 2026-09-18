"""
Chat and conversation data contracts.
"""

from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class SourceDocument(BaseModel):
    document_name: str
    document_title: str
    document_type: str
    page: int
    relevance_score: float
    snippet: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Customer message")
    conversation_id: Optional[str] = Field(None, description="Optional ongoing conversation session ID")


class ChatResponse(BaseModel):
    message: str
    intent: str
    confidence: float
    confidence_level: str  # high, medium, low, unknown
    sources: List[SourceDocument]
    escalation_required: bool
    escalation_reason: Optional[str] = None
    conversation_id: str
    timestamp: str
    processing_time_ms: float


class ConversationMessage(BaseModel):
    id: str
    role: str  # user, assistant, system
    content: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    sources: Optional[List[SourceDocument]] = None
    escalation_required: Optional[bool] = False
    timestamp: str


class ConversationSession(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    last_intent: Optional[str] = None
    status: str  # active, resolved, escalated
    messages: List[ConversationMessage] = []
