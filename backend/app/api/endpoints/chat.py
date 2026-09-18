"""
Chat and conversation API endpoints.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationSession
)
from app.services.rag_service import rag_service
from app.services.conversation_service import conversation_service
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main conversational endpoint:
    - Ingests customer query
    - Classifies intent
    - Retrieves grounded knowledge chunks
    - Generates response
    - Attaches citations and checks escalation
    """
    # 1. Ensure or initialize session
    session = conversation_service.get_or_create_session(request.conversation_id)

    # 2. Record user message
    conversation_service.add_message(
        conversation_id=session.conversation_id,
        role="user",
        content=request.message
    )

    # 3. Process via RAG engine
    response = rag_service.process_message(
        message=request.message,
        conversation_id=session.conversation_id
    )

    # 4. Record assistant message
    conversation_service.add_message(
        conversation_id=session.conversation_id,
        role="assistant",
        content=response.message,
        intent=response.intent,
        confidence=response.confidence,
        sources=response.sources,
        escalation_required=response.escalation_required
    )

    # 5. Record analytics
    analytics_service.record_interaction(
        intent=response.intent,
        confidence=response.confidence,
        processing_time_ms=response.processing_time_ms,
        escalated=response.escalation_required,
        has_sources=len(response.sources) > 0
    )

    return response


@router.get("/conversations", response_model=List[ConversationSession])
async def list_conversations():
    """Returns all active and archived conversation sessions."""
    return conversation_service.get_all_sessions()


@router.get("/conversations/{conversation_id}", response_model=ConversationSession)
async def get_conversation(conversation_id: str):
    """Returns detailed history of a specific session."""
    session = conversation_service.get_session(conversation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return session


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Deletes a conversation session."""
    deleted = conversation_service.delete_session(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return {"status": "success", "message": "Conversation deleted"}
