"""
Application configuration management via Pydantic.
Supports environment variables with robust defaults.
"""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseModel):
    # Server configuration
    PROJECT_NAME: str = "ShopEase Customer Support AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    # CORS origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Model & Data Paths
    MODELS_DIR: Path = BASE_DIR / "models"
    PROCESSED_DIR: Path = BASE_DIR / "processed_data"
    INTENT_MODEL_PATH: Path = BASE_DIR / "models" / "intent_pipeline.joblib"
    EVAL_RESULTS_PATH: Path = BASE_DIR / "models" / "evaluation_results.json"
    KB_VECTORIZER_PATH: Path = BASE_DIR / "models" / "knowledge_vectorizer.joblib"
    KB_TFIDF_MATRIX_PATH: Path = BASE_DIR / "models" / "knowledge_tfidf_matrix.joblib"
    KB_CHUNKS_PATH: Path = BASE_DIR / "processed_data" / "knowledge_chunks.json"
    KB_SUMMARY_PATH: Path = BASE_DIR / "models" / "knowledge_summary.json"
    DATASET_SUMMARY_PATH: Path = BASE_DIR / "processed_data" / "dataset_summary.json"

    # AI & Retrieval Thresholds
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.55"))
    RELEVANCE_THRESHOLD: float = float(os.getenv("RELEVANCE_THRESHOLD", "0.04"))
    MAX_RETRIEVAL_CHUNKS: int = int(os.getenv("MAX_RETRIEVAL_CHUNKS", "3"))

    # Security
    MAX_MESSAGE_LENGTH: int = 1000
    RATE_LIMIT_PER_MINUTE: int = 60

    # Optional External LLM Provider
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")


settings = Settings()
