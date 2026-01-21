"""
RAG Query routes - Ask questions about medical reports
Uses stored extracted text directly instead of vector embeddings
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from supabase import create_client, Client

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# Setup clients
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Constants
CHAT_MODEL = "gpt-4o-mini"


class QueryRequest(BaseModel):
    """Request model for query"""
    report_id: str
    question: str
    user_id: str
    conversation_id: Optional[str] = None


class SourceChunk(BaseModel):
    """Source chunk from retrieval"""
    text: str
    chunk_index: int
    relevance_score: float


class QueryResponse(BaseModel):
    """Response model for query"""
    answer: str
    sources: List[SourceChunk]
    conversation_id: str


@router.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    """
    Ask a question about a report.
    Uses the extracted text directly (no vector embeddings required).
    """
    try:
        print(f"❓ Question for report {request.report_id}: {request.question}")
        
        # 1. Get the report's extracted text from database
        print("📄 Fetching report data from Supabase...")
        result = supabase.table("reports").select("extracted_text, title").eq("id", request.report_id).single().execute()
        
        if not result.data:
            return QueryResponse(
                answer="I couldn't find this report. Please make sure the analysis is complete.",
                sources=[],
                conversation_id=request.conversation_id or "not-found"
            )
        
        extracted_text = result.data.get("extracted_text", "")
        report_title = result.data.get("title", "Report")
        
        if not extracted_text:
            return QueryResponse(
                answer="This report hasn't been analyzed yet. Please wait for the analysis to complete.",
                sources=[],
                conversation_id=request.conversation_id or "no-text"
            )
        
        # Limit text length for API
        context = extracted_text[:8000]  # First 8K chars
        
        print(f"📝 Using {len(context)} chars of context")
        
        # 2. Generate response using GPT-4o-mini
        print("🧠 Generating answer with GPT-4o-mini...")
        messages = [
            {
                "role": "system",
                "content": """You are an intelligent and empathetic medical assistant analyzing a patient's health report.
    
    CORE RULES:
    1. **Context**: Answer questions based on the provided report content.
    2. **Conversation**: If the user says "Hi", "Hello", or asks "How are you?", respond politely and ask how you can help with their report.
    3. **Guardrails**: If the user asks about completely unrelated topics (sports, coding, movies), politely decline: "I'm focused on analyzing your health report. How can I help with that?"
    4. **Tone**: Professional yet conversational. Start answers directly (no "Based on the report..." repetition).
    5. **Uncertainty**: If the report doesn't contain the answer, say "I don't see that information in this specific report," but offer related insights if possible."""
            },
            {
                "role": "user",
                "content": f"""Report Context: "{report_title}"
    
    {context}
    
    User Question: {request.question}"""
            }
        ]
        
        response = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        print(f"✅ Answer generated ({len(answer)} chars)")
        
        # 3. Return answer with a source reference
        return QueryResponse(
            answer=answer,
            sources=[
                SourceChunk(
                    text=f"From: {report_title}",
                    chunk_index=0,
                    relevance_score=1.0
                )
            ],
            conversation_id=request.conversation_id or f"conv-{request.report_id[:8]}"
        )
        
    except Exception as e:
        print(f"❌ Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions/{report_id}")
async def get_question_suggestions(report_id: str):
    """Get suggested follow-up questions for a report"""
    return {
        "report_id": report_id,
        "suggestions": [
            "What are the main findings in this report?",
            "Are any values outside the normal range?",
            "What does my hemoglobin level indicate?",
            "Should I be concerned about any results?",
            "What lifestyle changes could improve these results?",
        ],
    }
