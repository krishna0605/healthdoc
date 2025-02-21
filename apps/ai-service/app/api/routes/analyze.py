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

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from environment variables.")

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
    predictions: List[str] = []
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
        content_text = ""  # Initialize to avoid unbound variable error
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are an expert medical AI analyst. Analyze medical reports and return structured JSON data only. You must identify the type of report (Lab, Prescription, X-Ray, etc.) and extract all relevant details with high precision. For lab reports, you MUST provide standard reference ranges for every metric."
            }
        ]
        
        # For images, use vision capability
        if ext in ['png', 'jpg', 'jpeg']:
            content_text = f"[Image Analysis Request] File: {request.file_path}"
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
                    max_tokens=8000,
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
            import re
            # Clean up the response text (remove markdown code blocks if present)
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            # Extract JSON using regex (find the outermost logical JSON object)
            json_match = re.search(r"\{[\s\S]*\}", cleaned_text)
            if not json_match:
                 raise ValueError("Response does not contain valid JSON structure")
            
            json_str = json_match.group(0)
            data = json.loads(json_str)
        except Exception as e:
            print(f"JSON Parse Error: {response_text}")
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")

        # 5. Filter and validate metrics (remove any with null values)
        raw_metrics = data.get("metrics", [])
        valid_metrics = []
        for m in raw_metrics:
                # Sanitize value
                raw_val = m.get("value")
                cleaned_val = None
                
                if isinstance(raw_val, (int, float)):
                    cleaned_val = float(raw_val)
                elif isinstance(raw_val, str):
                    # Remove common non-numeric chars but keep separators
                    # Handle < and >
                    val_str = raw_val.replace("<", "").replace(">", "").strip()
                    # Handle ranges like "4.0-5.6" by taking average
                    if "-" in val_str:
                        try:
                            parts = val_str.split("-")
                            if len(parts) == 2:
                                cleaned_val = (float(parts[0]) + float(parts[1])) / 2
                        except:
                            pass
                    
                    if cleaned_val is None:
                        # Try simple float conversion (removes other text)
                        import re
                        # Extract first number found
                        match = re.search(r"[-+]?\d*\.\d+|\d+", val_str)
                        if match:
                            cleaned_val = float(match.group())

                if cleaned_val is not None:
                    try:
                        valid_metrics.append({
                            "name": str(m["name"]),
                            "value": cleaned_val, # Use our cleaned float
                            "unit": str(m["unit"]),
                            "standard_range": str(m.get("standard_range", "")),
                            "status": str(m.get("status", "NORMAL")).upper(),
                            "category": str(m.get("category", "")) if m.get("category") else None,
                            # Store original raw value in extractedText for reference if needed
                            "extractedText": str(raw_val)
                        })
                    except (ValueError, TypeError) as e:
                         print(f"⚠️ Skipping invalid metric after cleanup: {m} - {e}")
                         continue
                else:
                     print(f"⚠️ Could not parse value from: {m}")
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
            extracted_text=content_text[:20000],  # Increased limit for better RAG context
            patient_summary=data.get("patient_summary", "No summary available"),
            clinical_summary=data.get("clinical_summary", "No summary available"),
            key_findings=data.get("key_findings", []),
            metrics=valid_metrics,
            abnormalities=valid_abnormalities,
            predictions=data.get("predictions", [])
        )

        print(f"✅ Analysis Complete for {request.report_id}")
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_analysis_prompt() -> str:
    return """Analyze this medical report/image and return a JSON object.

    1. **Identify the Report Type (CRITICAL)**:
       - **RADIOLOGY**: STRICTLY if the file is an X-Ray, MRI, CT Scan, Ultrasound, PET Scan, or contains terms like "Impression", "Technique", "Views".
       - **LAB_REPORT**: For blood tests, lipid panels, liver function, urine analysis.
       - **PRESCRIPTION**: Doctor's handwritten or printed medication list.
       - **PATHOLOGY**: Tissue biopsy results.
       - **OTHER**: Only if it clearly doesn't fit the above.

    2. **Generate Tags (MANDATORY)**: 
       - Generate at least 3-5 tags describing the scan or test.
       - Examples: "MRI Brain", "CT Abdomen", "X-Ray Chest", "Fracture", "Normal", "CBC", "Lipid Panel", "Thyroid", "High Cholesterol".

    3. **Extraction Rules**:
       - **RADIOLOGY**: Extract 'Impression', 'Findings', 'Technique', 'Body Part'. If image text is blurry, infer from visible headers.
       - **LAB**: Extract **EVERY SINGLE ROW** from table. **DO NOT SUMMARIZE**.
         - **MUST INCLUDE**: All sub-parameters like Neutrophils %, Lymphocytes %, Monocytes %, Eosinophils %, Basophils %, RBC Count, PCV/HCT, MCV, MCH, MCHC, RDW, Platelet Count, MPV, etc.
         - **CRITICAL**: Capture the **Reference Range** (or 'Normal Range', 'Bio. Ref. Interval') for EVERY metric into the `standard_range` field. If the report lists a range (e.g., "13.5-17.5" or "< 200"), you MUST extract it.
         - Capture both the Value and the Unit separately.
    
    4. **Detailed Analysis (EXTREMELY IMPORTANT)**:
       - **Patient Summary**: Write a **COMPREHENSIVE, detailed summary** in **minimum 3 full paragraphs**.
         - Para 1: Explain exactly what test was performed, the reason (if visible), and the body part/system involved.
         - Para 2: Detail every major finding. Explain complex medical terms in simple language. clearly state if results are normal or abnormal.
         - Para 3: Provide an overall conclusion, potential next steps, and health implications.
       - **Predictions**: You **MUST** generate at least 3 distinct "AI Predictions" or future risks based on these results.
         - Format: "CAUTION: AI PREDICTION - [Prediction details]"
         - Example: "CAUTION: AI PREDICTION - Risk of Vitamin D deficiency related bone loss if uncorrected."
         - If findings are normal, predict "Continued good health with maintenance of current lifestyle" etc.

    Return this EXACT JSON structure:
    {
      "patient_name": "Name",
      "lab_name": "Lab Name",
      "report_date": "YYYY-MM-DD",
      "report_type": "RADIOLOGY|LAB_REPORT|PRESCRIPTION|etc",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "report_description": "A detailed description of the document type and visual appearance.",
      "patient_summary": "Para 1 content...\n\nPara 2 content...\n\nPara 3 content...",
      "clinical_summary": "Technical doctor-facing summary.",
      "key_findings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4"],
      "predictions": [
          "CAUTION: AI PREDICTION - ...",
          "CAUTION: AI PREDICTION - ...",
          "CAUTION: AI PREDICTION - ..."
      ],
      "metrics": [
        { "name": "Test Name", "value": 0.0, "unit": "unit", "standard_range": "range", "status": "NORMAL/HIGH/LOW", "category": "Category" }
      ],
      "abnormalities": [
        { "metricName": "Name", "severity": "MODERATE", "description": "Explanation", "clinicalContext": "Context" }
      ]
    }
    
    IMPORTANT:
    - **Tags, predictions, and report_type are REQUIRED**.
    - **patient_summary MUST be long and detailed (300+ words).**
    - Do not hallucinate values.
    - Return ONLY valid JSON."""
