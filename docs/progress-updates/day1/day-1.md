Day 1 – 2026-02-27

What I completed:
- Read and deeply understood the full spec sheet (all 14 fields, 5 lease variations, evaluation criteria)
- Analysed all 5 sample leases — identified 4 distinct document structures, joint tenancy cases, date format differences, rent frequency variations, pet/parking/special condition edge cases
- Analysed the Welcome Pack template — mapped all 14 placeholder names, their occurrence counts, and the Special Conditions removal logic
- Proposed and confirmed high-level architecture: React/TS frontend + FastAPI backend + Supabase + Gemini 2.5 Flash
- Drafted a comprehensive implementation-ready PRD covering: user stories, functional requirements, data model, API design, AI strategy, frontend UX, deployment plan
- Created 25 Linear tickets across 6 epics with acceptance criteria, implementation notes, and dependency chains
- Completed Epic 1 (Project Setup): INL-5 (repo + monorepo), INL-6 (frontend scaffold), INL-7 (backend scaffold)
- Completed Epic 2 (Supabase Schema & Auth): INL-8 (DB schema + RLS + storage), INL-9 (JWT auth middleware), INL-10 (Supabase service client), INL-11 (frontend auth)
- Completed Epic 3 partially (AI Extraction): INL-12 (unified text extraction), INL-14 (Gemini field extraction — 100% accuracy on all 5 leases)
- Refactored Epic 3 mid-implementation: replaced dual extraction approach (python-docx + Mistral OCR) with unified pipeline (XML body walking + PyMuPDF), updated PRD and Linear tickets accordingly

Challenges:
- shadcn/ui init required path alias in root tsconfig.json — caught via error output and fixed
- Supabase JWT uses ES256 (not HS256) — required JWKS-based verification via PyJWKClient
- PyJWKClientError not caught by jwt.InvalidTokenError — tampered tokens caused 500 instead of 401, fixed with explicit exception handling
- google.generativeai package deprecated + gemini-2.0-flash not available for new keys — switched to google-genai SDK + gemini-2.5-flash
- Gemini returned special_conditions as string "None" instead of JSON null — added post-parse normalization

How I used AI:
- Claude Code (Opus 4.6) for the entire session: planning, architecture, PRD, ticket creation, and all implementation
- Key workflow: read spec → understand → plan → implement ticket-by-ticket with explicit approval gates between each
- Claude handled scaffolding, auth middleware, Supabase service client, frontend auth, text extraction, and AI extraction service
- I caught and directed the Epic 3 refactor based on a reviewed approach document (epic_3_new_approach.md) — Claude adapted the implementation and updated PRD/Linear accordingly
- Verified every ticket with manual testing before approving commits

Day 1 summary: 9 tickets completed + 1 cancelled across 3 epics. Full backend + frontend scaffolds, Supabase schema with RLS, auth on both ends, unified text extraction, and AI field extraction with 100% accuracy on all 5 sample leases.

Next steps (Day 2):
- INL-15: Build lease upload + extraction endpoint (POST /api/lease/upload) — orchestrates the full pipeline
- INL-16: Test extraction accuracy against all 5 sample leases (formal testing)
- INL-17: Implement Welcome Pack .docx generation service
- INL-18: Build Welcome Pack download endpoint
- INL-19: Test Welcome Pack output for all 5 leases
- Begin Epic 5: Frontend UX (dashboard, upload page, history page)
