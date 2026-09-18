"""
Knowledge Base Retrieval Service.
Implements vector search (TF-IDF Cosine Similarity) with semantic chunk scoring,
page tracing, and source document attribution.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

logger = logging.getLogger(__name__)


class KnowledgeService:
    def __init__(self):
        self.vectorizer = None
        self.tfidf_matrix = None
        self.chunks: List[Dict[str, Any]] = []
        self.summary: Dict[str, Any] = {}
        self.is_loaded = False
        self.load_index()

    def load_index(self):
        vec_path = settings.KB_VECTORIZER_PATH
        mat_path = settings.KB_TFIDF_MATRIX_PATH
        chunks_path = settings.KB_CHUNKS_PATH
        sum_path = settings.KB_SUMMARY_PATH

        if not (vec_path.exists() and mat_path.exists() and chunks_path.exists()):
            logger.warning("Knowledge base index files missing. Run build_knowledge_index.py first.")
            return

        try:
            self.vectorizer = joblib.load(vec_path)
            self.tfidf_matrix = joblib.load(mat_path)

            with open(chunks_path, "r", encoding="utf-8") as f:
                self.chunks = json.load(f)

            if sum_path.exists():
                with open(sum_path, "r", encoding="utf-8") as f:
                    self.summary = json.load(f)

            self.is_loaded = True
            logger.info(f"KnowledgeService loaded {len(self.chunks)} chunks across {self.summary.get('total_documents', 0)} documents.")
        except Exception as e:
            logger.error(f"Failed to load knowledge base index: {e}")
            self.is_loaded = False

    def search(
        self,
        query: str,
        top_k: int = 3,
        threshold: Optional[float] = None,
        preferred_doc: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not self.is_loaded or not self.chunks or self.vectorizer is None:
            return []

        min_score = threshold if threshold is not None else settings.RELEVANCE_THRESHOLD

        # Vectorize query
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Document-affinity boost if preferred_doc is specified
        if preferred_doc:
            for idx, chunk in enumerate(self.chunks):
                if chunk["filename"].lower() == preferred_doc.lower():
                    similarities[idx] *= 1.25

        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score < min_score:
                break
            chunk = self.chunks[idx]
            results.append({
                "chunk_id": chunk["chunk_id"],
                "document_name": chunk["filename"],
                "document_title": chunk["document_title"],
                "document_type": chunk["document_type"],
                "page": chunk["page"],
                "relevance_score": round(score, 4),
                "text": chunk["text"]
            })
            if len(results) >= top_k:
                break

        return results

    def get_document_catalog(self) -> List[Dict[str, Any]]:
        return self.summary.get("documents", [])

    def get_summary(self) -> Dict[str, Any]:
        return self.summary


knowledge_service = KnowledgeService()
