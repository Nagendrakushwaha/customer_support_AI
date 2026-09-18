"""
CLI script to build knowledge base vector index.
Usage:
    py -3.13 scripts/build_knowledge_index.py
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from data_processing.build_knowledge_index import build_knowledge_base

if __name__ == "__main__":
    print("Building knowledge base retrieval index...")
    summary = build_knowledge_base()
    print(f"Indexing complete! Indexed {summary['total_documents']} documents into {summary['total_chunks']} chunks.")
