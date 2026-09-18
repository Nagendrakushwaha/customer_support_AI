"""
RAG (Retrieval-Augmented Generation) & Response Orchestration Engine.
Coordinates:
- Security / prompt injection defense
- Intent prediction & confidence gating
- Knowledge retrieval over ShopEase policies
- Grounded response synthesis (with external LLM or local grounded fallback)
- Source attribution and human escalation triggers
"""

import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.security import (
    sanitize_input,
    detect_prompt_injection,
    mask_sensitive_data,
    check_security_escalation
)
from app.services.intent_service import intent_service
from app.services.knowledge_service import knowledge_service
from app.schemas.chat import SourceDocument, ChatResponse

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        pass

    def synthesize_grounded_response(
        self,
        query: str,
        intent: str,
        retrieved_chunks: List[Dict[str, Any]],
        is_security_escalation: bool,
        is_user_human_request: bool
    ) -> str:
        """
        Synthesizes a high-quality, grounded answer from official support documents.
        Adheres strictly to the hierarchy:
        1. System safety & security
        2. Retrieved authoritative knowledge
        3. Factual disclaimer when unknown
        """
        # If security alert
        if is_security_escalation:
            return (
                "**Urgent Security Notice:**\n"
                "We take account security and unauthorized transactions very seriously. "
                "ShopEase staff will **NEVER** ask for your Password, OTP, CVV, or Card PIN.\n\n"
                "**Recommended Immediate Actions:**\n"
                "1. Immediately freeze or block your card/account via the ShopEase App Settings.\n"
                "2. Call our Fraud & Escalation Desk directly at **1800-123-EASE (1800-123-3273)** "
                "(Mon–Sat, 9:00 AM–8:00 PM IST).\n"
                "3. Email security logs to `security@shopease.example`.\n\n"
                "This conversation has been flagged for human support review."
            )

        # If user explicitly requested a human agent
        if is_user_human_request:
            return (
                "I understand you'd like to speak with a human support specialist. "
                "Our customer care team is available **Monday through Saturday, 9:00 AM to 8:00 PM IST**.\n\n"
                "You can connect directly via:\n"
                "• **Toll-Free Phone:** 1800-123-EASE (1800-123-3273)\n"
                "• **Email Support:** support@shopease.example\n"
                "• **In-App Escalation:** Tap 'Request Callback' in your order details.\n\n"
                "I have flagged this session for human agent follow-up."
            )

        # If no knowledge chunks could be retrieved
        if not retrieved_chunks:
            return (
                "I couldn't find that specific information in the official ShopEase support knowledge base.\n\n"
                "To ensure you receive accurate assistance, please feel free to clarify your question "
                "or contact our support team at **support@shopease.example**."
            )

        # Extract primary context from best chunk
        primary_chunk = retrieved_chunks[0]
        primary_text = primary_chunk["text"].strip()
        doc_title = primary_chunk["document_title"]

        # Clean text snippet into readable bullet points or paragraphs
        sentences = [s.strip() for s in primary_text.split(". ") if len(s.strip()) > 15]
        summary_points = sentences[:3]
        formatted_summary = ". ".join(summary_points)
        if not formatted_summary.endswith("."):
            formatted_summary += "."

        response = (
            f"Based on the official **{doc_title}**:\n\n"
            f"{formatted_summary}\n\n"
            f"*For full details, please refer to {doc_title} (Page {primary_chunk['page']}).*"
        )
        return response

    def process_message(
        self,
        message: str,
        conversation_id: str,
        threshold_override: Optional[float] = None
    ) -> ChatResponse:
        start_time = time.time()

        # 1. Sanitize & Length Check
        clean_msg = sanitize_input(message)
        masked_msg = mask_sensitive_data(clean_msg)
        had_sensitive_info = masked_msg != clean_msg

        # 2. Prompt Injection Defense
        is_injection, injection_reason = detect_prompt_injection(clean_msg)
        if is_injection:
            elapsed = (time.time() - start_time) * 1000
            return ChatResponse(
                message=(
                    "I cannot fulfill requests that attempt to modify system rules or reveal internal prompts. "
                    "I am here to assist you exclusively with ShopEase customer support questions, orders, and policies."
                ),
                intent="prompt_injection_blocked",
                confidence=1.0,
                confidence_level="high",
                sources=[],
                escalation_required=False,
                escalation_reason="Prompt injection guardrail triggered",
                conversation_id=conversation_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                processing_time_ms=round(elapsed, 2)
            )

        # 3. Security Escalation & Human Request Detection
        requires_escalation, escalation_type = check_security_escalation(clean_msg)
        is_security = escalation_type == "security_fraud_alert"
        is_human_request = escalation_type == "user_requested_human"

        # 4. Intent Classification
        effective_threshold = threshold_override if threshold_override is not None else settings.CONFIDENCE_THRESHOLD
        intent_res = intent_service.predict(clean_msg, threshold=effective_threshold)

        detected_intent = intent_res["intent"]
        confidence = intent_res["confidence"]
        confidence_level = intent_res["confidence_level"]
        is_known_intent = intent_res["is_known_intent"]
        preferred_doc = intent_res["relevant_policy_doc"]

        # 5. Knowledge Base Retrieval
        raw_chunks = knowledge_service.search(
            query=clean_msg,
            top_k=settings.MAX_RETRIEVAL_CHUNKS,
            threshold=settings.RELEVANCE_THRESHOLD,
            preferred_doc=preferred_doc
        )

        sources: List[SourceDocument] = [
            SourceDocument(
                document_name=c["document_name"],
                document_title=c["document_title"],
                document_type=c["document_type"],
                page=c["page"],
                relevance_score=c["relevance_score"],
                snippet=c["text"][:180] + ("..." if len(c["text"]) > 180 else "")
            )
            for c in raw_chunks
        ]

        # 6. Escalation Rule Evaluation
        escalation_reason = None
        if is_security:
            requires_escalation = True
            escalation_reason = "High-priority Security/Fraud Alert"
        elif is_human_request:
            requires_escalation = True
            escalation_reason = "Customer explicitly requested human specialist"
        elif not is_known_intent and not sources:
            requires_escalation = True
            escalation_reason = f"Low intent confidence ({confidence * 100:.1f}%) and no matching knowledge base documents"
        elif not sources and confidence_level in ("low", "unknown"):
            requires_escalation = True
            escalation_reason = "Knowledge base query produced no relevant results"

        # 7. Synthesize Grounded Response
        generated_answer = self.synthesize_grounded_response(
            query=clean_msg,
            intent=detected_intent,
            retrieved_chunks=raw_chunks,
            is_security_escalation=is_security,
            is_user_human_request=is_human_request
        )

        # Append sensitivity caution if customer posted cards/passwords
        if had_sensitive_info:
            generated_answer += (
                "\n\n⚠️ **Security Warning:** Your message appeared to contain sensitive credentials (e.g. card number, OTP, or password). "
                "These details were automatically masked. Remember: ShopEase will **never** ask you for confidential security codes."
            )

        elapsed = (time.time() - start_time) * 1000

        return ChatResponse(
            message=generated_answer,
            intent=detected_intent,
            confidence=round(confidence, 4),
            confidence_level=confidence_level,
            sources=sources,
            escalation_required=requires_escalation,
            escalation_reason=escalation_reason,
            conversation_id=conversation_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            processing_time_ms=round(elapsed, 2)
        )


rag_service = RAGService()
