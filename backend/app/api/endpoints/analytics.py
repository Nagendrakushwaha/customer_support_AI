"""
Analytics and KPIs endpoint.
"""

from fastapi import APIRouter
from app.schemas.system import AnalyticsSummary
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics():
    """Returns real operational analytics, response times, and intent distribution."""
    return analytics_service.get_summary()
