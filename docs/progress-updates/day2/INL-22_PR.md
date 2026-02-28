# INL-22: Technical Review — History Page (Animated Table, Status Badges, Downloads)

**Ticket:** INL-22 — History page — animated table, status badges, downloads
**Date:** 2026-02-28
**Status:** Implemented — all acceptance criteria verified (mobile excluded), build passes

---

## 1. What This Ticket Delivers

The upload history page showing all past lease uploads in a clean, scannable table with status badges, download actions, loading skeletons, and empty state. Apple Wallet transaction history aesthetic.

---

## 2. Features

| Feature | Implementation |
|---------|---------------|
| Page header | "Upload History" + subtitle + total count (top-right) |
| Table layout | Rounded card with column headers + data rows |
| Columns | Date (+ time), Tenant / Property, Status, Actions |
| Status badges | Completed=green, Failed=red, Processing=yellow pills |
| Download button | Per completed row, triggers .docx save dialog with spinner state |
| Retry indicator | Outlined button on failed rows |
| Processing rows | Em-dash placeholder in actions column |
| Staggered entrance | Framer Motion staggerContainer/staggerItem on rows |
| Loading skeleton | 5-row skeleton matching table structure |
| Empty state | Dashed border card with icon + "Upload a Lease" CTA |
| Hover state | Subtle bg-slate-50/50 on row hover |

## 3. API Integration

Calls `GET /api/lease/history` on mount via `apiFetch` (JWT auto-attached). Displays all results in reverse chronological order (backend pre-sorted).

Download: `GET /api/welcome-pack/download/{upload_id}` — binary blob, triggers browser save dialog.

## 4. Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Animated table with staggered row entrance | Done |
| 2 | Columns: Date, Tenant/Property, Status, Actions | Done |
| 3 | Status badges (green/red/yellow) | Done |
| 4 | Download Welcome Pack per completed row | Done |
| 5 | Click row to detail (prep for INL-35) | Prep only — hover state ready |
| 6 | Empty state with link to upload | Done |
| 7 | Loading skeleton | Done |
| 8 | Calls GET /api/lease/history with auth | Done |
| 9 | Most recent first | Done (backend order) |
| 10 | Responsive mobile | Skipped (desktop-only) |

## 5. Build Verification

- TypeScript: Zero type errors
- Vite build: 1.27s
- No new dependencies

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/History.tsx` | Rewritten | Full history table with API integration |
| Paper.design | 1 artboard | History Page — Desktop mockup |
