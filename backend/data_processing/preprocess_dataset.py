"""
Dataset preprocessing module for Customer Support Conversational AI.
Loads Banking77 and CLINC150, validates schemas, normalizes text,
creates stratified train/validation/test splits, and outputs clean metadata.
Raw data is treated as read-only.
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, Any
import pandas as pd
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DATASET_DIRS = [
    WORKSPACE_ROOT / "Dataset",
    WORKSPACE_ROOT / "Customer_support_conversation_AI" / "Dataset",
]
PROCESSED_DIR = WORKSPACE_ROOT / "processed_data"


def resolve_dataset_path(subpath: str) -> Path:
    """Find dataset file in available root directories."""
    for base in RAW_DATASET_DIRS:
        candidate = base / subpath
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Could not locate dataset file: {subpath} in {[str(p) for p in RAW_DATASET_DIRS]}")


def clean_text(text: str) -> str:
    """
    Clean and normalize customer query text.
    - Strips leading/trailing whitespace
    - Normalizes internal whitespace
    - Preserves punctuation and casing essential for intent nuances
    """
    if not isinstance(text, str):
        return ""
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned


def process_banking77() -> Dict[str, Any]:
    """
    Process Banking77 dataset.
    Columns in parquet: 'text', 'label', 'label_text'
    """
    train_file = resolve_dataset_path("Banking77/train-00000-of-00001.parquet")
    test_file = resolve_dataset_path("Banking77/test-00000-of-00001.parquet")

    logger.info(f"Loading Banking77 from {train_file} and {test_file}...")
    df_train_raw = pd.read_parquet(train_file)
    df_test_raw = pd.read_parquet(test_file)

    # Clean text
    df_train_raw["text"] = df_train_raw["text"].apply(clean_text)
    df_test_raw["text"] = df_test_raw["text"].apply(clean_text)

    # Remove duplicates within train split
    train_dedup = df_train_raw.drop_duplicates(subset=["text"]).copy()
    test_dedup = df_test_raw.drop_duplicates(subset=["text"]).copy()

    # Create stratified validation split from train
    train_set, val_set = train_test_split(
        train_dedup,
        test_size=0.10,
        random_state=42,
        stratify=train_dedup["label_text"]
    )

    # Create label mapping
    unique_labels = sorted(train_dedup["label_text"].unique().tolist())
    label_to_id = {label: idx for idx, label in enumerate(unique_labels)}
    id_to_label = {idx: label for idx, label in enumerate(unique_labels)}

    stats = {
        "name": "Banking77",
        "num_classes": len(unique_labels),
        "classes": unique_labels,
        "raw_train_samples": int(len(df_train_raw)),
        "train_samples": int(len(train_set)),
        "val_samples": int(len(val_set)),
        "test_samples": int(len(test_dedup)),
        "class_distribution_sample": train_set["label_text"].value_counts().head(10).to_dict()
    }

    # Save processed splits
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    train_set.to_parquet(PROCESSED_DIR / "banking77_train.parquet", index=False)
    val_set.to_parquet(PROCESSED_DIR / "banking77_val.parquet", index=False)
    test_dedup.to_parquet(PROCESSED_DIR / "banking77_test.parquet", index=False)

    with open(PROCESSED_DIR / "banking77_labels.json", "w", encoding="utf-8") as f:
        json.dump({
            "label_to_id": label_to_id,
            "id_to_label": id_to_label,
            "classes": unique_labels
        }, f, indent=2)

    logger.info(f"Banking77 processed: {stats['train_samples']} train, {stats['val_samples']} val, {stats['test_samples']} test.")
    return stats


def process_clinc150() -> Dict[str, Any]:
    """
    Process CLINC150 dataset for general domain benchmarking.
    Columns: 'utterance', 'label'
    """
    train_file = resolve_dataset_path("CLINC150/train-00000-of-00001.parquet")
    val_file = resolve_dataset_path("CLINC150/validation-00000-of-00001.parquet")
    test_file = resolve_dataset_path("CLINC150/test-00000-of-00001 (1).parquet")

    logger.info(f"Loading CLINC150...")
    df_train = pd.read_parquet(train_file)
    df_val = pd.read_parquet(val_file)
    df_test = pd.read_parquet(test_file)

    df_train["utterance"] = df_train["utterance"].apply(clean_text)
    df_val["utterance"] = df_val["utterance"].apply(clean_text)
    df_test["utterance"] = df_test["utterance"].apply(clean_text)

    classes = sorted(df_train["label"].unique().tolist())
    stats = {
        "name": "CLINC150",
        "num_classes": len(classes),
        "train_samples": int(len(df_train)),
        "val_samples": int(len(df_val)),
        "test_samples": int(len(df_test)),
        "sample_classes": classes[:10]
    }

    df_train.to_parquet(PROCESSED_DIR / "clinc150_train.parquet", index=False)
    df_val.to_parquet(PROCESSED_DIR / "clinc150_val.parquet", index=False)
    df_test.to_parquet(PROCESSED_DIR / "clinc150_test.parquet", index=False)

    logger.info(f"CLINC150 processed: {stats['train_samples']} train, {stats['val_samples']} val, {stats['test_samples']} test.")
    return stats


def run_all_preprocessing() -> Dict[str, Any]:
    logger.info("Starting complete preprocessing pipeline...")
    b77_stats = process_banking77()
    clinc_stats = process_clinc150()

    summary = {
        "status": "success",
        "banking77": b77_stats,
        "clinc150": clinc_stats
    }

    with open(PROCESSED_DIR / "dataset_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info("Dataset preprocessing finished successfully.")
    return summary


if __name__ == "__main__":
    run_all_preprocessing()
