"""
API Router aggregating all domain endpoints.
"""

from fastapi import APIRouter
from app.api.endpoints import chat, intents, knowledge, datasets, analytics, status

api_router = APIRouter()

api_router.include_router(chat.router, tags=["Conversational Chat"])
api_router.include_router(intents.router, tags=["Intent Classification"])
api_router.include_router(knowledge.router, tags=["Knowledge Base"])
api_router.include_router(datasets.router, tags=["Datasets"])
api_router.include_router(analytics.router, tags=["Analytics & KPIs"])
api_router.include_router(status.router, tags=["System Health & Diagnostics"])
