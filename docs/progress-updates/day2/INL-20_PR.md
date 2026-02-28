# INL-20: Technical Review — Dashboard (Glass Cards, Stats, Recent Uploads)

**Ticket:** INL-20 — Dashboard — glass cards, stats, recent uploads, upload CTA
**Date:** 2026-02-28
**Status:** Implemented — all acceptance criteria verified, build passes

---

## 1. What This Ticket Delivers

The main dashboard with live API data: glassmorphism stat cards, recent uploads list with status badges, upload CTA, loading skeletons, and empty state.

---

## 2. Features

| Feature | Implementation |
|---------|---------------|
| Welcome header | "Dashboard" + personalized greeting from user email |
| Upload CTA | Prominent brand blue button, top right, links to /upload |
| Stat cards (3) | Total Uploads, Processed, Welcome Packs — glass style, staggered entrance |
| Loading skeletons | Pulse animation while API fetches |
| Recent Activity | Last 5 uploads with tenant name, property, status badge, relative time |
| "View All" | Links to /history when >5 uploads |
| Empty state | Dashed border card with icon, message, upload CTA |
| Error state | Red banner if API call fails |

## 3. API Integration

Calls `GET /api/lease/history` on mount via `apiFetch` (JWT auto-attached). Derives stat counts from the response array client-side.

## 4. Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Welcome header with greeting | Done |
| 2 | Glassmorphism stat cards with staggered entrance | Done |
| 3 | Prominent "Upload New Lease" CTA | Done |
| 4 | Recent uploads list (last 5) from API | Done |
| 5 | "View All" link to History | Done |
| 6 | Empty state for new users | Done |
| 7 | Responsive | Skipped (desktop-only) |
| 8 | Calls backend API with auth headers | Done |

## 5. Build Verification

- TypeScript: Zero type errors
- Vite build: 1.29s
- No new dependencies

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Dashboard.tsx` | Rewritten | Full dashboard with API integration |

## 7. Also Created

- **INL-35** — Lease detail page at `/history/:uploadId` (Epic 6 backlog)
- Updated **INL-34** description to note dashboard wiring absorbed into INL-20
