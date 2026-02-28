# Acme Property Group — AI-Powered Lease Processor

An AI-powered web application that automates the creation of Tenant Welcome Packs from signed lease agreements. Built for Acme Property Group, a fictional property management company with 200+ rental properties across Melbourne.

**Live Demo:** [https://ai-powered-lease-processing-tenant.vercel.app](https://ai-powered-lease-processing-tenant.vercel.app)

## What It Does

1. **Upload** a signed lease agreement (PDF or DOCX)
2. **Extract** 14 key fields using AI — tenant details, property info, lease terms, contacts, and conditions
3. **Generate** a Tenant Welcome Pack (.docx) from the provided template
4. **Download** the completed Welcome Pack

Extraction accuracy: **70/70 fields correct** across all 5 sample leases. Welcome Pack verification: **39/39 checks passed**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind v4, shadcn/ui, Framer Motion |
| Backend | Python 3.13, FastAPI, Pydantic |
| Database | Supabase (Postgres + Auth + Storage + RLS) |
| AI Extraction | Gemini 2.5 Flash (google-genai SDK) |
| Text Extraction | python-docx (XML body walking), PyMuPDF (PDF) |
| Document Output | python-docx (.docx generation) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway (Docker) |

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌───────────┐
│   React     │────>│  FastAPI Backend                         │────>│ Supabase  │
│   Frontend  │<────│                                          │<────│           │
│             │     │  POST /api/lease/upload                   │     │ - Postgres│
│ - Upload    │     │    1. Store file → Supabase Storage       │     │ - Auth    │
│ - Dashboard │     │    2. Extract text (DOCX: XML / PDF: fitz)│     │ - Storage │
│ - History   │     │    3. Send to Gemini 2.5 Flash            │     │ - RLS     │
│ - Detail    │     │    4. Validate + normalize fields          │     │           │
│             │     │    5. Generate Welcome Pack .docx          │     └───────────┘
│             │     │    6. Store pack → Supabase Storage        │
│             │     │    7. Return extracted data                │     ┌───────────┐
│             │     │                                          │────>│ Gemini    │
│             │     │  GET  /api/lease/history                  │     │ 2.5 Flash │
│             │     │  GET  /api/lease/{id}                     │     └───────────┘
│             │     │  GET  /api/welcome-pack/download/{id}     │
└─────────────┘     └──────────────────────────────────────────┘
```

## Project Structure

```
├── frontend/                # React + TypeScript app
│   ├── src/
│   │   ├── components/      # AppShell, ProtectedRoute, UI components
│   │   ├── contexts/        # AuthContext (Supabase Auth)
│   │   ├── lib/             # API client, Supabase client, motion presets
│   │   └── pages/           # Login, Dashboard, Upload, History, LeaseDetail
│   └── vercel.json          # SPA routing rewrites
├── backend/
│   ├── app/
│   │   ├── middleware/      # JWT auth (ES256 + HS256 via JWKS)
│   │   ├── models/          # Pydantic models (API + lease)
│   │   ├── routers/         # Lease + Welcome Pack endpoints
│   │   └── services/        # Text extraction, Gemini, docgen, Supabase
│   ├── migrations/          # SQL schema (3 tables, RLS, storage buckets)
│   └── tests/               # Extraction + Welcome Pack benchmarks
├── template/                # 5 sample leases + Welcome Pack template
├── docs/
│   ├── PRD.md               # Product Requirements Document
│   ├── ai-log.md            # AI tool usage log (all sessions)
│   ├── final-write-up.md    # Approach, trade-offs, reflections
│   ├── chat-logs/           # Raw Claude Code session transcripts
│   └── progress-updates/    # Daily updates (day1/, day2/)
├── Dockerfile               # Backend container (python:3.13-slim)
└── spec_sheet.pdf           # Original assessment brief
```

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.13+
- Supabase account (free tier)
- Gemini API key (free tier) — [Get one here](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs on `http://localhost:8000`. Health check: `GET /api/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### Environment Variables

**Backend** (`backend/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000
```

### Database Setup

Run the SQL migration in `backend/migrations/001_initial_schema.sql` in the Supabase SQL Editor. This creates all 3 tables, indexes, RLS policies, and storage buckets.

## Deployed URLs

| Service | URL |
|---------|-----|
| Frontend | [https://ai-powered-lease-processing-tenant.vercel.app](https://ai-powered-lease-processing-tenant.vercel.app) |
| Backend | [https://ai-powered-lease-processing-tenant-welcome-pack-production.up.railway.app](https://ai-powered-lease-processing-tenant-welcome-pack-production.up.railway.app) |
| Health Check | [/api/health](https://ai-powered-lease-processing-tenant-welcome-pack-production.up.railway.app/api/health) |

## Documentation

- [Final Write-Up](docs/final-write-up.md) — Approach, architecture, trade-offs, what I'd do differently
- [Product Requirements Document](docs/PRD.md) — Full PRD with data model, API design, AI strategy
- [AI Usage Log](docs/ai-log.md) — Every AI tool interaction across both days
- [Chat Logs](docs/chat-logs/) — Raw Claude Code session transcripts
- [Progress Updates](docs/progress-updates/) — Daily updates (Day 1, Day 2)

## Built For

InLogic | AI Software Consulting — Take-home assessment for the AI Software Engineer role.

Built by Anam Milfer using Claude Code (Opus 4.6) with Linear MCP and Paper.design MCP integrations.
