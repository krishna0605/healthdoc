"""
HealthDoc AI Service - Main Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, analyze, query, embeddings
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("🚀 Starting HealthDoc AI Service...")
    # Load ML models here if needed
    yield
    # Shutdown
    print("👋 Shutting down AI Service...")


app = FastAPI(
    title="HealthDoc AI Service",
    description="AI/NLP microservice for medical report analysis",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(embeddings.router, prefix="/api/embeddings", tags=["Embeddings"])


@app.get("/")
async def root():
    return {
        "name": "HealthDoc AI Service",
        "version": "0.1.0",
        "status": "running",
    }
