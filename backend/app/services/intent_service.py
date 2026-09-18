"""
Intent Classification Service.
Provides fast inference, calibrated confidence estimation, top-k candidate ranking,
and confidence thresholding.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Intent to Knowledge Document Mapping for ShopEase
INTENT_POLICY_MAPPING = {
    "refund": "refund_policy.pdf",
    "card_arrival": "shipping_policy.pdf",
    "card_linking": "account_policy.pdf",
    "exchange_rate": "payment_policy.pdf",
    "card_payment_wrong_exchange_rate": "payment_policy.pdf",
    "extra_charge_on_statement": "payment_policy.pdf",
    "pending_cash_withdrawal": "payment_policy.pdf",
    "fiat_currency_support": "payment_policy.pdf",
    "card_delivery_estimate": "shipping_policy.pdf",
    "automatic_top_up": "account_policy.pdf",
    "card_not_working": "account_policy.pdf",
    "pin_blocked": "security_policy.pdf",
    "compromised_card": "security_policy.pdf",
    "cancel_transfer": "cancellation_policy.pdf",
    "top_up_reverted": "refund_policy.pdf",
    "verify_identity": "privacy_policy.pdf",
    "verify_source_of_funds": "security_policy.pdf",
    "lost_or_stolen_phone": "security_policy.pdf",
    "lost_or_stolen_card": "security_policy.pdf",
    "passcode_forgotten": "security_policy.pdf",
    "disposable_virtual_cards": "security_policy.pdf",
    "order_status": "shipping_policy.pdf",
    "return": "return_policy.pdf",
    "cancellation": "cancellation_policy.pdf",
    "discount": "discount_policy.pdf",
    "membership": "membership_policy.pdf",
    "contact": "contact_information.pdf",
    "faq": "faq.pdf"
}


class IntentService:
    def __init__(self):
        self.model = None
        self.classes = []
        self.is_loaded = False
        self.eval_metrics = {}
        self.load_model()

    def load_model(self):
        model_path = settings.INTENT_MODEL_PATH
        eval_path = settings.EVAL_RESULTS_PATH

        if not model_path.exists():
            logger.warning(f"Intent model artifact not found at {model_path}. Train the model first.")
            return

        try:
            self.model = joblib.load(model_path)
            self.classes = list(self.model.classes_)
            self.is_loaded = True
            logger.info(f"IntentService loaded model with {len(self.classes)} classes.")

            if eval_path.exists():
                with open(eval_path, "r", encoding="utf-8") as f:
                    self.eval_metrics = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load intent model: {e}")
            self.is_loaded = False

    def predict(self, text: str, threshold: Optional[float] = None, top_k: int = 3) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None:
            return {
                "intent": "system_unavailable",
                "confidence": 0.0,
                "confidence_level": "unknown",
                "is_known_intent": False,
                "threshold_applied": threshold or settings.CONFIDENCE_THRESHOLD,
                "top_candidates": [],
                "recommended_action": "route_to_human",
                "relevant_policy_doc": "faq.pdf"
            }

        effective_threshold = threshold if threshold is not None else settings.CONFIDENCE_THRESHOLD

        # Predict probabilities
        probs = self.model.predict_proba([text])[0]
        top_indices = np.argsort(probs)[::-1][:top_k]

        top_candidates = [
            {"intent": self.classes[idx], "confidence": round(float(probs[idx]), 4)}
            for idx in top_indices
        ]

        best_intent = top_candidates[0]["intent"]
        best_conf = top_candidates[0]["confidence"]

        # Confidence Level Assessment
        if best_conf >= 0.75:
            confidence_level = "high"
        elif best_conf >= effective_threshold:
            confidence_level = "medium"
        elif best_conf >= 0.35:
            confidence_level = "low"
        else:
            confidence_level = "unknown"

        # Threshold Decision
        is_known = best_conf >= effective_threshold
        final_intent = best_intent if is_known else "unknown_or_ambiguous"

        # Find closest policy document
        relevant_doc = "faq.pdf"
        for key, doc in INTENT_POLICY_MAPPING.items():
            if key in best_intent.lower():
                relevant_doc = doc
                break

        action = "knowledge_retrieval" if is_known else "low_confidence_clarification_or_escalation"

        return {
            "intent": final_intent,
            "raw_intent": best_intent,
            "confidence": best_conf,
            "confidence_level": confidence_level,
            "is_known_intent": is_known,
            "threshold_applied": effective_threshold,
            "top_candidates": top_candidates,
            "recommended_action": action,
            "relevant_policy_doc": relevant_doc
        }

    def get_all_intents(self) -> List[str]:
        return self.classes


intent_service = IntentService()
