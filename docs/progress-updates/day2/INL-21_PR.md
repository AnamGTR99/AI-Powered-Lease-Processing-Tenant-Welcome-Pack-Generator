# INL-21: Technical Review — Upload Page (Drag-Drop, Processing Flow, Results)

**Ticket:** INL-21 — Upload page — animated drag-drop, processing flow, results display
**Date:** 2026-02-28
**Status:** Implemented — all acceptance criteria verified (mobile excluded), build passes

---

## 1. What This Ticket Delivers

The core user flow: upload a lease → see animated processing stages → view 14 extracted fields → download Welcome Pack. Four distinct states with smooth Framer Motion transitions between them.

---

## 2. States & Features

### State 1: Drop Zone (idle)
- Dashed border area with upload icon
- Drag-over: border turns brand blue, icon bounces up, background tints
- Click-to-browse via hidden file input
- Client-side validation: PDF/DOCX only, max 10MB, animated error toast

### State 2: File Selected
- White card showing filename + formatted size
- "Remove" to go back, "Process Lease" to start upload

### State 3: Processing
- Centered spinner with stage message that crossfades between stages
- 4-stage pill indicator: Uploaded → Extracting → Generating → Complete
- Fake timer progression (2s, 5s) while real API runs in background
- Jumps to real result when API responds (or holds last stage if API is slow)

### State 4: Results (complete)
- Success checkmark with spring animation (scale 0→1)
- 14 fields grouped into 4 sections with staggered entrance
- "Download Welcome Pack" button: spinner → checkmark → reset
- "Upload Another" to reset full flow

### Error State
- Red X icon, error message, "Start Over" + "Retry" buttons

---

## 3. API Integration

| Endpoint | Usage |
|----------|-------|
| `POST /api/lease/upload` | Multipart form with `file` field, JWT auto-attached |
| `GET /api/welcome-pack/download/{upload_id}` | Binary blob download, triggers browser save dialog |

---

## 4. Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Animated drag-and-drop zone with hover glow | Done |
| 2 | Click-to-browse fallback | Done |
| 3 | Client-side validation (.pdf/.docx, 10MB) with error toast | Done |
| 4 | File selected state with name + size + remove | Done |
| 5 | Calls POST /api/lease/upload with auth | Done |
| 6 | Multi-stage processing feedback with crossfade | Done |
| 7 | Results: 14 fields in grouped card grid with stagger | Done |
| 8 | Download Welcome Pack with checkmark animation | Done |
| 9 | "Upload Another" reset | Done |
| 10 | Error state with retry | Done |
| 11 | Responsive mobile | Skipped (desktop-only) |

---

## 5. Build Verification

- TypeScript: Zero type errors
- Vite build: Successful in 1.26s
- No new dependencies

---

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Upload.tsx` | Rewritten | Full upload flow with 4 states + error handling |
| Paper.design | 3 artboards | Drop Zone, Processing, Results mockups |
