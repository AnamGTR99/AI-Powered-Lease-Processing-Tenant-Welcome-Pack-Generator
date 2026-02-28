import { useState } from 'react'
import { NavLink, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { smoothEase } from '@/lib/motion'

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/history', label: 'History' },
]

// ---------------------------------------------------------------------------
// AppShell — navbar + content + footer
// ---------------------------------------------------------------------------

export default function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleSignOut = () => {
    setShowLogoutConfirm(false)
    signOut()
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#F8FAFC' }}>
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 flex-shrink-0"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(27,79,114,0.04)',
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Acme Property Group" className="h-8" />
            </div>

            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative px-3.5 py-1.5 text-sm font-medium transition-colors"
                    style={{ color: isActive ? '#1B4F72' : '#64748B' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'rgba(27, 79, 114, 0.08)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Right: User + Sign Out */}
          <div className="relative flex items-center gap-3">
            <span className="text-[13px] text-slate-400">{user?.email}</span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              Sign Out
            </button>

            {/* Logout confirmation */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={smoothEase}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                >
                  <p className="mb-3 text-sm text-slate-600">
                    Are you sure you want to sign out?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-slate-100 px-6 py-5">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <p className="text-xs text-slate-300">
            &copy; 2026 Acme Property Group
          </p>
          <p className="text-xs text-slate-300">
            By Anam Milfer for InLogic
          </p>
        </div>
      </footer>
    </div>
  )
}
