import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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

function formatDate(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
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

export default function History() {
  const [leases, setLeases] = useState<LeaseHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch('/api/lease/history')
        if (!res.ok) throw new Error('Failed to load history')
        const data: LeaseHistoryItem[] = await res.json()
        setLeases(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const handleDownload = async (uploadId: string, fileName: string) => {
    setDownloadingId(uploadId)
    try {
      const res = await apiFetch(`/api/welcome-pack/download/${uploadId}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Welcome_Pack_${fileName.replace(/\.[^.]+$/, '')}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Could show a toast — for now just reset
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
            Upload History
          </h1>
          <p className="mt-1 text-[15px] text-slate-400">
            View all previously processed lease documents.
          </p>
        </div>
        {!loading && !error && leases.length > 0 && (
          <p className="text-[14px] text-slate-400">
            <span className="font-medium text-slate-900">{leases.length}</span> upload{leases.length !== 1 ? 's' : ''} total
          </p>
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
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {/* Skeleton header */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 py-3">
            <div className="h-3 w-12 animate-pulse rounded bg-slate-100" style={{ marginRight: 'auto' }} />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center border-b border-slate-50 px-6 py-4 last:border-0">
              <div className="flex w-[130px] shrink-0 flex-col gap-2">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-56 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="flex w-[110px] shrink-0 justify-center">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="flex w-[160px] shrink-0 justify-end">
                <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
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

      {/* Table */}
      {!loading && !error && leases.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="overflow-hidden rounded-2xl border border-slate-200"
        >
          {/* Column headers */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 py-3">
            <span className="w-[130px] shrink-0 text-[12px] font-medium uppercase tracking-widest text-slate-400">
              Date
            </span>
            <span className="flex-1 text-[12px] font-medium uppercase tracking-widest text-slate-400">
              Tenant / Property
            </span>
            <span className="w-[110px] shrink-0 text-center text-[12px] font-medium uppercase tracking-widest text-slate-400">
              Status
            </span>
            <span className="w-[160px] shrink-0 text-right text-[12px] font-medium uppercase tracking-widest text-slate-400">
              Actions
            </span>
          </div>

          {/* Rows */}
          {leases.map((lease) => {
            const badge = statusBadge(lease.status)
            const { date, time } = formatDate(lease.created_at)
            const isDownloading = downloadingId === lease.upload_id

            return (
              <motion.div
                key={lease.upload_id}
                variants={staggerItem}
                onClick={() => navigate(`/history/${lease.upload_id}`)}
                className="flex cursor-pointer items-center border-b border-slate-100 bg-white px-6 py-4 transition-colors hover:bg-slate-50/50 last:border-0"
              >
                {/* Date */}
                <div className="flex w-[130px] shrink-0 flex-col gap-0.5">
                  <span className="text-[14px] text-slate-700">{date}</span>
                  <span className="text-[12px] text-slate-400">{time}</span>
                </div>

                {/* Tenant / Property */}
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-slate-900">
                    {lease.tenant_name ?? lease.file_name}
                  </span>
                  {lease.property_address && (
                    <span className="text-[13px] text-slate-400">
                      {lease.property_address}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="flex w-[110px] shrink-0 justify-center">
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex w-[160px] shrink-0 justify-end">
                  {lease.status === 'complete' && lease.has_welcome_pack && (
                    <motion.button
                      {...scaleOnHover}
                      onClick={(e) => { e.stopPropagation(); handleDownload(lease.upload_id, lease.file_name) }}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-1.5 text-[13px] font-medium text-[#1B4F72] transition-colors hover:bg-slate-200 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                      Download
                    </motion.button>
                  )}
                  {lease.status === 'failed' && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-1.5 text-[13px] font-medium text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Retry
                    </span>
                  )}
                  {lease.status !== 'complete' && lease.status !== 'failed' && (
                    <span className="text-[13px] text-slate-300">&mdash;</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
