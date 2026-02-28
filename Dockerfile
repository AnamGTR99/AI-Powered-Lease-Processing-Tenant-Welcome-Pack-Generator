# ============================================================================
# Acme Lease Processor — Backend
# Multi-stage build for slim production image
# Build context: repo root (needs access to backend/ and template/)
# ============================================================================

# ---- Stage 1: Install Python dependencies ----
FROM python:3.13-slim AS builder

WORKDIR /build
COPY backend/requirements.txt .
RUN python -m venv /build/venv \
    && /build/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /build/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- Stage 2: Production image ----
FROM python:3.13-slim

WORKDIR /app

# Copy pre-built virtual environment (no pip/build tools in final image)
COPY --from=builder /build/venv /app/venv

# Copy application code
COPY backend/app/ /app/app/

# Copy Welcome Pack template (JSON form handles spaces in filename)
COPY ["template/Tenant Welcome Pack Template.docx", "/app/template/Tenant Welcome Pack Template.docx"]

# Put venv Python on PATH
ENV PATH="/app/venv/bin:$PATH"

# Template path inside the container
ENV TEMPLATE_PATH="/app/template/Tenant Welcome Pack Template.docx"

# Railway provides PORT automatically; default 8000 for local Docker
ENV PORT=8000

EXPOSE ${PORT}

CMD ["sh", "-c", "/app/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
