"""
AI Recommendations routes - Generate health recommendations based on abnormal values
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)


class AbnormalMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str


class RecommendationRequest(BaseModel):
    report_id: str
    abnormal_metrics: List[AbnormalMetric]


class Recommendation(BaseModel):
    title: str
    description: str
    category: str
    icon: str


class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]


@router.post("/generate", response_model=RecommendationsResponse)
async def generate_recommendations(request: RecommendationRequest):
    """
    Generate personalized health recommendations based on abnormal metrics
    """
    try:
        print(f"💡 Generating recommendations for {len(request.abnormal_metrics)} abnormal metrics")
        
        # Build metrics summary for prompt
        metrics_text = "\n".join([
            f"- {m.name}: {m.value} {m.unit} ({m.status})"
            for m in request.abnormal_metrics
        ])
        
        prompt = f"""Based on these health metrics that are outside normal range:

{metrics_text}

Provide 3-5 specific, actionable lifestyle recommendations to help improve these values.

Return ONLY a JSON object with this structure:
{{
  "recommendations": [
    {{
      "title": "Short actionable title",
      "description": "2-3 sentence explanation of what to do and why",
      "category": "diet" | "exercise" | "lifestyle" | "medical",
      "icon": "emoji that represents this recommendation"
    }}
  ]
}}

Be practical and encouraging. Don't be alarmist."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful health advisor providing practical lifestyle recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        response_text = response.choices[0].message.content
        
        # Parse JSON response
        import json
        text = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        
        print(f"✅ Generated {len(data.get('recommendations', []))} recommendations")
        
        return RecommendationsResponse(
            recommendations=data.get("recommendations", [])
        )
        
    except Exception as e:
        print(f"❌ Recommendations failed: {e}")
        # Return fallback recommendations
        return RecommendationsResponse(
            recommendations=[
                Recommendation(
                    title="Consult Your Doctor",
                    description="Some of your values are outside normal range. Schedule a follow-up with your healthcare provider to discuss these results.",
                    category="medical",
                    icon="👨‍⚕️"
                ),
                Recommendation(
                    title="Stay Hydrated",
                    description="Drinking plenty of water helps your body function optimally and can improve many health markers.",
                    category="lifestyle",
                    icon="💧"
                ),
                Recommendation(
                    title="Regular Exercise",
                    description="Aim for at least 30 minutes of moderate exercise most days. This can help improve many health metrics.",
                    category="exercise",
                    icon="🏃"
                )
            ]
        )
