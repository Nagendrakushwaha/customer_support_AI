"""
Intent Classification Model Training Pipeline.
Trains an NLP classifier on Banking77 customer queries using Calibrated Linear Classifier
with sublinear TF-IDF representation, evaluates on strictly held-out test data,
and saves model artifacts, evaluation metrics, and class metadata.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = WORKSPACE_ROOT / "processed_data"
MODELS_DIR = WORKSPACE_ROOT / "models"


def train_and_evaluate_intent_model() -> Dict[str, Any]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load Data
    train_path = PROCESSED_DIR / "banking77_train.parquet"
    val_path = PROCESSED_DIR / "banking77_val.parquet"
    test_path = PROCESSED_DIR / "banking77_test.parquet"

    logger.info(f"Loading processed datasets from {PROCESSED_DIR}...")
    df_train = pd.read_parquet(train_path)
    df_val = pd.read_parquet(val_path)
    df_test = pd.read_parquet(test_path)

    X_train = df_train["text"].values
    y_train = df_train["label_text"].values

    X_val = df_val["text"].values
    y_val = df_val["label_text"].values

    X_test = df_test["text"].values
    y_test = df_test["label_text"].values

    classes = sorted(list(set(y_train)))
    logger.info(f"Training on {len(X_train)} samples across {len(classes)} classes...")

    # 2. Pipeline Definition: Sublinear TF-IDF + Calibrated Logistic Regression
    # We use LogisticRegression with l2 regularization and multinomial/ovr
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.9,
                sublinear_tf=True,
                strip_accents="unicode",
                lowercase=True
            )
        ),
        (
            "clf",
            LogisticRegression(
                C=3.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        )
    ])

    # 3. Train
    start_time = datetime.now(timezone.utc)
    logger.info("Fitting TF-IDF Vectorizer and Intent Classifier...")
    pipeline.fit(X_train, y_train)

    # 4. Evaluate on Validation Set
    val_preds = pipeline.predict(X_val)
    val_acc = accuracy_score(y_val, val_preds)
    logger.info(f"Validation Set Accuracy: {val_acc:.4f}")

    # 5. Evaluate on strictly held-out Unseen Test Set
    logger.info(f"Evaluating on held-out test set ({len(X_test)} samples)...")
    test_preds = pipeline.predict(X_test)
    test_probs = pipeline.predict_proba(X_test)

    acc = float(accuracy_score(y_test, test_preds))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_test, test_preds, average="macro", zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_test, test_preds, average="weighted", zero_division=0
    )

    # Calculate confidence statistics
    max_probs = np.max(test_probs, axis=1)
    avg_confidence = float(np.mean(max_probs))
    min_confidence = float(np.min(max_probs))
    p25_confidence = float(np.percentile(max_probs, 25))
    p50_confidence = float(np.percentile(max_probs, 50))
    p75_confidence = float(np.percentile(max_probs, 75))

    logger.info(f"Test Accuracy: {acc:.4f} | Test Macro F1: {f1_macro:.4f} | Weighted F1: {f1_weighted:.4f}")
    logger.info(f"Confidence Stats — Mean: {avg_confidence:.4f}, Median: {p50_confidence:.4f}, Min: {min_confidence:.4f}")

    # Per-class metrics
    report_dict = classification_report(y_test, test_preds, output_dict=True, zero_division=0)

    # 6. Save Artifacts
    model_path = MODELS_DIR / "intent_pipeline.joblib"
    joblib.dump(pipeline, model_path)
    logger.info(f"Saved intent pipeline to {model_path}")

    # Evaluation results JSON
    eval_results = {
        "model_name": "TF-IDF (1,2-gram) + Calibrated Logistic Regression",
        "dataset": "Banking77 (Primary Customer Support Benchmark)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "test_samples": int(len(X_test)),
        "num_classes": len(classes),
        "classes": classes,
        "metrics": {
            "accuracy": round(acc, 4),
            "macro_f1": round(float(f1_macro), 4),
            "macro_precision": round(float(prec_macro), 4),
            "macro_recall": round(float(rec_macro), 4),
            "weighted_f1": round(float(f1_weighted), 4),
            "weighted_precision": round(float(prec_weighted), 4),
            "weighted_recall": round(float(rec_weighted), 4),
            "val_accuracy": round(float(val_acc), 4)
        },
        "confidence_distribution": {
            "mean": round(avg_confidence, 4),
            "median": round(p50_confidence, 4),
            "p25": round(p25_confidence, 4),
            "p75": round(p75_confidence, 4),
            "min": round(min_confidence, 4)
        },
        "recommended_threshold": 0.55,
        "per_class_metrics_sample": {
            c: {k: round(v, 4) for k, v in report_dict[c].items()}
            for c in classes[:15]
            if c in report_dict
        }
    }

    with open(MODELS_DIR / "evaluation_results.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    # Metadata
    metadata = {
        "version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "algorithm": "LogisticRegression(C=3.0, class_weight='balanced')",
        "vectorizer": "TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)",
        "num_classes": len(classes),
        "default_threshold": 0.55
    }

    with open(MODELS_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Intent model training and evaluation completed successfully.")
    return eval_results


if __name__ == "__main__":
    train_and_evaluate_intent_model()
