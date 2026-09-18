"""
Model evaluation script.
Loads trained model and tests against Banking77 test set,
displaying comprehensive performance metrics.
Usage:
    py -3.13 scripts/evaluate_model.py
"""

import sys
import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_DIR = WORKSPACE_ROOT / "processed_data"
MODELS_DIR = WORKSPACE_ROOT / "models"


def run_evaluation():
    model_file = MODELS_DIR / "intent_pipeline.joblib"
    test_file = PROCESSED_DIR / "banking77_test.parquet"
    eval_file = MODELS_DIR / "evaluation_results.json"

    if not model_file.exists():
        print(f"Error: Trained model not found at {model_file}. Please run train_model.py first.")
        sys.exit(1)

    print(f"Loading model from {model_file}...")
    pipeline = joblib.load(model_file)

    print(f"Loading test data from {test_file}...")
    df_test = pd.read_parquet(test_file)
    X_test = df_test["text"].values
    y_test = df_test["label_text"].values

    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_test, preds, average="macro", zero_division=0)
    p_weight, r_weight, f1_weight, _ = precision_recall_fscore_support(y_test, preds, average="weighted", zero_division=0)

    print("=" * 60)
    print("           INTENT MODEL EVALUATION REPORT (Banking77 Test)")
    print("=" * 60)
    print(f"Total Test Samples: {len(X_test)}")
    print(f"Accuracy:           {acc * 100:.2f}%")
    print(f"Macro Precision:    {p_macro * 100:.2f}%")
    print(f"Macro Recall:       {r_macro * 100:.2f}%")
    print(f"Macro F1 Score:     {f1_macro * 100:.2f}%")
    print(f"Weighted F1 Score:  {f1_weight * 100:.2f}%")
    print("=" * 60)

    if eval_file.exists():
        with open(eval_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        print("Model Metadata:")
        print(f"Algorithm: {data.get('model_name')}")
        print(f"Classes:   {data.get('num_classes')}")
        print(f"Recommended Threshold: {data.get('recommended_threshold')}")


if __name__ == "__main__":
    run_evaluation()
