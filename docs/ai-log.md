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

---

## Day 2 — Epic 3 (Continued): Pipeline & Benchmarking

### [INL-15] Build lease upload + extraction endpoint
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build the POST /api/lease/upload endpoint that orchestrates the full pipeline: file storage → text extraction → Gemini → DB save
**What worked:**
- Full pipeline orchestration in a single endpoint with proper error handling at each stage
- Multipart file upload with validation (PDF/DOCX, size limit)
- Status tracking (processing → complete/failed) with error messages persisted
**What I fixed:** Nothing — worked on first attempt
**Iterations:** 1

### [INL-16] Test extraction accuracy against all 5 sample leases
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Run a formal extraction benchmark against all 5 sample leases, verify every field
**What worked:**
- Automated benchmark script testing all 70 fields (14 fields × 5 leases)
- Initial result: 69/70 correct — one special conditions field paraphrased by Gemini
**What I fixed:** Identified the paraphrasing issue → fed into INL-30 prompt refinement
**Iterations:** 1

### [INL-30] Refine Gemini extraction prompt
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Fix the special conditions paraphrasing — Gemini was rewording "No pets unless written consent" instead of copying verbatim
**What worked:**
- Added explicit "copy verbatim, do not paraphrase or summarize" instruction to the prompt
- Re-ran benchmark: 70/70 perfect score
**What I fixed:** Prompt wording — added verbatim extraction directive
**Iterations:** 2 (identify issue → fix prompt → verify)

---

## Day 2 — Epic 4: Welcome Pack Generation

### [INL-17] Implement Welcome Pack .docx generation service
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build the docgen service that loads the template, replaces all 14 placeholders, handles run-splitting, and removes Special Conditions section when null
**What worked:**
- Run-splitting-safe replacement: handles placeholders split across multiple XML runs
- Special Conditions section removal by paragraph index
- All 5 leases generate correct Welcome Packs
**What I fixed:** Nothing — worked on first attempt after careful template analysis
**Iterations:** 1

### [INL-18] Build download, history, and detail endpoints
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build GET /api/welcome-pack/download/{upload_id}, GET /api/lease/history, GET /api/lease/{upload_id}
**What worked:**
- Download endpoint returns .docx binary with correct Content-Disposition header
- History returns user's uploads ordered by created_at DESC
- Detail returns full extracted data + welcome pack URL
**What I fixed:** Nothing — all endpoints worked on first attempt
**Iterations:** 1

### [INL-19] Test Welcome Pack output for all 5 leases
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Run a comprehensive benchmark — upload all 5 leases, generate Welcome Packs, verify all fields populated correctly
**What worked:**
- Automated benchmark: 39/39 checks passed (33 field checks + 6 structural checks)
- All rent amounts correctly normalized to monthly
- Special Conditions section correctly removed for "Nil" leases
**What I fixed:** Nothing — all passed
**Iterations:** 1

### [INL-31] Normalize rent amount to consistent monthly format
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Fix rent normalization — fortnightly and weekly amounts need conversion to monthly in the Welcome Pack
**What worked:**
- Fortnightly × 2.17262, weekly × 4.35 conversion factors
- Strips "AUD" and "calendar" prefixes Gemini sometimes adds
- Regex-based parsing of "$X,XXX.XX per frequency" format
**What I fixed:** Initial conversion factor for fortnightly was ×2.167 (26/12) — corrected to ×2.17262 (365.25/14/12 × 14/12... standard calendar factor)
**Iterations:** 2 (initial factor → corrected factor)

---

## Day 2 — Epic 5: Frontend UX & Polish

### [INL-32] Frontend scaffold + Paper.design + design system
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Set up design tokens, motion presets, brand assets, and register Paper.design MCP
**What worked:**
- Shared motion presets (smoothEase, staggerContainer, staggerItem, scaleOnHover, spring)
- Brand color palette, Inter font setup
- Paper.design MCP connected for design-first workflow
**What I fixed:** Nothing — setup was straightforward
**Iterations:** 1

### [INL-33] Auth pages — Login & Register
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Build Apple-style auth pages with particle background and animated transitions
**What worked:**
- 80-particle rAF system with cursor attraction (cubic easing, HSL color cycling)
- 10-segment spring-physics cursor trail (tangent-aligned, breathing sine-wave)
- iOS 26-inspired liquid glass card (cursor-reactive specular highlight, 3D tilt)
- Login/Register with AnimatePresence crossfade
**What I fixed:**
- Particle follow wasn't obvious enough — increased attract radius (0.4→0.6), pull multiplier (800→1200)
- User requested removing circle particles, keeping only dashes
**Iterations:** 4 (base particles → stronger follow → cursor trail → liquid glass)

### [INL-23] App shell — animated layout, navigation, route transitions
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Build the shared layout shell with glassmorphism navbar, animated nav indicator, page transitions
**What worked:**
- Glassmorphism navbar with backdrop-filter: blur(24px) saturate(180%)
- Framer Motion layoutId for animated nav pill indicator
- Sign out confirmation popover with animated entrance
- Nested layout routes with Outlet pattern
**What I fixed:**
- **AnimatePresence + Outlet double render flash:** AnimatePresence mode="wait" conflicted with React Router's Outlet. Pages rendered twice on navigation. Fixed by removing AnimatePresence from the shell — each page handles its own entrance animation.
- Added footer with "By Anam Milfer for InLogic" attribution
**Iterations:** 3 (initial build → AnimatePresence flash fix attempt → final fix)

### [INL-21] Upload page — drag-drop, processing flow, results
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Build the core upload flow: drop zone → file selected → processing stages → 14-field results
**What worked:**
- Drag-over effects (border color, icon bounce, background tint)
- Fake stage progression (2s, 5s timers) while real API runs in background
- 14 fields in 4 grouped sections with staggered entrance
- Download Welcome Pack with spinner → checkmark states
- Client-side validation (PDF/DOCX, 10MB max)
**What I fixed:** Nothing — worked cleanly after Paper.design iteration
**Iterations:** 1 (designed 3 artboards in Paper.design, then single implementation pass)

### [INL-20] Dashboard — glass cards, stats, recent uploads
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Build the dashboard with live API data: stat cards, recent uploads, empty state
**What worked:**
- 3 glassmorphism stat cards (Total Uploads, Processed, Welcome Packs)
- Recent Activity: last 5 uploads with tenant name, property, status badge, relative time
- Loading skeletons, empty state, error state all implemented
- Wired directly to GET /api/lease/history (originally planned for separate ticket)
**What I fixed:** Nothing — worked on first attempt
**Iterations:** 1

### [INL-22] History page — animated table, status badges, downloads
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Build the history table: column headers, data rows with status badges, download/retry actions
**What worked:**
- Clean table with fixed-width column lanes (Date, Tenant/Property, Status, Actions)
- Status badges: Completed (green), Failed (red), Processing (yellow)
- Download button per completed row with spinner state
- Row click navigates to detail page
**What I fixed:** Nothing — clean implementation after Paper.design mockup
**Iterations:** 1

---

## Day 2 — Epic 6: Deployment & Testing

### [INL-35] Lease detail page
**Tool:** Claude Code (Opus 4.6) + Paper.design MCP
**What I asked:** Build /history/:uploadId showing full extracted data for any past upload
**What worked:**
- 14 fields in 4 grouped sections matching Upload results layout
- Back link, status badge, download button, loading skeleton, error state
- Wired History and Dashboard rows to navigate here on click
**What I fixed:**
- Rent amount card had accent styling (blue border, bold) that stood out — user requested matching all other fields. Removed accent logic.
**Iterations:** 2 (initial build → remove accent styling)

### [INL-25] Deploy backend to Railway
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Create Dockerfile, make template path configurable, add multi-origin CORS support
**What worked:**
- TEMPLATE_PATH env var with sensible local default via pydantic-settings
- Comma-separated FRONTEND_URL for multi-environment CORS
- Final Dockerfile: single-stage, global pip install, slim base image
**What I fixed:**
- Dockerfile COPY with spaces in filename — backslash escaping failed. Fixed with JSON array form: `COPY ["src", "dest"]`
- Multi-stage venv shebang mismatch — scripts had hardcoded `#!/build/venv/bin/python`. Dropped venv entirely, installed globally.
- uvicorn "not found" — ENV PATH wasn't inherited by `sh -c`. Used absolute path, then simplified to global install.
**Iterations:** 4 (multi-stage venv → space fix → shebang fix → drop venv)

### [INL-26] Deploy frontend to Vercel
**Tool:** Claude Code (Opus 4.6)
**What I asked:** Guide deployment steps, fix any issues
**What worked:**
- Vercel auto-detected Vite framework from frontend/ root directory
- Environment variables set correctly
**What I fixed:**
- 404 on page refresh — Vercel needs SPA rewrites. Added vercel.json with `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`
**Iterations:** 2 (deploy → SPA routing fix)

### [INL-27] End-to-end smoke test
**Tool:** Manual testing by user on deployed app
**What was tested:** Full flow — register, login, upload lease, verify 14 fields, download Welcome Pack, history page, detail page, dashboard stats
**Result:** All tests passed
**What I fixed:**
- Navbar logo wasn't clickable — wrapped in Link to /dashboard
- Supabase email confirmation was enabled — guided user to disable it in Supabase dashboard
**Iterations:** 1

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total tickets completed | 27 (+ 2 cancelled) |
| Total AI sessions | 4 |
| Total messages | ~4,706 |
| AI tool | Claude Code (Opus 4.6) |
| MCP integrations | Linear (project mgmt), Paper.design (UI design) |
| Days | 2 |

## Raw Chat Logs

Full conversation transcripts are in `docs/chat-logs/` as JSONL files. See `docs/chat-logs/README.md` for the session index.
