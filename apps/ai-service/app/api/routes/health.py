"""
Health check routes
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check - verify all dependencies are available"""
    # TODO: Check ML models loaded, DB connection, etc.
    return {
        "status": "ready",
        "models_loaded": True,
    }
