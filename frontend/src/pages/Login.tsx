import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { fadeInUp, smoothEase, scaleOnHover } from '@/lib/motion'
import AuroraBackground from '@/components/AuroraBackground'
import LiquidGlassCard from '@/components/LiquidGlassCard'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (error) {
      setError(error)
    } else if (isSignUp) {
      setSignUpSuccess(true)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setConfirmPassword('')
  }

  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ ...smoothEase, duration: 0.6 }}
          className="w-full max-w-[420px]"
        >
        <LiquidGlassCard className="rounded-[20px] px-10 pb-10 pt-12">
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <img src="/logo.svg" alt="Acme Property Group" className="h-11" />
          </div>

          {/* Header — animated swap between login/signup */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup-header' : 'login-header'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={smoothEase}
              className="mb-7 text-center"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignUp
                  ? 'Get started with Acme Property Group'
                  : 'Sign in to Acme Property Group'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {signUpSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={smoothEase}
                className="space-y-4 text-center"
              >
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-700">
                    Account created successfully! Check your email to confirm, then sign in.
                  </p>
                </div>
                <motion.button
                  {...scaleOnHover}
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    setSignUpSuccess(false)
                  }}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Back to Sign In
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key={isSignUp ? 'signup-form' : 'login-form'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={smoothEase}
                onSubmit={handleSubmit}
                className="space-y-[18px]"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-foreground placeholder:text-slate-400 transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium text-slate-600">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-foreground placeholder:text-slate-400 transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Confirm Password — signup only */}
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-slate-600">
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-foreground placeholder:text-slate-400 transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg bg-red-50 px-3 py-2"
                    >
                      <p className="text-sm text-red-600">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  {...scaleOnHover}
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </motion.button>

                {/* Toggle */}
                <p className="pt-1 text-center text-[13px] text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                    onClick={toggleMode}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </LiquidGlassCard>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}
