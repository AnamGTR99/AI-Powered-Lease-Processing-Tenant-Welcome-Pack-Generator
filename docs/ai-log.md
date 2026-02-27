# AI Tool Usage Log

This document tracks how AI tools were used during development, including key prompts, iterations, and corrections.

---

## Day 1 — Planning & Epic 1

### [INL-5] Initialize Git repo and monorepo structure
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Read the spec_sheet.pdf, understand all requirements, propose architecture, draft a full PRD, and create Linear tickets.
**What worked:**
- Claude extracted all 14 fields and their edge cases from the spec sheet accurately
- Template analysis identified all 14 placeholder names and their exact occurrence counts
- Lease analysis across all 5 samples identified the 4 distinct document structures and key variations (joint tenancy, date formats, rent frequencies, pet/parking/special conditions)
**What I fixed:** Nothing major — guided Claude to use specific tech choices (no Figma MCP, markdown files for logging instead of Notion)
**Iterations:** 1 round for spec understanding, 1 confirmation round before architecture, 1 confirmation before PRD, then ticket creation

### [INL-6] Scaffold frontend app
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Scaffold the frontend with Vite + React + TS + Tailwind + shadcn/ui per the ticket
**What worked:**
- Vite scaffold, Tailwind v4 configuration, shadcn/ui init all completed correctly
- Route structure and placeholder pages created
- Production build passes clean
**What I fixed:**
- shadcn/ui init failed on first attempt because the root `tsconfig.json` didn't have the `@/` path alias — only `tsconfig.app.json` had it. Added `baseUrl` and `paths` to root tsconfig to resolve.
**Iterations:** 2 (one fix for tsconfig path alias)

### [INL-7] Scaffold backend app
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Scaffold FastAPI backend with directory structure from the PRD
**What worked:**
- Full directory structure, config via pydantic-settings, CORS middleware, health endpoint
- Server starts and health endpoint returns 200 on first try
**What I fixed:** Nothing — worked on first attempt
**Iterations:** 1

---

## Day 1 — Epic 2: Supabase Schema & Auth

### [INL-8] Set up Supabase schema, RLS, and storage buckets
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Generate the full SQL migration for 3 tables, RLS policies, and storage buckets
**What worked:**
- Complete SQL migration with all 3 tables, indexes, RLS policies, storage bucket creation, and updated_at trigger
- Ran successfully in Supabase SQL Editor on first attempt
**What I fixed:**
- Attempted to run SQL via Supabase REST API (`/rest/v1/rpc/exec_sql` and `/pg/query`) — both returned 404. Had to run manually in SQL Editor instead.
**Iterations:** 1 for SQL generation, 2 for execution approach

### [INL-9] Implement backend auth middleware (JWT verification)
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Create a FastAPI dependency for JWT verification supporting Supabase tokens
**What worked:**
- Initial HS256 middleware written correctly
- Discovery that Supabase project uses ES256 (not HS256) — added JWKS-based ES256 verification using `PyJWKClient`
**What I fixed:**
- ES256 vs HS256: Supabase project uses newer ES256 JWT format. Updated middleware to support both via JWKS endpoint
- `PyJWKClientError` not caught: tampered ES256 tokens caused 500 instead of 401 because `PyJWKClientError` doesn't inherit from `jwt.InvalidTokenError`. Added explicit catch for `PyJWKClientError`
**Iterations:** 3 (initial HS256 → ES256 support → PyJWKClientError fix)

### [INL-10] Implement Supabase service client (DB + Storage)
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Create a service module wrapping all DB and Storage operations for lease_uploads, extracted_data, welcome_packs
**What worked:**
- All CRUD operations (create, get, list, update) for all 3 tables
- Storage upload, download, and signed URL generation for both buckets
- All 8 integration tests passed on first run
**What I fixed:** Nothing — worked on first attempt
**Iterations:** 1

### [INL-11] Implement frontend auth (login, signup, session, protected routes)
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build Supabase Auth on the frontend: AuthProvider context, login/signup page, protected route wrapper, API client with auto-attached JWT
**What worked:**
- AuthProvider with session persistence, signIn/signUp/signOut methods
- Login page with login/signup toggle, error handling, success message
- ProtectedRoute wrapper with loading spinner
- API client that auto-attaches Bearer token
- TypeScript compiles clean, production build passes
**What I fixed:** Nothing — worked on first attempt
**Iterations:** 1

---

## Day 1 — Epic 3: AI-Powered Lease Extraction

### [INL-12] Implement unified text extraction service (DOCX + PDF)
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Create a unified text extraction service using XML body walking for DOCX and PyMuPDF for PDF
**What worked:**
- XML body walking (`qn('w:p')` + `qn('w:tbl')`) preserves interleaved paragraph/table order — much better than the original `doc.paragraphs` + `doc.tables` approach
- PyMuPDF page-by-page extraction with reading order
- All 5 DOCX leases extract correctly with key fields verified
**What I fixed:**
- First approach (INL-12 v1) used separate `doc.paragraphs` + `doc.tables` which dumped tables at the end, losing context. Refactored to XML body walking per the new approach document.
- Removed Mistral OCR dependency entirely — PyMuPDF handles PDFs locally
**Iterations:** 2 (original approach → refactored to unified pipeline)

### [INL-13] CANCELLED
**Reason:** Mistral OCR replaced by PyMuPDF in INL-12. PDF extraction is now local, no external API needed.

### [INL-14] Implement Gemini structured field extraction with validation & retry
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build the Gemini extraction service with the edge-case-aware prompt, defensive JSON parser, validation layer, and retry with correction prompt
**What worked:**
- Edge-case-aware prompt correctly handles all 5 lease variations
- Defensive JSON parser strips markdown fences
- Post-extraction validation catches date format, rent frequency, bond format issues
- 100% accuracy on all 5 leases (70/70 fields correct)
**What I fixed:**
- `google.generativeai` package is deprecated — switched to `google-genai` (new SDK)
- `gemini-2.0-flash` model not available for new API keys — switched to `gemini-2.5-flash`
- `special_conditions` returned as string `"None"` instead of JSON `null` — added normalization step to convert string "None"/"Nil" to actual null
- Date leading zeros (`"01 June 2026"`) — added normalization to strip leading zeros
**Iterations:** 3 (deprecated package → model not available → special_conditions/date normalization)
