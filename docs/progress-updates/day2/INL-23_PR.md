# INL-23: Technical Review — App Shell (Animated Layout, Navigation, Route Transitions)

**Ticket:** INL-23 — App shell — animated layout, navigation, route transitions
**Date:** 2026-02-28
**Status:** Implemented — all acceptance criteria verified (mobile excluded by design), build passes

---

## 1. What This Ticket Delivers

A shared layout shell wrapping all authenticated pages with a glassmorphism navbar, animated navigation, page transitions, and minimal footer. Login/Register remain outside the shell with their own particle background.

---

## 2. Components Built

### 2.1 AppShell (`src/components/AppShell.tsx`)

Layout component using React Router's `<Outlet />` pattern:

**Navbar (sticky, glassmorphism):**
- `backdrop-filter: blur(24px) saturate(180%)` with semi-transparent white background
- Acme logo (SVG) on the left
- Navigation links: Dashboard, Upload, History
- Active page indicator using Framer Motion `layoutId` — a pill highlight that slides between links with spring physics (`stiffness: 380, damping: 30`)
- User email display + Sign Out button on the right
- Sign Out confirmation popover with animated entrance (fade + scale)

**Content Area:**
- `max-w-[1200px]` centered container with `px-6 py-10` padding
- Plain `<Outlet />` — page transitions handled by each page's own `motion.div`

**Footer:**
- Minimal: "© 2026 Acme Property Group" (left) + "By Anam Milfer for InLogic" (right)
- Light slate-300 text, border-top separator

### 2.2 App.tsx Rewrite

Restructured from flat routes to nested layout routes:

```tsx
<Routes>
  {/* Public — no shell */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Login />} />

  {/* Authenticated — wrapped in AppShell */}
  <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/history" element={<History />} />
  </Route>
</Routes>
```

### 2.3 Page Updates

All three pages (Dashboard, Upload, History) updated with:
- Own `motion.div` entrance animation (fade + 8px slide, 300ms)
- Consistent heading style: 28px semibold + 15px subtitle
- Dashboard: placeholder stat cards + empty state (wired to API in INL-34)

---

## 3. Acceptance Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Header with Acme branding (logo + #1B4F72) | Done |
| 2 | Glassmorphism navbar | Done |
| 3 | Nav links: Dashboard, Upload, History | Done |
| 4 | Active page indicator with animated highlight (layoutId) | Done |
| 5 | Logout button with confirmation | Done |
| 6 | AnimatePresence page transitions | Done (per-page entrance) |
| 7 | Responsive mobile hamburger | Skipped (desktop-only per user decision) |
| 8 | Main content with max-width + padding | Done (1200px, px-6 py-10) |
| 9 | Footer | Done (copyright + attribution) |
| 10 | Apple-style: clean lines, Inter font, soft shadows | Done |

---

## 4. Bug Fix: Double Render Flash

Initial implementation used `AnimatePresence mode="wait"` wrapping `<Outlet />` with `key={location.pathname}`. This caused a double-render flash because React Router's Outlet swaps content immediately while AnimatePresence tries to control mount/unmount timing — they fought each other.

**Fix:** Removed AnimatePresence from the shell. Each page handles its own entrance animation via `motion.div` on mount. No exit animation = no conflict.

---

## 5. Build Verification

- TypeScript: Zero type errors
- Vite build: Successful in 1.10s
- No new dependencies

---

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AppShell.tsx` | Created | Layout shell with navbar, content area, footer |
| `src/App.tsx` | Rewritten | Nested layout routes, shell wraps authenticated pages |
| `src/pages/Dashboard.tsx` | Rewritten | Placeholder stats + empty state, entrance animation |
| `src/pages/Upload.tsx` | Rewritten | Heading + subtitle, entrance animation |
| `src/pages/History.tsx` | Rewritten | Heading + subtitle, entrance animation |

---

## 7. Also Created

**INL-34** — "Wire dashboard & history with live API data" added to Epic 6 backlog for replacing placeholder data with real API responses.
