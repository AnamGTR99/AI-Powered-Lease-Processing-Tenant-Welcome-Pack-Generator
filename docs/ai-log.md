# AI Tool Usage Log

This document tracks how AI tools were used during development, including key prompts, iterations, and corrections.

---

## Planning Session — Claude Code

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
