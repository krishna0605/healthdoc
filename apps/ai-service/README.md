# HealthDoc AI Service

AI/NLP microservice that provides:
- OCR processing for medical reports (PDF/Image)
- Medical Named Entity Recognition (NER)
- Multi-level summarization
- RAG-based Q&A

## Setup

```bash
# Install dependencies
poetry install

# Download spaCy models
python -m spacy download en_core_web_sm
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_lg-0.5.4.tar.gz

# Run the service
poetry run uvicorn app.main:app --reload --port 8000
```

## Environment Variables

```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
QDRANT_URL=http://localhost:6333
```
