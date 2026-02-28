import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuroraBackground from '@/components/AuroraBackground'
import LiquidGlassPill from '@/components/LiquidGlassPill'
import { spring } from '@/lib/motion'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo in liquid glass container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <LiquidGlassPill borderRadius="28px" shineSize={320}>
            <div className="px-14 py-10">
              <img
                src="/logo.svg"
                alt="Acme Property Group"
                className="h-14 w-auto select-none sm:h-16"
                draggable={false}
              />
            </div>
          </LiquidGlassPill>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8 text-[13px] font-medium uppercase tracking-[0.25em] text-slate-400/80"
        >
          Made by Anam Milfer for InLogic
        </motion.p>

        {/* Enter Now button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{ transition: 'none' }}
          className="mt-10"
        >
          <LiquidGlassPill onClick={() => navigate('/login')}>
            <div className="relative px-10 py-3.5">
              {/* Continuous shimmer sweep */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 w-full"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 60%, transparent 80%)',
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    repeatDelay: 5,
                  }}
                />
              </div>

              {/* Button content */}
              <div className="relative flex items-center gap-3">
                <span className="text-[15px] font-semibold tracking-wide text-slate-600">
                  Enter Now
                </span>
                <motion.svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  animate={{ x: [0, 3, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    ...spring,
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </div>
            </div>
          </LiquidGlassPill>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}
