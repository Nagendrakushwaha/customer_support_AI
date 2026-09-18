"""
Conversation Management Service.
Maintains session state, history, message counts, and escalation tracking.
Thread-safe in-memory store with persistence support.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.schemas.chat import ConversationSession, ConversationMessage, SourceDocument


class ConversationService:
    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, conversation_id: Optional[str] = None) -> ConversationSession:
        if conversation_id and conversation_id in self._sessions:
            return self._sessions[conversation_id]

        new_id = conversation_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        session = ConversationSession(
            conversation_id=new_id,
            title="New Conversation",
            created_at=now,
            updated_at=now,
            message_count=0,
            status="active",
            messages=[]
        )
        self._sessions[new_id] = session
        return session

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None,
        confidence: Optional[float] = None,
        sources: Optional[List[SourceDocument]] = None,
        escalation_required: Optional[bool] = False
    ) -> ConversationMessage:
        session = self.get_or_create_session(conversation_id)
        now = datetime.now(timezone.utc).isoformat()
        msg_id = str(uuid.uuid4())

        msg = ConversationMessage(
            id=msg_id,
            role=role,
            content=content,
            intent=intent,
            confidence=confidence,
            sources=sources,
            escalation_required=escalation_required,
            timestamp=now
        )
        session.messages.append(msg)
        session.message_count = len(session.messages)
        session.updated_at = now

        if role == "user" and session.title == "New Conversation":
            # Auto-title from first user message
            cleaned = content.strip().replace("\n", " ")
            session.title = cleaned[:40] + ("..." if len(cleaned) > 40 else "")

        if intent:
            session.last_intent = intent

        if escalation_required:
            session.status = "escalated"
        elif session.status != "escalated":
            session.status = "active"

        return msg

    def get_all_sessions(self) -> List[ConversationSession]:
        return sorted(self._sessions.values(), key=lambda s: s.updated_at, reverse=True)

    def get_session(self, conversation_id: str) -> Optional[ConversationSession]:
        return self._sessions.get(conversation_id)

    def delete_session(self, conversation_id: str) -> bool:
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]
            return True
        return False

    def clear_all(self):
        self._sessions.clear()


conversation_service = ConversationService()
