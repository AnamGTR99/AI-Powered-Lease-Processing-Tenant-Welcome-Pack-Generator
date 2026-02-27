# Acme Property Group — AI-Powered Lease Processor

An AI-powered web application that automates the creation of Tenant Welcome Packs from signed lease agreements for Acme Property Group, a fictional property management company with 200+ rentals across Melbourne.

## What It Does

1. **Upload** a signed lease agreement (PDF or DOCX)
2. **Extract** 14 key fields using AI (tenant details, property info, lease terms, conditions)
3. **Generate** a Tenant Welcome Pack (.docx) from the provided template
4. **Download** the completed Welcome Pack

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Python, FastAPI |
| Database | Supabase (Postgres + Auth + Storage) |
| AI | Gemini 2.0 Flash (field extraction), Mistral OCR (PDF processing) |
| Hosting | Vercel (frontend), Railway (backend) |

## Project Structure

```
├── frontend/          # React + TypeScript app
├── backend/           # FastAPI Python app
├── template/          # Sample leases + Welcome Pack template
├── docs/              # PRD, AI log, progress updates
└── infra/             # Deployment configs
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (free tier)
- Gemini API key (free tier)
- Mistral API key (free tier)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

See `docs/PRD.md` Section 9.2 for the full list of required environment variables.

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [AI Usage Log](docs/ai-log.md)
- [Progress Updates](docs/progress-updates/)

## Built For

InLogic | AI Software Consulting — Take-home assessment for the AI Software Engineer role.
