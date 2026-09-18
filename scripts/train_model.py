"""
CLI script to execute intent model training.
Usage:
    py -3.13 scripts/train_model.py
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from training.train_intent_model import train_and_evaluate_intent_model

if __name__ == "__main__":
    print("Executing intent model training pipeline...")
    results = train_and_evaluate_intent_model()
    print(f"Training complete! Test Accuracy: {results['metrics']['accuracy']:.4f}, Macro F1: {results['metrics']['macro_f1']:.4f}")
