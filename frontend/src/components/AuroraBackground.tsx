import { useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate, animate } from 'framer-motion'

// ---------------------------------------------------------------------------
// HSL color helpers — smooth cycling
// ---------------------------------------------------------------------------

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// ---------------------------------------------------------------------------
// Trail config — spring-physics cursor trail with breathing segments
// ---------------------------------------------------------------------------

const TRAIL_SEGMENTS = 10
const TRAIL_SPRING_STIFFNESS = 150
const TRAIL_SPRING_DAMPING = 20

interface TrailPoint {
  x: number  // pixel position
  y: number
  vx: number // velocity for spring sim
  vy: number
}

// ---------------------------------------------------------------------------
// Particle config
// ---------------------------------------------------------------------------

interface Particle {
  baseX: number
  baseY: number
  size: number
  dash: boolean
  rotation: number
  driftPhaseX: number
  driftPhaseY: number
  driftSpeedX: number
  driftSpeedY: number
  driftAmplitudeX: number
  driftAmplitudeY: number
  attractStrength: number
  baseOpacity: number
  hueBase: number
  hueSpeed: number
  saturation: number
  lightness: number
}

const HUE_ANCHORS = [
  200, 210, 215, 220, 225, 230,
  240, 250, 260, 270,
  280, 290,
  180, 190,
  30, 40,
  0, 350,
]

const PARTICLE_COUNT = 80

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    baseX: Math.random(),
    baseY: Math.random(),
    size: 3 + Math.random() * 6,
    dash: true,  // all dashes, no circles
    rotation: Math.random() * 360,
    driftPhaseX: Math.random() * Math.PI * 2,
    driftPhaseY: Math.random() * Math.PI * 2,
    driftSpeedX: 0.2 + Math.random() * 0.5,
    driftSpeedY: 0.2 + Math.random() * 0.5,
    driftAmplitudeX: 30 + Math.random() * 60,
    driftAmplitudeY: 30 + Math.random() * 60,
    attractStrength: 0.25 + Math.random() * 0.35,
    baseOpacity: 0.2 + Math.random() * 0.25,
    hueBase: HUE_ANCHORS[Math.floor(Math.random() * HUE_ANCHORS.length)] + (Math.random() - 0.5) * 30,
    hueSpeed: 8 + Math.random() * 25,
    saturation: 50 + Math.random() * 35,
    lightness: 38 + Math.random() * 22,
  }))
}

const particles = generateParticles()
const ATTRACT_RADIUS = 0.6

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuroraBackground({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const cursorRef = useRef({ x: 0.5, y: 0.5 })
  const cursorPxRef = useRef({ x: 0, y: 0 })
  const smoothCursorRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)

  // Trail points — spring-simulated chain
  const trailPointsRef = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_SEGMENTS }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }))
  )

  // Cursor glow
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const springX = useSpring(mouseX, { stiffness: 30, damping: 25, mass: 1.5 })
  const springY = useSpring(mouseY, { stiffness: 30, damping: 25, mass: 1.5 })

  // Breathing glow hue
  const hue = useMotionValue(210)

  useEffect(() => {
    const controls = animate(hue, [210, 260, 195, 230, 210], {
      duration: 16,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    return controls.stop
  }, [hue])

  const glowBackground = useMotionTemplate`
    radial-gradient(
      700px circle at calc(${springX} * 100%) calc(${springY} * 100%),
      hsla(${hue}, 65%, 55%, 0.15) 0%,
      hsla(${hue}, 55%, 45%, 0.06) 40%,
      transparent 70%
    )
  `

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      cursorRef.current = { x, y }
      cursorPxRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      mouseX.set(x)
      mouseY.set(y)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Combined animation loop — particles + trail
  const tick = useCallback(() => {
    const dt = 0.016
    timeRef.current += dt
    const t = timeRef.current

    // --- Smooth cursor for particles ---
    const lerp = 0.07
    smoothCursorRef.current.x += (cursorRef.current.x - smoothCursorRef.current.x) * lerp
    smoothCursorRef.current.y += (cursorRef.current.y - smoothCursorRef.current.y) * lerp
    const cx = smoothCursorRef.current.x
    const cy = smoothCursorRef.current.y

    // --- Trail: spring-physics chain ---
    const trail = trailPointsRef.current
    const target = cursorPxRef.current

    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const point = trail[i]
      // Each segment follows the one ahead of it (first follows cursor)
      const leader = i === 0 ? target : trail[i - 1]

      // Spring force: F = -k * displacement - damping * velocity
      const dx = point.x - leader.x
      const dy = point.y - leader.y
      const fx = -TRAIL_SPRING_STIFFNESS * dx - TRAIL_SPRING_DAMPING * point.vx
      const fy = -TRAIL_SPRING_STIFFNESS * dy - TRAIL_SPRING_DAMPING * point.vy

      // Integrate (semi-implicit Euler)
      point.vx += fx * dt
      point.vy += fy * dt
      point.x += point.vx * dt
      point.y += point.vy * dt
    }

    // --- Render trail segments ---
    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const el = trailRefs.current[i]
      if (!el) continue

      const point = trail[i]
      const leader = i === 0 ? target : trail[i - 1]

      // Tangent angle
      const tdx = point.x - leader.x
      const tdy = point.y - leader.y
      const angle = Math.atan2(tdy, tdx) * (180 / Math.PI)

      // Segment length from distance (stretches with velocity)
      const segDist = Math.sqrt(tdx * tdx + tdy * tdy)
      const baseLen = 20 + segDist * 0.8
      const len = Math.min(baseLen, 60)

      // Breathing: sine-wave modulates width and opacity
      // Each segment has a phase offset so the wave ripples down the chain
      const breathPhase = t * 3.5 + i * 0.7
      const breathFactor = 0.5 + 0.5 * Math.sin(breathPhase)

      const width = len
      const height = 2 + breathFactor * 3.5  // 2-5.5px thick
      const opacity = 0.12 + breathFactor * 0.22 - i * 0.025  // fades toward tail

      // Color — hue shifts down the chain + cycles over time
      const segHue = 210 + i * 12 + t * 15
      const color = hslToHex(segHue, 60 + breathFactor * 20, 48 + breathFactor * 12)

      // Position at midpoint between leader and point
      const mx = (point.x + leader.x) / 2
      const my = (point.y + leader.y) / 2

      el.style.transform = `translate(${mx - width / 2}px, ${my - height / 2}px) rotate(${angle}deg)`
      el.style.width = `${width}px`
      el.style.height = `${height}px`
      el.style.opacity = String(Math.max(opacity, 0))
      el.style.backgroundColor = color
    }

    // --- Particles ---
    for (let i = 0; i < particles.length; i++) {
      const el = particleRefs.current[i]
      if (!el) continue

      const p = particles[i]

      const driftX = Math.sin(t * p.driftSpeedX + p.driftPhaseX) * p.driftAmplitudeX
      const driftY = Math.cos(t * p.driftSpeedY + p.driftPhaseY) * p.driftAmplitudeY
      const rot = p.rotation + t * 8

      const pdx = cx - p.baseX
      const pdy = cy - p.baseY
      const dist = Math.sqrt(pdx * pdx + pdy * pdy)

      const attractFactor = Math.max(0, 1 - dist / ATTRACT_RADIUS)
      const eased = attractFactor * attractFactor * attractFactor

      const pullX = pdx * eased * p.attractStrength * 1200
      const pullY = pdy * eased * p.attractStrength * 1200

      const opacity = p.baseOpacity + eased * 0.5

      const currentHue = p.hueBase + t * p.hueSpeed
      const color = hslToHex(currentHue, p.saturation, p.lightness)

      el.style.transform = `translate(${driftX + pullX}px, ${driftY + pullY}px) rotate(${rot}deg)`
      el.style.opacity = String(Math.min(opacity, 0.75))
      el.style.backgroundColor = color
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* Cursor-following glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground }}
      />

      {/* Particle field */}
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p, i) => (
          <div
            key={i}
            ref={(el) => { particleRefs.current[i] = el }}
            className="absolute"
            style={{
              left: `${p.baseX * 100}%`,
              top: `${p.baseY * 100}%`,
              width: p.dash ? `${p.size * 2.2}px` : `${p.size}px`,
              height: p.dash ? `${p.size * 0.5}px` : `${p.size}px`,
              borderRadius: p.dash ? '2px' : '999px',
              backgroundColor: hslToHex(p.hueBase, p.saturation, p.lightness),
              opacity: p.baseOpacity,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Cursor trail — spring-physics chain */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: TRAIL_SEGMENTS }, (_, i) => (
          <div
            key={`trail-${i}`}
            ref={(el) => { trailRefs.current[i] = el }}
            className="absolute top-0 left-0"
            style={{
              width: '20px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: hslToHex(210 + i * 12, 65, 50),
              opacity: 0,
              willChange: 'transform, opacity, width, height',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
