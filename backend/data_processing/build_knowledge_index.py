"""
Knowledge Base Ingestion and Vector Indexing Pipeline.
Dynamically extracts text from all policy PDFs using PyMuPDF, performs
semantic chunking with metadata tracking (page, doc title, category),
and constructs an optimized retrieval index.
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

import joblib
import pymupdf
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_KB_DIRS = [
    WORKSPACE_ROOT / "Dataset" / "knowledge_base",
    WORKSPACE_ROOT / "Customer_support_conversation_AI" / "Dataset" / "knowledge_base",
]
MODELS_DIR = WORKSPACE_ROOT / "models"
PROCESSED_DIR = WORKSPACE_ROOT / "processed_data"


def resolve_kb_dir() -> Path:
    for candidate in RAW_KB_DIRS:
        if candidate.exists() and candidate.is_dir():
            return candidate
    raise FileNotFoundError(f"Could not find knowledge_base folder in {[str(p) for p in RAW_KB_DIRS]}")


def clean_chunk_text(text: str) -> str:
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def chunk_text(text: str, max_words: int = 250, overlap: int = 40) -> List[str]:
    words = text.split()
    if not words:
        return []
    if len(words) <= max_words:
        return [" ".join(words)]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_words, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        if end == len(words):
            break
        start += (max_words - overlap)
    return chunks


def build_knowledge_base():
    kb_dir = resolve_kb_dir()
    logger.info(f"Ingesting knowledge base documents from: {kb_dir}")

    # Load manifest if present
    manifest_file = kb_dir / "manifest.json"
    manifest_data = {}
    doc_metadata_map = {}
    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            for doc in manifest_data.get("documents", []):
                doc_metadata_map[doc["filename"]] = doc
            logger.info(f"Loaded manifest with {len(doc_metadata_map)} document definitions.")
        except Exception as e:
            logger.warning(f"Could not parse manifest.json: {e}")

    # Dynamically find all PDF files
    pdf_files = sorted(list(kb_dir.glob("*.pdf")))
    logger.info(f"Discovered {len(pdf_files)} PDF files in knowledge base.")

    all_chunks: List[Dict[str, Any]] = []
    processed_docs: List[Dict[str, Any]] = []

    for pdf_path in pdf_files:
        filename = pdf_path.name
        doc_meta = doc_metadata_map.get(filename, {})
        title = doc_meta.get("title", filename.replace(".pdf", "").replace("_", " ").title())
        doc_type = doc_meta.get("document_type", "General Support Policy")

        try:
            doc = pymupdf.open(str(pdf_path))
            total_pages = len(doc)
            doc_text_length = 0

            for page_num in range(total_pages):
                page = doc[page_num]
                raw_text = page.get_text()
                cleaned = clean_chunk_text(raw_text)
                if not cleaned:
                    continue
                doc_text_length += len(cleaned)

                # Specialized handling for FAQ vs standard policy
                if "faq" in filename.lower():
                    # Look for Q: / A: patterns or numbered questions
                    qa_splits = re.split(r"(?:^|\n)(?:Q\d*[:.]|\d+\.)\s+", cleaned)
                    if len(qa_splits) > 1:
                        for idx, item in enumerate(qa_splits):
                            item_clean = item.strip()
                            if len(item_clean.split()) >= 10:
                                all_chunks.append({
                                    "chunk_id": f"{filename}_p{page_num + 1}_qa{idx}",
                                    "filename": filename,
                                    "document_title": title,
                                    "document_type": doc_type,
                                    "page": page_num + 1,
                                    "text": item_clean,
                                    "word_count": len(item_clean.split())
                                })
                    else:
                        page_chunks = chunk_text(cleaned, max_words=200, overlap=30)
                        for c_idx, chk in enumerate(page_chunks):
                            all_chunks.append({
                                "chunk_id": f"{filename}_p{page_num + 1}_c{c_idx}",
                                "filename": filename,
                                "document_title": title,
                                "document_type": doc_type,
                                "page": page_num + 1,
                                "text": chk,
                                "word_count": len(chk.split())
                            })
                else:
                    page_chunks = chunk_text(cleaned, max_words=220, overlap=35)
                    for c_idx, chk in enumerate(page_chunks):
                        all_chunks.append({
                            "chunk_id": f"{filename}_p{page_num + 1}_c{c_idx}",
                            "filename": filename,
                            "document_title": title,
                            "document_type": doc_type,
                            "page": page_num + 1,
                            "text": chk,
                            "word_count": len(chk.split())
                        })

            processed_docs.append({
                "filename": filename,
                "title": title,
                "document_type": doc_type,
                "pages": total_pages,
                "characters": doc_text_length,
                "chunks": len([c for c in all_chunks if c["filename"] == filename])
            })
            logger.info(f"Processed {filename}: {total_pages} pages, {processed_docs[-1]['chunks']} chunks created.")

        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")

    logger.info(f"Total extracted chunks across all documents: {len(all_chunks)}")

    # Build TF-IDF Vectorizer over all chunk texts
    corpus = [c["text"] for c in all_chunks]
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
        sublinear_tf=True,
        stop_words="english"
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Save artifacts
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Save vectorizer and matrix
    joblib.dump(vectorizer, MODELS_DIR / "knowledge_vectorizer.joblib")
    joblib.dump(tfidf_matrix, MODELS_DIR / "knowledge_tfidf_matrix.joblib")

    # Save chunks data
    chunks_file = PROCESSED_DIR / "knowledge_chunks.json"
    with open(chunks_file, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2)

    # Save summary metadata
    summary = {
        "total_documents": len(processed_docs),
        "total_chunks": len(all_chunks),
        "documents": processed_docs,
        "authoritative_policy_constants": manifest_data.get("authoritative_policy_constants", {}),
        "company": manifest_data.get("company", "ShopEase"),
        "version": manifest_data.get("version", "1.0")
    }
    with open(MODELS_DIR / "knowledge_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info("Knowledge base indexing completed successfully.")
    return summary


if __name__ == "__main__":
    build_knowledge_base()
