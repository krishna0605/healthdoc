"""
Embeddings routes - Generate and store vector embeddings for RAG
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, VectorParams, Distance

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# Setup clients
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")

openai_client = OpenAI(api_key=OPENAI_API_KEY)


# Handle Qdrant connection (Remote or Local)
if QDRANT_URL and "localhost" not in QDRANT_URL and QDRANT_URL.startswith("http"):
    qdrant_client = QdrantClient(url=QDRANT_URL)
else:
    # Use local file storage if URL is not an HTTP endpoint
    # This enables running in single-container environments (like HF Spaces)
    qdrant_client = QdrantClient(path=QDRANT_URL or "qdrant_data")

from app.core.config import settings

# Collection name for report embeddings
COLLECTION_NAME = "report_chunks"
EMBEDDING_MODEL = settings.EMBEDDING_MODEL
EMBEDDING_DIMENSION = 1536


class EmbedRequest(BaseModel):
    """Request to generate embeddings for a report"""
    report_id: str
    user_id: str
    extracted_text: str


class EmbedResponse(BaseModel):
    """Response after generating embeddings"""
    report_id: str
    chunks_count: int
    success: bool


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)
        start += chunk_size - overlap
    
    return chunks


def ensure_collection_exists():
    """Create Qdrant collection if it doesn't exist"""
    try:
        collections = qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if COLLECTION_NAME not in collection_names:
            print(f"📦 Creating Qdrant collection: {COLLECTION_NAME}")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIMENSION,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Collection {COLLECTION_NAME} created")
        else:
            print(f"📦 Collection {COLLECTION_NAME} already exists")
    except Exception as e:
        print(f"⚠️ Error checking/creating collection: {e}")
        raise


@router.post("/generate", response_model=EmbedResponse)
async def generate_embeddings(request: EmbedRequest):
    """
    Generate and store embeddings for a report's extracted text.
    Called after analysis is complete.
    """
    try:
        print(f"🔢 Generating embeddings for report {request.report_id}")
        
        # Ensure collection exists
        ensure_collection_exists()
        
        # Split text into chunks
        chunks = chunk_text(request.extracted_text)
        print(f"📄 Split into {len(chunks)} chunks")
        
        if not chunks:
            return EmbedResponse(
                report_id=request.report_id,
                chunks_count=0,
                success=True
            )
        
        # Generate embeddings using OpenAI
        print(f"🧠 Generating embeddings with {EMBEDDING_MODEL}...")
        embeddings_response = openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=chunks
        )
        
        # Prepare points for Qdrant
        points = []
        for i, (chunk, embedding_data) in enumerate(zip(chunks, embeddings_response.data)):
            point_id = f"{request.report_id}_{i}"
            points.append(PointStruct(
                id=hash(point_id) & 0x7FFFFFFFFFFFFFFF,  # Positive int64
                vector=embedding_data.embedding,
                payload={
                    "report_id": request.report_id,
                    "user_id": request.user_id,
                    "chunk_index": i,
                    "chunk_text": chunk
                }
            ))
        
        # Delete existing embeddings for this report (in case of re-processing)
        try:
            qdrant_client.delete(
                collection_name=COLLECTION_NAME,
                points_selector={
                    "filter": {
                        "must": [
                            {"key": "report_id", "match": {"value": request.report_id}}
                        ]
                    }
                }
            )
        except Exception:
            pass  # Ignore if no existing points
        
        # Store in Qdrant
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        
        print(f"✅ Stored {len(points)} embeddings for report {request.report_id}")
        
        return EmbedResponse(
            report_id=request.report_id,
            chunks_count=len(chunks),
            success=True
        )
        
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}")
async def delete_embeddings(report_id: str):
    """Delete all embeddings for a report"""
    try:
        qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector={
                "filter": {
                    "must": [
                        {"key": "report_id", "match": {"value": report_id}}
                    ]
                }
            }
        )
        return {"success": True, "message": f"Deleted embeddings for report {report_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
