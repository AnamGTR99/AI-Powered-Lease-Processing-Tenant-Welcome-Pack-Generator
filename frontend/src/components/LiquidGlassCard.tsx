import { useRef, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// LiquidGlassCard — iOS 26-inspired liquid glass with cursor-reactive shine
// ---------------------------------------------------------------------------
// Layers:
//   1. Backdrop blur + saturation boost (frosted glass base)
//   2. Specular highlight that tracks cursor across the card surface
//   3. Subtle 3D perspective tilt responding to cursor position
//   4. Animated rim light on edges
// ---------------------------------------------------------------------------

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  /** Max tilt in degrees (default 2.5) */
  tiltMax?: number
  /** Specular highlight size in px (default 280) */
  shineSize?: number
}

export default function LiquidGlassCard({
  children,
  className = '',
  tiltMax = 2.5,
  shineSize = 280,
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const rimRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false })
  const smoothRef = useRef({ x: 0.5, y: 0.5 })

  const tick = useCallback(() => {
    const card = cardRef.current
    const shine = shineRef.current
    const rim = rimRef.current
    if (!card || !shine || !rim) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Smooth lerp toward actual cursor
    const lerp = mouseRef.current.inside ? 0.08 : 0.04
    smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * lerp
    smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * lerp

    const sx = smoothRef.current.x
    const sy = smoothRef.current.y

    // 3D tilt — centered at 0.5,0.5
    const tiltX = (sy - 0.5) * -tiltMax  // vertical mouse → X-axis rotation
    const tiltY = (sx - 0.5) * tiltMax    // horizontal mouse → Y-axis rotation

    card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

    // Specular highlight — follows cursor with gaussian falloff
    const shineX = sx * 100
    const shineY = sy * 100
    const shineOpacity = mouseRef.current.inside ? 1 : 0
    shine.style.background = `radial-gradient(${shineSize}px circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 70%)`
    shine.style.opacity = String(shineOpacity)

    // Rim light — brighter on the edge closest to cursor
    const rimAngle = Math.atan2(sy - 0.5, sx - 0.5) * (180 / Math.PI) + 90
    rim.style.background = `conic-gradient(from ${rimAngle}deg, rgba(255,255,255,0.5) 0deg, rgba(255,255,255,0.0) 60deg, rgba(255,255,255,0.0) 300deg, rgba(255,255,255,0.5) 360deg)`

    rafRef.current = requestAnimationFrame(tick)
  }, [tiltMax, shineSize])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        inside: true,
      }
    }

    const handleLeave = () => {
      mouseRef.current = { ...mouseRef.current, inside: false, x: 0.5, y: 0.5 }
    }

    card.addEventListener('mousemove', handleMove)
    card.addEventListener('mouseleave', handleLeave)
    return () => {
      card.removeEventListener('mousemove', handleMove)
      card.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        // Glass base
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(24px) saturate(180%) brightness(105%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(105%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: `
          0 8px 32px rgba(27, 79, 114, 0.08),
          0 1px 3px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          inset 0 -1px 0 rgba(255, 255, 255, 0.3)
        `,
        willChange: 'transform',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Rim light layer — conic gradient that follows cursor angle */}
      <div
        ref={rimRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
          opacity: 0.7,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Specular shine layer — radial gradient tracking cursor */}
      <div
        ref={shineRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          opacity: 0,
          transition: 'opacity 0.5s ease',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Top edge highlight — constant subtle refraction line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-[inherit]"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.9) 50%, transparent 90%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
