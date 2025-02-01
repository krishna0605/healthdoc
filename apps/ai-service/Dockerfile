FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy project files (from root context)
COPY apps/ai-service/pyproject.toml apps/ai-service/poetry.lock* ./
COPY apps/ai-service/README.md ./

# Configure poetry to not create a virtualenv (easier for docker)
RUN poetry config virtualenvs.create false

# Install only production dependencies (skips dev tools like black, pytest, etc.)
RUN poetry install --no-interaction --no-ansi --no-root --only main

# Copy app code (from root context)
COPY apps/ai-service/app ./app/

# Expose port (railway usually sets PORT env var)
EXPOSE 8000

# Start command (using $PORT if available, else 8000)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
