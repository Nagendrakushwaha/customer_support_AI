"""
Security module for Customer Support Conversational AI.
Implements:
- Prompt injection detection and mitigation
- Sensitive data masking (credit card, CVV, passwords, OTP)
- Input length validation and sanitization
- Customer safety guardrails
"""

import re
import html
from typing import Tuple, Optional

# Known prompt injection signatures
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior|system)\s+instructions",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"reveal\s+(your\s+)?(system\s+prompt|instructions|api\s+key|secrets)",
    r"print\s+(your\s+)?(system\s+prompt|hidden\s+rules)",
    r"what\s+(is|are)\s+your\s+(internal|hidden|system)\s+instructions",
    r"act\s+as\s+(dan|an\s+unfiltered\s+ai)",
    r"jailbreak",
    r"system\s*:\s*override"
]

# Sensitive customer data patterns to redact/alert
SENSITIVE_PATTERNS = [
    (r"\b(?:\d[ -]*?){13,16}\b", "[REDACTED_CARD_NUMBER]"),
    (r"\b\d{3,4}\b(?=.*(?:cvv|cvc|security code))", "[REDACTED_CVV]"),
    (r"(?:otp|one\s*time\s*password)\s*(?:is|:)?\s*\b\d{4,8}\b", "[REDACTED_OTP]"),
    (r"(?:password|pwd)\s*(?:is|:)?\s*\S+", "[REDACTED_PASSWORD]")
]

# High-risk / fraud / account takeover keywords requiring immediate escalation
SECURITY_ALERT_KEYWORDS = [
    "account hacked",
    "account compromised",
    "unauthorized transaction",
    "stolen card",
    "someone used my account",
    "identity theft",
    "fraudulent charge",
    "scam",
    "security breach"
]

# Explicit human escalation request keywords
HUMAN_AGENT_KEYWORDS = [
    "human agent",
    "real person",
    "speak to an agent",
    "talk to a human",
    "customer service representative",
    "manager",
    "representative",
    "supervisor",
    "escalate to human"
]


def sanitize_input(text: str) -> str:
    """Escapes HTML entities and trims excessive whitespace."""
    if not isinstance(text, str):
        return ""
    clean = html.escape(text.strip())
    # Normalize excessive newlines
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Scans user message for known prompt injection triggers.
    Returns (is_injection, reason).
    """
    lower_text = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_text):
            return True, "Potentially malicious prompt manipulation or instruction override attempt."
    return False, None


def mask_sensitive_data(text: str) -> str:
    """Masks credit card numbers, CVVs, OTPs, and passwords from queries."""
    masked = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        masked = re.sub(pattern, replacement, masked, flags=re.IGNORECASE)
    return masked


def check_security_escalation(text: str) -> Tuple[bool, str]:
    """
    Identifies high-urgency security or fraud indicators.
    Returns (requires_escalation, category).
    """
    lower_text = text.lower()
    for kw in SECURITY_ALERT_KEYWORDS:
        if kw in lower_text:
            return True, "security_fraud_alert"

    for kw in HUMAN_AGENT_KEYWORDS:
        if kw in lower_text:
            return True, "user_requested_human"

    return False, "normal"
