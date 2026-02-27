# Product Requirements Document (PRD)

## Acme Property Group — AI-Powered Lease Processing & Tenant Welcome Pack Generator

**Version:** 1.0
**Date:** 2026-02-27
**Author:** Anam (with AI assistance via Claude Code)
**Source of truth:** `spec_sheet.pdf`

---

## 1. Overview

### 1.1 Problem Statement

Acme Property Group manages 200+ rental properties across Melbourne. When a new tenant signs a lease, an operations team member manually reads the agreement and types key details into a Word document called the "Tenant Welcome Pack." This takes 15–30 minutes per tenant and is prone to errors.

### 1.2 Target Outcome

A web application that automates this process end-to-end:
1. Upload a signed lease agreement (PDF or DOCX)
2. AI extracts 14 required fields from the document
3. Populate a Tenant Welcome Pack `.docx` from the provided template
4. Serve the generated document for download

### 1.3 Scope

**In scope (7-day delivery):**
- Single-lease upload and processing (one at a time)
- AI extraction of all 14 fields across 5 different lease formats
- Automated Welcome Pack .docx generation with conditional Special Conditions handling
- Supabase Auth (email/password)
- Upload history dashboard
- Supabase Postgres for data persistence + Storage for files
- Deployed at a public URL
- Meaningful Git commit history
- Daily progress updates + AI chat log export

**Out of scope:**
- Batch/multi-lease upload
- Manual edit/review of extracted fields before generation (fully automated pipeline)
- Multi-tenant organization management
- Email delivery of Welcome Packs
- PDF output (only .docx as per brief)
- Paid AI API tiers

---

## 2. User Roles & Stories

### 2.1 Role: Property Manager / Operations Staff

The sole user role. They log in, upload leases, and download generated Welcome Packs.

### 2.2 User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-01 | As a property manager, I want to sign up and log in so that my uploads and history are private to me. | - Email/password registration via Supabase Auth<br>- Login/logout flow<br>- Unauthenticated users cannot access the app |
| US-02 | As a property manager, I want to upload a signed lease (PDF or DOCX) so the system can process it. | - Drag-and-drop or click-to-upload<br>- Accepts .pdf and .docx only<br>- File size validation (max 10MB)<br>- Upload progress indicator |
| US-03 | As a property manager, I want the system to automatically extract all 14 required fields from the lease. | - All 14 fields extracted and displayed<br>- Handles joint tenancy (two tenant names)<br>- Handles varying date formats (DD/MM/YYYY and D Month YYYY) → normalized output<br>- Handles monthly and fortnightly rent → normalized to include frequency<br>- Handles pet clauses with conditions vs "Not permitted"<br>- Handles parking details vs "Not included"<br>- Correctly identifies presence/absence of special conditions |
| US-04 | As a property manager, I want a Tenant Welcome Pack .docx automatically generated and available for download. | - All 14 `{{placeholder}}` markers replaced with extracted data<br>- `{{tenant_name}}` appears in 3 locations, `{{property_address}}` in 4 — all replaced<br>- Special Conditions section (heading + content) omitted entirely when none exist<br>- Special Conditions section present with content when conditions exist<br>- Document formatting preserved (fonts, colors, tables, layout)<br>- Download as .docx file |
| US-05 | As a property manager, I want to see my upload history so I can re-download past Welcome Packs. | - List of past uploads with date, tenant name, property address<br>- Download link for each generated Welcome Pack<br>- Most recent first |

### 2.3 Edge Cases Covered by the 5 Sample Leases

| Variation | Lease(s) | How We Handle It |
|-----------|----------|-----------------|
| Joint tenancy (two names) | Marcus & Lisa Johnson | Extract both names, format as "Marcus Johnson & Lisa Johnson" |
| DD/MM/YYYY date format | Marcus & Lisa Johnson | Parse and normalize to "D Month YYYY" (e.g., "15 April 2026") |
| D Month YYYY date format | All others | Already in target format, pass through |
| Fortnightly rent | Raj Patel | Extract amount and frequency, display as "$1,150.00 per fortnight" |
| Monthly rent | All others | Display as "$X,XXX.00 per month" |
| Pet permitted with conditions | David Okafor | Extract full description including conditions |
| Pet not permitted | Sarah Chen, Emma Whitfield, Marcus & Lisa Johnson, Raj Patel | Extract as "Not permitted" or specific wording |
| Parking included with details | Raj Patel | Extract full details (space number, location, access) |
| Parking not included | All others | Extract as "Not included" |
| Special conditions present | Emma Whitfield (2), Raj Patel (2) | Include section in Welcome Pack with full text |
| Special conditions absent | David Okafor, Sarah Chen, Marcus & Lisa Johnson | Omit entire Special Conditions section (heading + body) |
| Table-based lease format | David Okafor, Sarah Chen | AI handles structured table data |
| Prose-heavy format (no tables) | Emma Whitfield | AI extracts from running text with bold values |
| Part A/B/C/D format | Raj Patel | AI handles multi-part structure |
| Summary table + clauses | Marcus & Lisa Johnson | AI handles summary table + clause body |

---

## 3. Functional Requirements

### 3.1 Authentication

| Req ID | Requirement | Details |
|--------|------------|---------|
| FR-AUTH-01 | Email/password sign-up | Via Supabase Auth |
| FR-AUTH-02 | Email/password login | Returns JWT for API calls |
| FR-AUTH-03 | Logout | Clears session |
| FR-AUTH-04 | Protected routes | All app routes require authentication; redirect to login if unauthenticated |
| FR-AUTH-05 | Row-Level Security | Users can only see their own uploads, extractions, and generated packs |

### 3.2 File Upload

| Req ID | Requirement | Details |
|--------|------------|---------|
| FR-UPLOAD-01 | Accept PDF and DOCX | Validate MIME type on both frontend and backend |
| FR-UPLOAD-02 | File size limit | Max 10MB per file |
| FR-UPLOAD-03 | Store uploaded file | Upload to Supabase Storage `leases/` bucket, path: `{user_id}/{upload_id}/{filename}` |
| FR-UPLOAD-04 | Create upload record | Insert row into `lease_uploads` table with metadata |
| FR-UPLOAD-05 | Upload feedback | Loading spinner / progress bar during upload |

### 3.3 AI-Based Extraction

| Req ID | Requirement | Details |
|--------|------------|---------|
| FR-EXTRACT-01 | Text extraction from PDF | Use PyMuPDF (`fitz`) locally to extract text page-by-page. No external API call needed |
| FR-EXTRACT-02 | Text extraction from DOCX | Use python-docx XML body walking locally — walk `doc.element.body` in document order for paragraphs and tables |
| FR-EXTRACT-03 | Structured field extraction | Send extracted text to Gemini 2.0 Flash with a strict JSON schema prompt requesting all 14 fields |
| FR-EXTRACT-04 | Pydantic validation | Validate Gemini's response against a Pydantic model with all 14 fields |
| FR-EXTRACT-05 | Retry on partial extraction | If any field is null/missing, retry extraction with a targeted follow-up prompt for just the missing fields |
| FR-EXTRACT-06 | Date normalization | Normalize all dates to "D Month YYYY" format (e.g., "15 April 2026") |
| FR-EXTRACT-07 | Rent normalization | Include amount + frequency (e.g., "$1,750.00 per month", "$1,150.00 per fortnight") |
| FR-EXTRACT-08 | Store extracted data | Insert all 14 fields into `extracted_data` table linked to the upload record |

### 3.4 Welcome Pack Generation

| Req ID | Requirement | Details |
|--------|------------|---------|
| FR-DOCGEN-01 | Load template | Read `Tenant Welcome Pack Template.docx` from a known path |
| FR-DOCGEN-02 | Replace all placeholders | Replace all 14 `{{placeholder}}` markers across paragraphs and tables. Handle multi-occurrence placeholders (`{{tenant_name}}` x3, `{{property_address}}` x4) |
| FR-DOCGEN-03 | Conditional Special Conditions | If `special_conditions` is empty/null/absent: remove both the "Special Conditions" heading paragraph (P[11]) and the placeholder paragraph (P[12]) from the document XML. If present: replace `{{special_conditions}}` with the extracted text |
| FR-DOCGEN-04 | Preserve formatting | Maintain all fonts, colors, table layouts, page breaks from the template |
| FR-DOCGEN-05 | Store generated file | Upload generated .docx to Supabase Storage `welcome-packs/` bucket |
| FR-DOCGEN-06 | Create pack record | Insert row into `welcome_packs` table with file path and metadata |
| FR-DOCGEN-07 | Return download URL | Provide signed URL or API endpoint for downloading the file |

### 3.5 History / Dashboard

| Req ID | Requirement | Details |
|--------|------------|---------|
| FR-HIST-01 | List past uploads | Show all user's lease uploads, most recent first |
| FR-HIST-02 | Show key fields | Display tenant name, property address, upload date per row |
| FR-HIST-03 | Download Welcome Pack | Each row has a download button for the generated .docx |
| FR-HIST-04 | Status indicator | Show processing status (uploading, extracting, generating, complete, failed) |

---

## 4. Non-Functional Requirements

| Req ID | Requirement | Details |
|--------|------------|---------|
| NFR-01 | Performance | Single-user flow. Extraction should complete within ~30 seconds. Acceptable for prototype |
| NFR-02 | Reliability | Graceful error handling: if AI extraction fails, show clear error message and allow re-upload. No silent failures |
| NFR-03 | Security | Supabase Auth + JWT verification. RLS on all tables. No PII logged to console in production. HTTPS on deployed URL |
| NFR-04 | Availability | Deployed app must be working and accessible when InLogic tests it |
| NFR-05 | Code quality | Clear directory structure, sensible naming, type safety (TypeScript + Pydantic), no dead code |
| NFR-06 | Logging | Python `logging` module for backend. Log extraction attempts, failures, and AI API response times. No sensitive data in logs |

---

## 5. Data Model & Supabase Schema

### 5.1 Entity Relationship

```
users (Supabase Auth - managed)
  │
  ├──< lease_uploads
  │       │
  │       ├──< extracted_data (1:1 with lease_upload)
  │       │
  │       └──< welcome_packs (1:1 with lease_upload)
```

### 5.2 Tables

#### `lease_uploads`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users(id), NOT NULL |
| file_name | text | Original filename |
| file_type | text | 'pdf' or 'docx' |
| file_path | text | Supabase Storage path |
| file_size | integer | Bytes |
| status | text | 'uploaded', 'extracting', 'extracted', 'generating', 'complete', 'failed' |
| error_message | text | Nullable, populated on failure |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

#### `extracted_data`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| lease_upload_id | uuid | FK → lease_uploads(id), UNIQUE |
| tenant_name | text | Joint tenancy: "Name1 & Name2" |
| property_address | text | Full address incl. suburb, state, postcode |
| lease_start_date | text | Normalized: "D Month YYYY" |
| lease_end_date | text | Normalized: "D Month YYYY" |
| rent_amount | text | e.g., "$1,750.00 per month" |
| bond_amount | text | e.g., "$3,500.00" |
| num_occupants | text | e.g., "2" |
| pet_permission | text | "Not permitted" or description with conditions |
| parking | text | "Not included" or details |
| special_conditions | text | Nullable. Null = omit section from Welcome Pack |
| landlord_name | text | |
| property_manager_name | text | |
| property_manager_email | text | |
| property_manager_phone | text | |
| raw_ai_response | jsonb | Full AI response for debugging/audit |
| created_at | timestamptz | Default now() |

#### `welcome_packs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| lease_upload_id | uuid | FK → lease_uploads(id), UNIQUE |
| file_path | text | Supabase Storage path |
| file_name | text | Generated filename |
| created_at | timestamptz | Default now() |

### 5.3 Storage Buckets

| Bucket | Purpose | Path Pattern |
|--------|---------|--------------|
| `leases` | Uploaded lease PDFs/DOCXs | `{user_id}/{upload_id}/{original_filename}` |
| `welcome-packs` | Generated Welcome Pack .docx files | `{user_id}/{upload_id}/Welcome_Pack_{tenant_name}.docx` |

### 5.4 Row-Level Security (RLS)

All tables enforce:
```sql
-- SELECT, INSERT, UPDATE, DELETE
auth.uid() = user_id
```
Storage buckets use path-based policies scoped to `auth.uid()`.

---

## 6. API Design (FastAPI)

### 6.1 Authentication

All endpoints except health check require a valid Supabase JWT in the `Authorization: Bearer <token>` header. The backend verifies the JWT using Supabase's JWT secret.

### 6.2 Endpoints

#### Health Check
```
GET /api/health
→ 200 { "status": "ok" }
```
No auth required.

#### Lease Upload + Process (combined endpoint)
```
POST /api/lease/upload
Auth: Required
Content-Type: multipart/form-data
Body: file (PDF or DOCX)

→ 200 {
    "upload_id": "uuid",
    "status": "complete",
    "extracted_data": {
        "tenant_name": "...",
        "property_address": "...",
        "lease_start_date": "...",
        "lease_end_date": "...",
        "rent_amount": "...",
        "bond_amount": "...",
        "num_occupants": "...",
        "pet_permission": "...",
        "parking": "...",
        "special_conditions": "..." | null,
        "landlord_name": "...",
        "property_manager_name": "...",
        "property_manager_email": "...",
        "property_manager_phone": "..."
    },
    "welcome_pack_url": "/api/welcome-pack/download/{pack_id}"
}

→ 422 { "detail": "Invalid file type. Only PDF and DOCX are accepted." }
→ 500 { "detail": "Extraction failed: ..." }
```

This is a **synchronous** endpoint that:
1. Validates + stores the file
2. Extracts text (python-docx or Mistral OCR)
3. Sends to Gemini for structured extraction
4. Validates 14 fields
5. Generates Welcome Pack .docx
6. Returns everything in one response

Rationale: Single-lease-at-a-time, takes ~10-30 seconds. Simpler than async polling for a prototype.

#### Get Upload History
```
GET /api/lease/history
Auth: Required

→ 200 {
    "uploads": [
        {
            "id": "uuid",
            "file_name": "Lease Agreement - Sarah Chen.docx",
            "status": "complete",
            "tenant_name": "Sarah Chen",
            "property_address": "...",
            "created_at": "2026-02-27T10:00:00Z",
            "welcome_pack_url": "/api/welcome-pack/download/{pack_id}"
        },
        ...
    ]
}
```

#### Get Single Upload Detail
```
GET /api/lease/{upload_id}
Auth: Required

→ 200 {
    "upload": { ... },
    "extracted_data": { ... },
    "welcome_pack": { "id": "...", "download_url": "..." }
}
→ 404 { "detail": "Upload not found" }
```

#### Download Welcome Pack
```
GET /api/welcome-pack/download/{pack_id}
Auth: Required

→ 200 (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
    Content-Disposition: attachment; filename="Welcome_Pack_Sarah_Chen.docx"
→ 404 { "detail": "Welcome pack not found" }
```

---

## 7. AI Design

### 7.1 Text Extraction Strategy (Unified Local Pipeline)

Both file types are extracted locally — no external API calls needed for text extraction.

| Input Type | Method | Details |
|------------|--------|---------|
| DOCX | python-docx XML body walking (local) | Walk `doc.element.body` children in document order using `qn('w:p')` for paragraphs and `qn('w:tbl')` for tables. This preserves interleaved paragraph/table order and captures all content. Table rows formatted as pipe-delimited cells |
| PDF | PyMuPDF / `fitz` (local) | Extract text page-by-page using `page.get_text("text")` which preserves reading order. Pages separated with `--- Page N ---` markers. No external API call — fast, no rate limits |

### 7.2 Structured Field Extraction (Gemini 2.0 Flash)

**Prompt design** (edge-case-aware, validated against all 5 sample leases):

```
You are a precise document extraction assistant specialising in Australian residential lease agreements.

Extract the following 14 fields from the lease agreement text provided. Return ONLY a valid JSON object — no markdown, no explanation, no extra text.

FIELDS TO EXTRACT:

{
  "tenant_name": "Full name(s). If joint tenancy, format as 'Marcus Johnson & Lisa Johnson'. Never truncate.",
  "property_address": "Full address including unit/apartment number, street, suburb, state and postcode. E.g. '18 River Road, Unit 7, Abbotsford VIC 3067'",
  "lease_start_date": "Standardise to DD Month YYYY format. E.g. '15 April 2026'. Input may be '15/04/2026', '1 April 2026', 'April 1, 2026' — normalise all to this format.",
  "lease_end_date": "Same format as lease_start_date.",
  "rent_amount": "Include amount, currency and frequency. E.g. '$2,650.00 per month' or '$1,150.00 per fortnight'. Never strip the frequency.",
  "bond_amount": "Dollar amount only. E.g. '$5,300.00'",
  "num_occupants": "Integer as a string. E.g. '1' or '2'",
  "pet_permission": "One of two formats: (A) If pets are not permitted: 'Not permitted'. (B) If pets are permitted: write a concise summary of the permission and ALL conditions listed, in plain English. Do not just say 'Permitted' — include the conditions.",
  "parking": "One of two formats: (A) If no parking: 'Not included'. (B) If parking is included: describe it fully including space number, level, and access method if stated.",
  "special_conditions": "CRITICAL RULE: If the lease states there are no special conditions (e.g. 'Nil', 'No special conditions apply', 'Nil. No special conditions apply.') — return null (JSON null, not the string 'null' or 'None'). Only return text here if REAL special conditions exist. If they do exist, summarise them clearly in plain English.",
  "landlord_name": "Full name as listed in the parties section.",
  "property_manager_name": "The contact person's name only. E.g. 'Julia Torres'",
  "property_manager_email": "Email address. E.g. 'julia.torres@acmepg.com.au'",
  "property_manager_phone": "Phone number as listed. E.g. '+61 3 9555 0142'"
}

CRITICAL RULES:
1. special_conditions must be JSON null if no real conditions exist. This controls whether the section appears in the output document at all.
2. For rent_amount, always include the payment frequency (per month / per fortnight). Never omit it.
3. For joint tenancies, include both full names joined with ' & '.
4. For pet_permission, if permitted, include ALL conditions listed — not just "Permitted".
5. For property_address, always include the unit/apartment/flat/studio number if present.
6. Do not invent or assume any data not present in the document.
7. Return ONLY the JSON object. No markdown fences. No explanation.

LEASE AGREEMENT TEXT:
{lease_text}
```

### 7.3 Validation & Retry Strategy

1. **Parse**: Strip markdown fences if present (defensive against model adding ```json), then `json.loads()`
2. **Key check**: Verify all 14 keys exist in the response
3. **Pydantic validation**: Validate against `ExtractedLeaseData` model
4. **Sanity checks** (post-extraction validation layer):
   - Date format: both dates should parse as `"%d %B %Y"`; end date must be after start date
   - Rent frequency: `rent_amount` must contain "per" (per month / per fortnight)
   - Bond format: `bond_amount` must start with "$"
   - Log warnings for any failed checks
5. **Retry with correction prompt** if validation fails:
   ```
   Your previous extraction had the following issues:
   {warnings}

   Here is what you returned:
   {previous_json}

   Please fix only the problematic fields and return the corrected full JSON object.
   Do not change fields that were correct.
   ```
6. Merge retry results with initial results
7. If still missing after retry, store what we have and mark status accordingly
8. **Auditability**: Store the raw extracted text in Supabase alongside the structured JSON for debugging

### 7.4 Model & Tool Justification

| Tool | Why |
|------|-----|
| **PyMuPDF (`fitz`)** | Local PDF text extraction — no API call, no rate limits, no cost. Handles multi-page PDFs with reading-order text extraction. Faster and more reliable than external OCR APIs for text-based PDFs |
| **python-docx XML walking** | Walk the raw XML body in document order to capture interleaved paragraphs and tables. More reliable than `doc.paragraphs` + `doc.tables` which misses ordering context |
| **Gemini 2.0 Flash** | Free tier (60 requests/min). Excellent at structured data extraction. Fast response times. Supports JSON mode. Single API call for all 14 fields |

---

## 8. Frontend UX / UI

### 8.1 Key Screens

#### Login / Sign Up
- Clean, centered card layout
- Email + password fields
- Toggle between login and sign up
- Supabase Auth integration
- shadcn/ui `Card`, `Input`, `Button` components

#### Dashboard / Home
- Welcome header with user info
- Quick stats: total uploads, recent activity
- "Upload New Lease" CTA button (prominent)
- Recent uploads list (last 5)

#### Upload Page
- Large drag-and-drop zone (shadcn/ui styled)
- Accepted formats badge: "PDF, DOCX"
- Upload progress indicator
- Processing stages feedback: "Uploading..." → "Extracting fields..." → "Generating Welcome Pack..." → "Complete!"
- On completion: show extracted fields summary + download button
- Framer Motion: fade-in for results, subtle slide-up for the download card

#### History Page
- Table/list of all past uploads
- Columns: Date, Tenant Name, Property Address, Status, Actions
- Download button per row
- Empty state for new users
- shadcn/ui `Table` component

### 8.2 Design Direction

Use the Claude Frontend Design plugin during implementation for:
- Component layout and spacing decisions
- Color palette that complements the Acme Property Group branding (blues: #1B4F72, #2C3E50)
- Typography hierarchy with Tailwind
- Subtle Framer Motion animations: page transitions, upload feedback, success states
- Responsive design (desktop-first but mobile-friendly)

### 8.3 Component Architecture

```
App
├── AuthProvider (Supabase session context)
├── Layout
│   ├── Header (logo, nav, logout)
│   └── Main Content
│       ├── LoginPage
│       ├── DashboardPage
│       ├── UploadPage
│       │   ├── FileDropzone
│       │   ├── ProcessingStatus
│       │   ├── ExtractedDataCard
│       │   └── DownloadCard
│       └── HistoryPage
│           └── UploadHistoryTable
```

---

## 9. Deployment & Ops

### 9.1 Hosting Plan

| Component | Service | Why |
|-----------|---------|-----|
| Frontend | **Vercel** | Free tier, automatic deploys from GitHub, optimized for React/Vite |
| Backend | **Railway** | Free tier, supports Python/Docker, provides a public URL, simple env var management |
| Database + Auth + Storage | **Supabase** | Required by brief. Free tier includes Postgres, Auth, and 1GB storage |

### 9.2 Environment Variables

**Backend (Railway):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  (service role key for server-side operations)
SUPABASE_JWT_SECRET=...      (for JWT verification)
GEMINI_API_KEY=...            (free tier)
```

**Frontend (Vercel):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  (anon/public key)
VITE_API_URL=https://backend.railway.app
```

### 9.3 Deployment Checklist

- [ ] Backend Dockerfile works and runs on Railway
- [ ] Frontend builds and deploys on Vercel
- [ ] CORS configured: frontend URL allowed on backend
- [ ] Supabase RLS policies active
- [ ] All env vars set in production
- [ ] Health check endpoint responds
- [ ] Upload + extract + generate flow works end-to-end on deployed URL
- [ ] Template .docx bundled with backend (or stored in Supabase Storage)

### 9.4 Keeping It Running

- Railway free tier: should stay running if there's periodic activity. Set a health check ping if needed
- Vercel: static deploy, always available
- Supabase free tier: pauses after 7 days of inactivity — ensure some activity before InLogic tests

---

## 10. AI Usage Logging & Submission Strategy

### 10.1 Documentation Structure

```
docs/
├── PRD.md                    # This document
├── ai-log.md                 # Summary of AI tool usage per task
└── progress-updates/
    ├── day-1.md
    ├── day-2.md
    ├── day-3.md
    └── ...
```

### 10.2 AI Log Format (`ai-log.md`)

For each major task:
```
### [Ticket ID] - Task Title
**Tool:** Claude Code / ChatGPT / etc.
**What I asked:** Brief summary of prompt
**What worked:** Key outputs that were correct
**What I fixed:** Mistakes caught and corrections made
**Iterations:** How many rounds to get it right
```

### 10.3 Daily Progress Update Template

```
Day [X] – [Date]

What I completed:
- ...

Challenges:
- ...

How I used AI:
- ...

Next steps:
- ...
```

### 10.4 Prompting Strategy for Chat Logs

To make chat logs look thoughtful when InLogic reviews them:
- Break work into clear, scoped tasks (one per prompt session)
- Reference specific requirements from the brief
- When AI produces incorrect output, explicitly call out what's wrong and why
- Show iterative refinement (e.g., "The extraction missed the phone number, let me adjust the prompt to...")
- Demonstrate understanding of the stack (don't ask AI to explain basics)

---

## Appendix A: Template Placeholder Mapping

| Placeholder | Field | Occurrences |
|-------------|-------|-------------|
| `{{tenant_name}}` | tenant_name | 3x (greeting, lease table, payment ref) |
| `{{property_address}}` | property_address | 4x (welcome, lease table, property info, payment ref) |
| `{{lease_start_date}}` | lease_start_date | 1x (lease table) |
| `{{lease_end_date}}` | lease_end_date | 1x (lease table) |
| `{{rent_amount}}` | rent_amount | 1x (lease table) |
| `{{bond_amount}}` | bond_amount | 1x (lease table) |
| `{{num_occupants}}` | num_occupants | 1x (lease table) |
| `{{pet_permission}}` | pet_permission | 1x (lease table) |
| `{{parking_included}}` | parking | 1x (lease table) |
| `{{special_conditions}}` | special_conditions | 1x (standalone paragraph) |
| `{{landlord_name}}` | landlord_name | 1x (property info section) |
| `{{property_manager_name}}` | property_manager_name | 1x (contacts table) |
| `{{property_manager_email}}` | property_manager_email | 1x (contacts table) |
| `{{property_manager_phone}}` | property_manager_phone | 1x (contacts table) |

## Appendix B: Special Conditions Removal Logic

When `special_conditions` is null:
1. Locate paragraph P[11] (heading: "Special Conditions") and P[12] (placeholder)
2. Remove both elements from the document XML:
   ```python
   for idx in [12, 11]:  # reverse order to preserve indices
       para = doc.paragraphs[idx]
       para._element.getparent().remove(para._element)
   ```
3. Verify the document still renders correctly (Property Information section should follow directly after the Lease at a Glance table)

When `special_conditions` has content:
1. Replace `{{special_conditions}}` in P[12] with the extracted text
2. Preserve the red bold formatting of the placeholder run
