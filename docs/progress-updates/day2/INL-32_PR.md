# INL-32: Technical Review — Frontend Scaffold + Paper.design + Design System Setup

**Ticket:** INL-32 — Frontend scaffold + Paper.design + design system setup
**Date:** 2026-02-28
**Status:** Implemented — all 16 acceptance criteria verified, build passes

---

## 1. Starting Point

A basic frontend scaffold already existed from an earlier session (Epic 2). This ticket enhances it with the design system, animation infrastructure, brand assets, and Paper.design integration needed for the Apple-style aesthetic across all Epic 5 tickets.

### Already in place (no changes needed)
- Vite 7.3.1 + React 19 + TypeScript 5.9 (strict mode)
- Tailwind CSS 4.2.1 + shadcn/ui (new-york style, lucide icons)
- Framer Motion 12.34.3 (installed but not wired up)
- Supabase JS client with `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL)
- React Router v7 with routes for /login, /dashboard, /upload, /history
- AuthContext (signIn, signUp, signOut, session state) + ProtectedRoute wrapper
- API client (`lib/api.ts`) with auto-attached JWT Bearer token
- shadcn/ui components: button, card, input, label, table
- Skeleton pages: Login (functional), Dashboard/Upload/History (minimal)

---

## 2. What This Ticket Added

### 2.1 Paper.design MCP Connection

```bash
claude mcp add paper --transport http http://127.0.0.1:29979/mcp --scope user
```

Added to `~/.claude.json` at user scope. Provides read/write access to Paper.design files for design-assisted development in later tickets. Requires the Paper Desktop app to be running (local server on port 29979).

### 2.2 Design System Tokens — Brand Colors

Replaced the default shadcn neutral (grayscale) palette with a brand-aware color system in `index.css`:

| Token | Before (default) | After (brand) | Purpose |
|-------|------------------|---------------|---------|
| `--primary` | `oklch(0.205 0 0)` (black) | `oklch(0.35 0.08 240)` | `#1B4F72` brand blue |
| `--accent` | `oklch(0.97 0 0)` (near-white) | `oklch(0.55 0.12 240)` | `#2E86C1` accent blue |
| `--background` | `oklch(1 0 0)` (pure white) | `oklch(0.985 0.002 240)` | Warm off-white with blue tint |
| `--ring` | `oklch(0.708 0 0)` (gray) | `oklch(0.45 0.1 240)` | Focus ring in brand blue |
| `--border` | `oklch(0.922 0 0)` (gray) | `oklch(0.915 0.005 240)` | Subtle blue-tinted borders |

All secondary, muted, sidebar, and chart tokens were also shifted to the 240° hue (blue) family so the entire UI feels cohesive rather than generic gray.

### 2.3 Inter Font

Added Google Fonts preconnect + import to `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

Set as primary font in `index.css` body rule with full antialiasing:

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Inter is the closest free alternative to Apple's SF Pro and carries the same clean, geometric feel.

### 2.4 Glassmorphism Utilities

Two custom Tailwind utility classes added in `index.css`:

```css
.glass {
  @apply backdrop-blur-xl border shadow-lg;
  background: oklch(1 0 0 / 70%);
  border-color: oklch(1 0 0 / 30%);
}
.glass-subtle {
  @apply backdrop-blur-md border shadow-sm;
  background: oklch(1 0 0 / 50%);
  border-color: oklch(1 0 0 / 20%);
}
```

These will be used for the navbar (INL-23), stat cards (INL-20), and form cards (INL-33). Liquid glass effects planned for later tickets.

### 2.5 Framer Motion Shared Variants (`lib/motion.ts`)

New file with reusable animation presets so every page uses consistent timing:

| Preset | Usage |
|--------|-------|
| `pageTransition` / `pageTransitionProps` | Route change animation (fade + slide) — used in App.tsx |
| `fadeIn` / `fadeInUp` | Generic entrance animations for components |
| `staggerContainer` / `staggerItem` | Staggered list/card grid animations (0.08s between items) |
| `scaleOnHover` / `scaleOnHoverSubtle` | Button and card hover effects |
| `smoothEase` | Apple-style cubic-bezier `[0.25, 0.1, 0.25, 1]` — shared timing |
| `spring` | Spring physics for interactive elements (stiffness: 260, damping: 25) |

### 2.6 AnimatePresence Route Transitions (`App.tsx`)

Refactored App.tsx to wrap routes in `AnimatePresence`:

```tsx
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransitionProps} className="min-h-screen">
        <Routes location={location}>
          {/* routes */}
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
```

`mode="wait"` ensures the exiting page finishes its exit animation before the entering page starts. The `key={location.pathname}` triggers re-animation on route change.

### 2.7 Logo & Favicon

Created two SVG brand assets in `public/`:

**`logo.svg`** — Full logomark + wordmark:
- Abstract geometric building/roofline icon (two pillars + apex + crossbar)
- Brand blue `#1B4F72` for structure, accent `#2E86C1` for crossbar and center dot
- "ACME" in bold 18px + "PROPERTY GROUP" in light 11px with letter-spacing

**`favicon.svg`** — Compact icon on brand blue background:
- Same building motif as logo, white on `#1B4F72` rounded square
- Accent blue crossbar for visual pop at small sizes

Updated `index.html`:
- Favicon from `/vite.svg` → `/favicon.svg`
- Title from "frontend" → "Acme Property Group"

### 2.8 Directory Structure

Created `src/hooks/` and `src/assets/` for later tickets.

---

## 3. Build Verification

- TypeScript: Zero type errors (`tsc -b --noEmit` clean)
- Vite build: Successful in 1.27s
- Output: 27.35 KB CSS + 563 KB JS (gzipped: 5.5 KB + 172 KB)
- Node version warning (20.17 vs required 20.19+) — cosmetic, build succeeds

---

## 4. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `public/logo.svg` | Created | Full brand logo (icon + wordmark) |
| `public/favicon.svg` | Created | Compact favicon on brand blue background |
| `src/lib/motion.ts` | Created | Shared Framer Motion animation presets |
| `index.html` | Modified | Favicon, Inter font import, page title |
| `src/index.css` | Modified | Brand color tokens, Inter font, glassmorphism utilities |
| `src/App.tsx` | Modified | AnimatePresence route transitions |
| `src/hooks/` | Created | Empty directory for custom hooks |
| `src/assets/` | Created | Empty directory for brand assets |
| `~/.claude.json` | Modified | Paper.design MCP server registered (user scope) |

---

## 5. Foundation for Later Tickets

| Ticket | What it inherits from INL-32 |
|--------|------------------------------|
| INL-33 (Auth pages) | Brand tokens, Inter font, glass utilities, fadeInUp animation |
| INL-23 (App shell) | Logo, glass navbar, pageTransition, AnimatePresence |
| INL-21 (Upload page) | staggerContainer/staggerItem, scaleOnHover, smoothEase |
| INL-20 (Dashboard) | Glass cards, stagger presets, brand colors |
| INL-22 (History page) | staggerItem for rows, status badge colors from chart tokens |
