import os
import json
import time
import base64
import io
from openai import OpenAI
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from PyPDF2 import PdfReader

# Initialize Environment
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# Setup Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Setup OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# Use GPT-4o-mini - cost efficient and capable
MODEL = "gpt-4o-mini"


class AnalyzeRequest(BaseModel):
    report_id: str
    file_path: str  # "user_id/filename.ext"
    user_id: str


class MetricResult(BaseModel):
    name: str
    value: float
    unit: str
    status: str  # "NORMAL", "LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH"
    category: Optional[str] = None


class AbnormalityResult(BaseModel):
    metricName: str
    severity: str  # "BORDERLINE", "MODERATE", "CRITICAL"
    description: str
    clinicalContext: Optional[str] = None


class AnalysisResult(BaseModel):
    patient_name: Optional[str] = None
    lab_name: Optional[str] = None
    report_date: Optional[str] = None
    report_description: Optional[str] = None
    extracted_text: str
    patient_summary: str
    clinical_summary: str
    key_findings: List[str]
    metrics: List[MetricResult]
    abnormalities: List[AbnormalityResult]
    report_id: str


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using PyPDF2"""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text_parts = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        full_text = "\n\n".join(text_parts)
        print(f"📄 Extracted {len(full_text)} characters from {len(reader.pages)} pages")
        return full_text[:15000]  # Limit to ~15K chars for API
    except Exception as e:
        print(f"⚠️ PDF extraction failed: {e}")
        return ""


@router.post("/", response_model=AnalysisResult)
async def analyze_report(request: AnalyzeRequest):
    """
    Analyze medical report using OpenAI GPT-4o-mini.
    """
    try:
        print(f"📥 Processing Analysis for Report {request.report_id}")
        
        # 1. Download File from Supabase Storage
        print(f"⬇️ Downloading {request.file_path}...")
        try:
            file_data = supabase.storage.from_("medical-reports").download(request.file_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download file: {str(e)}")

        # 2. Determine file type and extract content
        ext = request.file_path.split('.')[-1].lower()
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are an expert medical AI analyst. Analyze medical reports and return structured JSON data only. Extract ONLY the actual values from the report - do NOT make up or hallucinate any data."
            }
        ]
        
        # For images, use vision capability
        if ext in ['png', 'jpg', 'jpeg']:
            mime_type = f"image/{ext.replace('jpg', 'jpeg')}"
            base64_image = base64.b64encode(file_data).decode('utf-8')
            
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": get_analysis_prompt()
                    }
                ]
            })
        else:
            # For PDFs, use PyPDF2 for proper text extraction
            if ext == 'pdf':
                content_text = extract_text_from_pdf(file_data)
                if not content_text:
                    content_text = "[Unable to extract text from PDF - may be scanned/image-based]"
            else:
                # Plain text files
                content_text = file_data.decode('utf-8', errors='ignore')[:15000]
            
            print(f"📝 Content preview: {content_text[:200]}...")
            
            messages.append({
                "role": "user",
                "content": f"{get_analysis_prompt()}\n\n===== MEDICAL REPORT CONTENT =====\n{content_text}"
            })

        print("🧠 Invoking OpenAI GPT-4o-mini...")
        
        # 3. Call OpenAI API with retry logic
        max_retries = 3
        retry_delay = 5
        response_text = None
        
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=4000,
                )
                response_text = response.choices[0].message.content
                break
            except Exception as e:
                error_str = str(e)
                if "rate" in error_str.lower() or "429" in error_str:
                    if attempt < max_retries - 1:
                        print(f"⏳ Rate limited. Waiting {retry_delay}s before retry {attempt + 2}/{max_retries}...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        raise HTTPException(status_code=429, detail="API rate limit exceeded. Please try again later.")
                else:
                    raise HTTPException(status_code=500, detail=f"OpenAI API error: {error_str}")
        
        if not response_text:
            raise HTTPException(status_code=500, detail="Failed to get response from OpenAI")
        
        # 4. Parse Response
        try:
            text = response_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
        except Exception as e:
            print(f"JSON Parse Error: {response_text}")
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")

        # 5. Filter and validate metrics (remove any with null values)
        raw_metrics = data.get("metrics", [])
        valid_metrics = []
        for m in raw_metrics:
            if m and m.get("name") and m.get("value") is not None and m.get("unit"):
                try:
                    valid_metrics.append({
                        "name": str(m["name"]),
                        "value": float(m["value"]),
                        "unit": str(m["unit"]),
                        "status": str(m.get("status", "NORMAL")),
                        "category": str(m.get("category", "")) if m.get("category") else None
                    })
                except (ValueError, TypeError):
                    print(f"⚠️ Skipping invalid metric: {m}")
                    continue
        
        # Filter and validate abnormalities
        raw_abnormalities = data.get("abnormalities", [])
        valid_abnormalities = []
        for a in raw_abnormalities:
            if a and a.get("metricName") and a.get("severity") and a.get("description"):
                valid_abnormalities.append({
                    "metricName": str(a["metricName"]),
                    "severity": str(a["severity"]),
                    "description": str(a["description"]),
                    "clinicalContext": str(a.get("clinicalContext", "")) if a.get("clinicalContext") else None
                })
        
        print(f"📊 Valid metrics: {len(valid_metrics)}, abnormalities: {len(valid_abnormalities)}")
        
        # 6. Return Structured Data
        result = AnalysisResult(
            report_id=request.report_id,
            patient_name=data.get("patient_name"),
            lab_name=data.get("lab_name"),
            report_date=data.get("report_date"),
            report_description=data.get("report_description"),
            extracted_text=str(data.get("extracted_text", ""))[:500],
            patient_summary=data.get("patient_summary", "No summary available"),
            clinical_summary=data.get("clinical_summary", "No summary available"),
            key_findings=data.get("key_findings", []),
            metrics=valid_metrics,
            abnormalities=valid_abnormalities
        )

        print(f"✅ Analysis Complete for {request.report_id}")
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_analysis_prompt() -> str:
    return """Analyze this medical report and extract ONLY the actual data present in the report.
DO NOT make up or hallucinate any values. If a value is not present, do not include it.

Return a JSON object with:

1. "patient_name": The full name of the patient as shown on the report (if available, else "Unknown")
2. "patient_age": The age of the patient (if available, e.g., "45 years" or "32").
3. "lab_name": The name of the laboratory/pathology lab or hospital where the test was conducted. Look closely at the header and footer for company names or logos (e.g. 'Quest Diagnostics', 'LabCorp', 'Apollo Hospitals'). If not explicitly stated, return "Unknown Lab".
3. "report_date": The date of the report or test (if available, in YYYY-MM-DD format)
4. "report_description": A 2-3 sentence paragraph describing what this report is about, what tests were performed, and the general health status of the patient based on the findings

5. "extracted_text": Concise text summary of the document (max 500 chars)
6. "patient_summary": A detailed 2-3 paragraph summary in plain language (approx 150-200 words). It should start with the patient's name. Explain the key findings, their potential causes, and what the key performance metrics indicate about the patient's health. Avoid complex jargon where possible, or explain it.
7. "clinical_summary": Technical summary for doctors based ONLY on actual data
8. "key_findings": Array of important findings (only from actual data)
9. "metrics": Array of health metrics ACTUALLY found in the report, each with:
   - "name": Exact metric name from the report (e.g., "Hemoglobin", "RBC Count")
   - "value": Numeric value as shown in report (float)
   - "unit": Exact unit from report (e.g., "g/dL", "million/cumm")
   - "status": Determine based on the reference range provided in report: ["NORMAL", "LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH"]
   - "category": Category (e.g., "Hematology", "Lipid Panel", "Liver Function")
10. "abnormalities": Array of detected abnormal values, each with:
   - "metricName": The metric name
   - "severity": Based on how far from normal: ["BORDERLINE", "MODERATE", "CRITICAL"]
   - "description": Brief explanation
   - "clinicalContext": Health implications

IMPORTANT: Only include metrics and values that are ACTUALLY present in the report.
Return ONLY the JSON object, no markdown code blocks."""

