# ============================================================================
# Acme Lease Processor — Backend
# Build context: repo root (needs access to backend/ and template/)
# ============================================================================

FROM python:3.13-slim

WORKDIR /app

# Install dependencies globally (no venv needed inside a container)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app/ /app/app/

# Copy Welcome Pack template (JSON form handles spaces in filename)
COPY ["template/Tenant Welcome Pack Template.docx", "/app/template/Tenant Welcome Pack Template.docx"]

# Template path inside the container
ENV TEMPLATE_PATH="/app/template/Tenant Welcome Pack Template.docx"

# Railway provides PORT automatically; default 8000 for local Docker
ENV PORT=8080

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
