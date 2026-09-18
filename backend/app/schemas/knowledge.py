"""
Knowledge base schemas.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    filename: str
    title: str
    document_type: str
    pages: int
    characters: int
    chunks: int


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(default=3, ge=1, le=10)


class SearchResultItem(BaseModel):
    chunk_id: str
    document_name: str
    document_title: str
    document_type: str
    page: int
    score: float
    text: str


class KnowledgeSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
