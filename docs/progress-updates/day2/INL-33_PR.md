# INL-33: Technical Review — Auth Pages (Login & Register) with Apple-Style Design

**Ticket:** INL-33 — Auth pages — Login & Register with Apple-style design
**Date:** 2026-02-28
**Status:** Implemented — all 13 acceptance criteria verified, build passes

---

## 1. What This Ticket Delivers

A polished, animated authentication experience at `/login` and `/register` featuring:
- Interactive particle background inspired by Google Antigravity
- Spring-physics cursor trail with breathing line segments
- Glass-morphism card with Framer Motion transitions throughout
- Full Supabase auth integration (signIn + signUp)

---

## 2. Components Built

### 2.1 AuroraBackground (`src/components/AuroraBackground.tsx`)

Three-layer animated background system, all running in a single `requestAnimationFrame` loop:

**Layer 1 — Particle Field (80 particles)**
- 75% dashes / 25% dots scattered across the viewport
- **Cursor attraction**: particles within 60% viewport radius get pulled toward cursor with cubic easing — stronger when closer, zero beyond radius
- **Spring cursor**: cursor position is lerped (factor 0.07) for organic, breathing movement
- **Smooth color cycling**: each particle has its own HSL hue that drifts over time (8-33 deg/sec), weighted toward blues/purples with rare amber/red pops
- **Autonomous drift**: sine-wave float patterns (30-90px amplitude) so the field is alive even without mouse input
- **Opacity boost**: particles glow brighter near cursor (base 0.20-0.45 → up to 0.75)

**Layer 2 — Cursor Trail (10 segments)**
- Spring-physics chain (stiffness: 150, damping: 20) where each segment follows the one ahead
- Tangent-aligned rotation via `atan2` — segments curve naturally with mouse path
- Segments stretch longer at high velocity, collapse tight when still
- Breathing effect: sine wave with per-segment phase offset modulates width (2-5.5px) and opacity
- Color gradient: head is blue, shifts toward purple down the chain, all cycling over time

**Layer 3 — Radial Glow**
- Framer Motion `useSpring`-smoothed gradient that follows cursor
- Hue cycles 210→260→195→230→210 over 16s for breathing color shifts
- 700px radius, max 15% opacity — subtle ambient light

### 2.2 Login Page (`src/pages/Login.tsx`)

Complete Apple-style auth page:

| Feature | Implementation |
|---------|---------------|
| Card | `.glass` utility (70% white, backdrop-blur-xl, soft shadow) |
| Logo | Brand SVG centered above form |
| Header swap | `AnimatePresence mode="wait"` crossfade between "Welcome back" / "Create your account" |
| Form swap | Animated crossfade between login (2 fields) and signup (3 fields) |
| Confirm password | `AnimatePresence` height animation (0 → auto) for seamless expand/collapse |
| Error messages | Animated slide-in red banner |
| Loading state | Spinner replaces button text, button disabled |
| Submit button | `scaleOnHover` Framer Motion interaction |
| Mode toggle | "Don't have an account? Sign Up" / "Already have an account? Sign In" |
| Success state | Green banner after signup with "Back to Sign In" button |

### 2.3 Route Updates (`src/App.tsx`)

- Added `/register` route pointing to same `<Login />` component
- Login.tsx reads `location.pathname` to start in sign-up mode when URL is `/register`

---

## 3. Acceptance Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Login page at `/login` with email + password form | Done |
| 2 | Register page at `/register` with email + password + confirm password | Done |
| 3 | Toggle between login/register with animated crossfade | Done |
| 4 | Centered card layout on subtle gradient background | Done (AuroraBackground + particles) |
| 5 | Animated form entrance (fade + slide up on mount) | Done (`fadeInUp` variant) |
| 6 | Supabase `signInWithPassword` integration for login | Done (via `useAuth().signIn`) |
| 7 | Supabase `signUp` integration for register | Done (via `useAuth().signUp`) |
| 8 | Form validation with inline animated error messages | Done |
| 9 | Loading state on submit button (spinner + disabled) | Done |
| 10 | Redirect to dashboard on successful auth | Done (`<Navigate to="/dashboard">`) |
| 11 | Redirect to login if accessing protected route while logged out | Done (`ProtectedRoute`) |
| 12 | Apple-style: minimal chrome, generous whitespace, soft shadows, Inter font | Done |
| 13 | Responsive — works on mobile | Done (`max-w-[420px] w-full px-4`) |

---

## 4. Performance Notes

- All 80 particles + 10 trail segments updated in a single rAF loop — no React re-renders during animation
- Direct DOM style manipulation (`el.style.transform`) avoids reconciliation overhead
- `willChange: 'transform, opacity'` hints for GPU compositing
- HSL→hex conversion is pure math (no string parsing) — runs 90 times per frame with negligible cost

---

## 5. Build Verification

- TypeScript: Zero type errors (`tsc -b --noEmit` clean)
- Vite build: Successful in 1.35s
- No new dependencies added — uses existing Framer Motion + React stack

---

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AuroraBackground.tsx` | Created | Particle field + cursor trail + radial glow |
| `src/pages/Login.tsx` | Rewritten | Apple-style glass card auth with full animations |
| `src/App.tsx` | Modified | Added `/register` route alias |
| `src/index.css` | Modified | Added `particle-drift` keyframes (CSS fallback) |

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| rAF loop vs individual Framer springs | 80+ animated elements need direct DOM for 60fps — Framer springs would cause excessive re-renders |
| Spring-physics trail vs CSS trail | Real spring simulation gives organic inertia and velocity-based stretching that CSS can't replicate |
| Single Login component for both routes | Avoids code duplication; `AnimatePresence` handles the visual transition between modes |
| Cubic easing for attraction | Quadratic was too linear — cubic gives a snappier "snap into orbit" feel near cursor |
| HSL color cycling | Guarantees smooth perceptual transitions — RGB interpolation can hit muddy midpoints |
