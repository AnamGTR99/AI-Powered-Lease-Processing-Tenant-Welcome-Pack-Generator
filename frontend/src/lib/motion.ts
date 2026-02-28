/**
 * Shared Framer Motion animation presets.
 *
 * Every page and component imports from here so timing, easing, and
 * stagger values stay consistent across the entire app.
 */

import type { Variants, Transition } from 'framer-motion'

// ---------------------------------------------------------------------------
// Shared timing
// ---------------------------------------------------------------------------

export const spring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
}

export const smoothEase: Transition = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier — Apple-style ease
}

// ---------------------------------------------------------------------------
// Page transitions (used in App.tsx AnimatePresence)
// ---------------------------------------------------------------------------

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageTransitionProps = {
  variants: pageTransition,
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  transition: smoothEase,
} as const

// ---------------------------------------------------------------------------
// Fade in (generic)
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

// ---------------------------------------------------------------------------
// Staggered children (cards, list rows)
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothEase,
  },
}

// ---------------------------------------------------------------------------
// Scale on hover (buttons, cards)
// ---------------------------------------------------------------------------

export const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: spring,
}

export const scaleOnHoverSubtle = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: spring,
}
