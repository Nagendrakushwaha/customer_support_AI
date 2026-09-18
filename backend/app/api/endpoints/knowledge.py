"""
Knowledge base document and search endpoints.
"""

from typing import List
from fastapi import APIRouter
from app.schemas.knowledge import (
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    SearchResultItem,
    DocumentMetadata
)
from app.services.knowledge_service import knowledge_service

router = APIRouter()


@router.get("/knowledge-base")
async def get_knowledge_base():
    """Returns metadata for all indexed documents and chunks in the knowledge base."""
    summary = knowledge_service.get_summary()
    return {
        "status": "ready" if knowledge_service.is_loaded else "unindexed",
        "total_documents": summary.get("total_documents", 0),
        "total_chunks": summary.get("total_chunks", 0),
        "documents": [
            DocumentMetadata(
                filename=d["filename"],
                title=d["title"],
                document_type=d["document_type"],
                pages=d["pages"],
                characters=d["characters"],
                chunks=d["chunks"]
            )
            for d in summary.get("documents", [])
        ],
        "authoritative_policy_constants": summary.get("authoritative_policy_constants", {})
    }


@router.post("/knowledge-base/search", response_model=KnowledgeSearchResponse)
async def search_knowledge_base(request: KnowledgeSearchRequest):
    """Executes vector search over the knowledge base chunks."""
    results = knowledge_service.search(query=request.query, top_k=request.top_k)
    return KnowledgeSearchResponse(
        query=request.query,
        total_results=len(results),
        results=[
            SearchResultItem(
                chunk_id=r["chunk_id"],
                document_name=r["document_name"],
                document_title=r["document_title"],
                document_type=r["document_type"],
                page=r["page"],
                score=r["relevance_score"],
                text=r["text"]
            )
            for r in results
        ]
    )
