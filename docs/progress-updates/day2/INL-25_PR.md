# INL-25: Technical Review — Deploy Backend to Railway

**Ticket:** INL-25 — Deploy backend to Railway
**Date:** 2026-02-28
**Status:** Code changes complete — awaiting Railway project setup (manual)

---

## 1. Code Changes Made

### 1.1 Configurable Template Path
- `config.py`: Added `template_path` setting with env var `TEMPLATE_PATH`
- Default: sensible local path (`repo_root/template/Tenant Welcome Pack Template.docx`)
- Docker override: `/app/template/Tenant Welcome Pack Template.docx`
- `docgen.py`: Reads `settings.template_path` instead of hardcoded `../../../../` chain

### 1.2 Comma-Separated CORS Origins
- `config.py`: Added `cors_origins` property that splits `FRONTEND_URL` on commas
- `main.py`: Uses `settings.cors_origins` list instead of single-origin array
- Allows both Vercel URL and localhost in one env var

### 1.3 Multi-Stage Dockerfile (repo root)
- Stage 1 (`builder`): Installs deps into isolated venv
- Stage 2 (`production`): Copies only venv + app code + template — no pip/build tools
- Uvicorn with `--workers 1` for Railway free tier (512MB RAM)
- `PORT` env var (Railway provides automatically)

### 1.4 .dockerignore
- Excludes: frontend/, docs/, venv/, .env, tests/, __pycache__, .git/

## 2. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/config.py` | Modified | Added template_path + cors_origins |
| `backend/app/main.py` | Modified | Uses cors_origins list |
| `backend/app/services/docgen.py` | Modified | Reads settings.template_path |
| `Dockerfile` | Created (repo root) | Multi-stage backend build |
| `.dockerignore` | Created (repo root) | Exclude unnecessary files |

## 3. Railway Setup (Manual Steps)

See commit message or INL-25 ticket for full Railway setup guide.
