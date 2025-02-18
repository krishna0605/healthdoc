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
    standard_range: Optional[str] = None
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
    report_type: str = "LAB_REPORT"
    tags: List[str] = []
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
                "content": "You are an expert medical AI analyst. Analyze medical reports and return structured JSON data only. You must identify the type of report (Lab, Prescription, X-Ray, etc.) and extract all relevant details with high precision. For lab reports, you MUST provide standard reference ranges for every metric."
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
            # Handle potential markdown artifacts
            if "{" not in text: 
                 raise ValueError("Response does not contain JSON")
            
            # Find the first { and last }
            start = text.find("{")
            end = text.rfind("}") + 1
            json_str = text[start:end]
            
            data = json.loads(json_str)
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
                        "standard_range": str(m.get("standard_range", "")),
                        "status": str(m.get("status", "NORMAL")).upper(),
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
                    "severity": str(a["severity"]).upper(),
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
            report_type=data.get("report_type", "LAB_REPORT"),
            tags=data.get("tags", []),
            extracted_text=str(data.get("extracted_text", ""))[:1500],
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
    return """Analyze this medical report/image and provide a detailed structured JSON response.
    
    1. **Identify the Report Type**: Classify as one of: ["LAB_REPORT", "PRESCRIPTION", "RADIOLOGY" (X-Ray/MRI/CT), "PATHOLOGY", "OTHER"].
    2. **Generate Tags**: Create a list of relevant tags (e.g., "Blood Test", "Thyroid", "Chest X-Ray", "Antibiotics", "Fracture").
    3. **Extraction**:
       - **Lab Report**: Extract ALL test names, values, and units. If a reference range is missing, PROVIDE THE STANDARD MEDICAL RANGE for a healthy adult. Infer the status (NORMAL/LOW/HIGH) based on the range.
       - **Prescription**: Extract medicine names, dosages, frequencies, and duration as 'key_findings'.
       - **Radiology**: Extract the 'Impression', 'Findings', and 'Body Part' as 'report_description' and 'key_findings'.
    
    Return a JSON object with this EXACT structure:
    {
      "patient_name": "Name or Unknown",
      "lab_name": "Lab/Hospital Name or Unknown",
      "report_date": "YYYY-MM-DD or null",
      "report_type": "LAB_REPORT",
      "tags": ["Tag1", "Tag2"],
      "report_description": "Brief summary of what this report is.",
      "extracted_text": "Concise text dump of the report content.",
      "patient_summary": "Simple, plain-language summary for the patient (start with 'Dear [Name]'). Explain what the results mean.",
      "clinical_summary": "Technical summary for a doctor.",
      "key_findings": ["Finding 1", "Finding 2"],
      "metrics": [
        {
          "name": "Hemoglobin",
          "value": 14.2,
          "unit": "g/dL",
          "standard_range": "13.5 - 17.5 g/dL",
          "status": "NORMAL",
          "category": "Hematology"
        }
      ],
      "abnormalities": [
        {
          "metricName": "Vitamin D",
          "severity": "MODERATE",
          "description": "Vitamin D is lower than normal.",
          "clinicalContext": "Low Vitamin D can lead to bone weakness."
        }
      ]
    }
    
    IMPORTANT: 
    - Do not invent values for metrics that are effectively missing.
    - BUT DO provide standard ranges and categories for metrics that ARE present.
    - Be exhaustive with metrics; extract as many as you can clearly identify.
    - For images (X-ray, etc.), describe them in detail in 'report_description' and 'key_findings'.
    - Return ONLY the JSON object, no markdown code blocks."""
