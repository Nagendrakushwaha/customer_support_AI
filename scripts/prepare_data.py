"""
Reproducible CLI script to run dataset preprocessing.
Usage:
    py -3.13 scripts/prepare_data.py
"""

import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from data_processing.preprocess_dataset import run_all_preprocessing

if __name__ == "__main__":
    print("Executing dataset preparation...")
    summary = run_all_preprocessing()
    print("Preprocessing completed successfully.")
