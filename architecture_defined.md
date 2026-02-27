  High-Level Architecture                                                                                                                                   
                  
  ┌─────────────────────────────────────────────────────────────┐
  │                     FRONTEND (Vercel)                        │
  │          React + TypeScript + Tailwind + shadcn/ui           │
  │                    + Framer Motion                           │
  │                                                              │
  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
  │  │  Auth UI  │  │ Upload Page  │  │  History / Dashboard   │ │
  │  │(Supabase) │  │ (drag+drop)  │  │  (past extractions)   │ │
  │  └──────────┘  └──────┬───────┘  └────────────────────────┘ │
  └─────────────────────────┼───────────────────────────────────┘
                            │ REST API calls (JWT in header)
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 BACKEND (Railway / Render)                    │
  │                   Python + FastAPI                            │
  │                                                              │
  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
  │  │ Auth Middle- │  │  /api/lease  │  │ /api/welcome-pack  │  │
  │  │   ware      │  │   /upload    │  │   /generate        │  │
  │  │ (JWT verify) │  │   /extract   │  │   /download/{id}   │  │
  │  └─────────────┘  └──────┬───────┘  └────────┬───────────┘  │
  │                          │                     │              │
  │                    ┌─────▼─────┐        ┌──────▼──────┐      │
  │                    │ AI Service │        │ DocGen Svc  │      │
  │                    │ (extract)  │        │ (python-docx)│     │
  │                    └─────┬─────┘        └─────────────┘      │
  │                          │                                    │
  │          ┌───────────────┼───────────────┐                    │
  │          ▼               ▼               ▼                    │
  │   ┌────────────┐  ┌────────────┐  ┌────────────┐            │
  │   │ Mistral OCR │  │ Gemini API │  │ Fallback / │            │
  │   │ (PDF→text)  │  │ (extract   │  │ Validation │            │
  │   │             │  │  14 fields)│  │            │            │
  │   └────────────┘  └────────────┘  └────────────┘            │
  └─────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    SUPABASE (Free Tier)                       │
  │                                                              │
  │  ┌──────────────────┐  ┌──────────────────────────────────┐  │
  │  │     Postgres      │  │         Storage Buckets          │  │
  │  │                   │  │                                  │  │
  │  │ - users (auth)    │  │ - leases/ (uploaded PDFs/DOCX)   │  │
  │  │ - lease_uploads   │  │ - welcome-packs/ (generated .docx)│ │
  │  │ - extracted_data  │  │                                  │  │
  │  │ - welcome_packs   │  │                                  │  │
  │  └──────────────────┘  └──────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────┘

  AI Strategy

  ┌─────────────────────────────┬──────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────┐
  │            Task             │          Model           │                                         Rationale                                         │
  ├─────────────────────────────┼──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
  │ PDF → text extraction       │ Mistral OCR (free tier)  │ Purpose-built for document OCR, handles scanned PDFs well                                 │
  ├─────────────────────────────┼──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
  │ DOCX → text extraction      │ python-docx (local)      │ DOCX is already structured XML — no AI needed for text extraction                         │
  ├─────────────────────────────┼──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
  │ 14-field structured         │ Gemini 2.0 Flash (free   │ Best free-tier reasoning model; we send extracted text + a strict JSON schema prompt, get │
  │ extraction                  │ tier)                    │  back structured data                                                                     │
  ├─────────────────────────────┼──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
  │ Fallback/validation         │ Gemini with retry        │ If first extraction is incomplete, retry with a more targeted prompt for missing fields   │
  └─────────────────────────────┴──────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘

  Why this split: Mistral OCR excels at document-to-text. Gemini Flash excels at reasoning over text to extract structured fields. Using python-docx for
  DOCX files avoids burning API quota on documents that are already machine-readable.

  Directory Structure

  /
  ├── frontend/                    # React + TypeScript app
  │   ├── src/
  │   │   ├── components/          # Reusable UI components (shadcn/ui based)
  │   │   │   ├── ui/              # shadcn/ui primitives
  │   │   │   ├── layout/          # Header, Sidebar, PageContainer
  │   │   │   ├── lease/           # Upload, ExtractedDataView
  │   │   │   └── welcome-pack/    # DownloadButton, PackPreview
  │   │   ├── pages/               # Route-level pages
  │   │   │   ├── Login.tsx
  │   │   │   ├── Dashboard.tsx
  │   │   │   ├── Upload.tsx
  │   │   │   └── History.tsx
  │   │   ├── hooks/               # Custom React hooks
  │   │   ├── lib/                 # Supabase client, API client, utils
  │   │   ├── types/               # TypeScript interfaces
  │   │   └── App.tsx
  │   ├── public/
  │   ├── package.json
  │   ├── tailwind.config.ts
  │   ├── vite.config.ts
  │   └── tsconfig.json
  │
  ├── backend/                     # Python FastAPI app
  │   ├── app/
  │   │   ├── main.py              # FastAPI app entry, CORS, lifespan
  │   │   ├── config.py            # Settings via pydantic-settings
  │   │   ├── routers/
  │   │   │   ├── auth.py          # Auth-related endpoints
  │   │   │   ├── lease.py         # Upload + extraction endpoints
  │   │   │   └── welcome_pack.py  # Generation + download endpoints
  │   │   ├── services/
  │   │   │   ├── extraction.py    # Orchestrates AI extraction pipeline
  │   │   │   ├── ocr.py           # Mistral OCR integration
  │   │   │   ├── gemini.py        # Gemini API integration
  │   │   │   ├── docgen.py        # python-docx template population
  │   │   │   └── supabase.py      # Supabase client (DB + storage)
  │   │   ├── models/
  │   │   │   ├── schemas.py       # Pydantic models (request/response)
  │   │   │   └── database.py      # DB table models
  │   │   └── middleware/
  │   │       └── auth.py          # JWT verification middleware
  │   ├── requirements.txt
  │   └── Dockerfile
  │
  ├── template/                    # Provided materials (already here)
  │   ├── Tenant Welcome Pack Template.docx
  │   └── (5 sample leases)
  │
  ├── docs/                        # Documentation
  │   ├── PRD.md
  │   ├── ai-log.md
  │   └── progress-updates/
  │       └── day-X-template.md
  │
  ├── infra/                       # Deployment configs
  │   ├── vercel.json
  │   └── railway.toml
  │
  └── README.md

  Component Responsibilities & Data Flows

  Frontend
  - Responsibilities: Auth UI, file upload with drag-and-drop, display extraction results, download generated Welcome Pack, show upload history
  - Data flow: User authenticates → uploads file → POST to backend → polls/waits for result → displays extracted fields → auto-generates Welcome Pack →
  provides download link
  - Error handling: Toast notifications via shadcn, loading states with Framer Motion animations, graceful fallback on API errors

  Backend (FastAPI)
  - Responsibilities: JWT verification, file upload handling, orchestrating AI extraction, document generation, CRUD for lease data
  - Data flow: Receives file → stores in Supabase Storage → extracts text (python-docx for DOCX, Mistral OCR for PDF) → sends text to Gemini for structured
  extraction → validates 14 fields → stores result in Postgres → generates Welcome Pack .docx → stores in Supabase Storage → returns download URL
  - Error handling: HTTPException with clear status codes, logging via Python logging, retry logic for AI API failures
  - Keeps things simple: no background task queue — extraction runs synchronously since it's single-lease-at-a-time

  AI Integration
  - Responsibilities: Text extraction from documents, structured field extraction
  - Data flow: Raw document → text (via python-docx or Mistral OCR) → Gemini prompt with strict JSON schema → parse + validate → return 14 fields
  - Error handling: Validate returned JSON against Pydantic model, retry once if fields are missing, log extraction confidence

  Supabase (DB + Storage)
  - Responsibilities: User auth, persistent storage of all data and files
  - Schema: lease_uploads (metadata), extracted_data (14 fields), welcome_packs (generation record + file path)
  - Storage buckets: leases/ for uploaded files, welcome-packs/ for generated .docx files
  - Row-Level Security: Users can only access their own data

  Keeping It Professional in 7 Days

  - No over-engineering: single synchronous request flow, no WebSockets or task queues
  - Auth adds professionalism without complexity (Supabase handles it)
  - Frontend polish via shadcn/ui (pre-built components) + a few Framer Motion transitions (page enter, upload progress)
  - Focus time on what matters most: extraction accuracy across all 5 leases and correct document generation

  ---
  This architecture maps directly to every spec requirement:
  - PDF/DOCX upload → file handling + dual extraction path
  - 14 fields → Gemini structured extraction with Pydantic validation
  - Welcome Pack .docx → python-docx template population with conditional Special Conditions removal
  - Supabase → auth, storage, and data persistence
  - Public URL → Vercel (frontend) + Railway (backend)

  Ready to confirm this architecture so I can move to Step 3 (full PRD)? Or do you want changes to anything above?


  Key Decisions: 
  - dual extraction path for PDF and DOCX files 
  - OCR or localx depending on type of file 
  - Creates a clean markdown text easy for AI to parse relevant information
  - Markdown is then sent to Gemini for structured extraction
  - Gemini returns JSON with 14 fields
  - JSON is validated against Pydantic model
  - Validated JSON is stored in Supabase
  - Welcome Pack is generated from template
  - Welcome Pack is stored in Supabase
  - Download URL is returned to frontend
  - Frontend displays extracted fields and download link