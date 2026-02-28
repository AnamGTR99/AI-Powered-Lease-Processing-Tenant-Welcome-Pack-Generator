import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { smoothEase, staggerContainer, staggerItem, scaleOnHover } from '@/lib/motion'
import { apiFetch } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaseHistoryItem {
  upload_id: string
  file_name: string
  status: string
  created_at: string
  tenant_name: string | null
  property_address: string | null
  has_welcome_pack: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusBadge(status: string) {
  switch (status) {
    case 'complete':
      return { label: 'Completed', bg: '#ECFDF5', color: '#059669' }
    case 'failed':
      return { label: 'Failed', bg: '#FEF2F2', color: '#DC2626' }
    default:
      return { label: 'Processing', bg: '#FEF3C7', color: '#D97706' }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuth()
  const [leases, setLeases] = useState<LeaseHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await apiFetch('/api/lease/history')
        if (!res.ok) throw new Error('Failed to load dashboard data')
        const data: LeaseHistoryItem[] = await res.json()
        setLeases(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchLeases()
  }, [])

  const totalUploads = leases.length
  const completed = leases.filter((l) => l.status === 'complete').length
  const welcomePacks = leases.filter((l) => l.has_welcome_pack).length
  const recentLeases = leases.slice(0, 5)

  const stats = [
    { label: 'Total Uploads', value: totalUploads, color: '#0F172A' },
    { label: 'Processed', value: completed, color: '#1B4F72' },
    { label: 'Welcome Packs', value: welcomePacks, color: '#2E86C1' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      {/* Header + CTA */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-[15px] text-slate-400">
            Welcome back, {user?.email?.split('@')[0] ?? 'there'}. Here's an overview of your lease processing.
          </p>
        </div>
        <Link to="/upload">
          <motion.button
            {...scaleOnHover}
            className="flex items-center gap-2 rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload New Lease
          </motion.button>
        </Link>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-8 grid grid-cols-3 gap-5"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="rounded-2xl border border-white/50 p-6"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[13px] font-normal uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            {loading ? (
              <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <p
                className="mt-2 text-[32px] font-bold tracking-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <div className="flex items-center justify-between">
        <h2 className="mb-3 text-base font-medium text-slate-900">Recent Activity</h2>
        {leases.length > 5 && (
          <Link to="/history" className="text-[13px] font-medium text-[#1B4F72] hover:underline">
            View All
          </Link>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-0">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && leases.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smoothEase}
          className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 py-16"
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(27,79,114,0.06)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B4F72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-medium text-slate-700">No uploads yet</p>
            <p className="mt-1 text-sm text-slate-400">Upload your first lease to get started.</p>
          </div>
          <Link to="/upload">
            <motion.button
              {...scaleOnHover}
              className="mt-2 rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-medium text-white"
            >
              Upload a Lease
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Recent uploads list */}
      {!loading && !error && recentLeases.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="overflow-hidden rounded-xl border border-slate-200"
        >
          {recentLeases.map((lease) => {
            const badge = statusBadge(lease.status)
            return (
              <motion.div
                key={lease.upload_id}
                variants={staggerItem}
                className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 last:border-0"
              >
                <div>
                  <p className="text-[14px] font-normal text-slate-700">
                    {lease.tenant_name ?? lease.file_name}
                  </p>
                  {lease.property_address && (
                    <p className="mt-0.5 text-[13px] text-slate-400">
                      {lease.property_address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[13px] text-slate-400">
                    {timeAgo(lease.created_at)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
