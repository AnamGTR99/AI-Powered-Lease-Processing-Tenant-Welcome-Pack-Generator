import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { smoothEase, staggerContainer, staggerItem, scaleOnHover } from '@/lib/motion'
import { apiFetch } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaseDetailData {
  upload_id: string
  file_name: string
  file_type: string
  status: string
  created_at: string
  error_message: string | null
  extracted_data: Record<string, string> | null
  welcome_pack_url: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELD_GROUPS = [
  {
    label: 'Tenant Information',
    fields: [
      { key: 'tenant_name', label: 'Tenant Name' },
      { key: 'num_occupants', label: 'Number of Occupants' },
      { key: 'pet_permission', label: 'Pet Permission' },
    ],
  },
  {
    label: 'Property',
    fields: [
      { key: 'property_address', label: 'Property Address', wide: true },
      { key: 'parking', label: 'Parking' },
    ],
  },
  {
    label: 'Lease Terms',
    fields: [
      { key: 'lease_start_date', label: 'Lease Start' },
      { key: 'lease_end_date', label: 'Lease End' },
      { key: 'rent_amount', label: 'Rent Amount', accent: true },
      { key: 'bond_amount', label: 'Bond Amount' },
    ],
  },
  {
    label: 'Contacts',
    fields: [
      { key: 'landlord_name', label: 'Landlord' },
      { key: 'property_manager_name', label: 'Property Manager' },
      { key: 'property_manager_email', label: 'Manager Email' },
      { key: 'property_manager_phone', label: 'Manager Phone' },
    ],
  },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `Uploaded ${date} at ${time}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeaseDetail() {
  const { uploadId } = useParams<{ uploadId: string }>()
  const [lease, setLease] = useState<LeaseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await apiFetch(`/api/lease/${uploadId}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Lease not found')
          throw new Error('Failed to load lease details')
        }
        const data: LeaseDetailData = await res.json()
        setLease(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [uploadId])

  const handleDownload = async () => {
    if (!lease) return
    setDownloading(true)
    try {
      const res = await apiFetch(`/api/welcome-pack/download/${lease.upload_id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Welcome_Pack_${lease.file_name.replace(/\.[^.]+$/, '')}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail — could add toast later
    } finally {
      setDownloading(false)
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smoothEase, duration: 0.3 }}
      >
        <div className="mb-6 h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mb-2 h-8 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mb-1 h-4 w-48 animate-pulse rounded bg-slate-50" />
        <div className="mb-8 h-3 w-36 animate-pulse rounded bg-slate-50" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-7">
            <div className="mb-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex-1 rounded-xl border border-slate-100 p-4">
                  <div className="mb-2 h-3 w-20 animate-pulse rounded bg-slate-50" />
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    )
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smoothEase, duration: 0.3 }}
      >
        <Link
          to="/history"
          className="mb-6 flex items-center gap-1.5 text-[14px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to History
        </Link>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-red-200 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-slate-700">{error}</p>
          <Link to="/history">
            <motion.button
              {...scaleOnHover}
              className="mt-2 rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-medium text-white"
            >
              Return to History
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  if (!lease) return null

  const badge = statusBadge(lease.status)
  const data = lease.extracted_data ?? {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      {/* Back link */}
      <Link
        to="/history"
        className="mb-6 flex items-center gap-1.5 text-[14px] text-slate-400 transition-colors hover:text-slate-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to History
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
              {data.tenant_name ?? lease.file_name}
            </h1>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-medium"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {data.property_address && (
            <p className="text-[15px] text-slate-400">{data.property_address}</p>
          )}
          <p className="text-[13px] text-slate-300">{formatDateTime(lease.created_at)}</p>
        </div>

        {lease.status === 'complete' && lease.welcome_pack_url && (
          <motion.button
            {...scaleOnHover}
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {downloading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Download Welcome Pack
          </motion.button>
        )}
      </div>

      {/* No extracted data fallback */}
      {!lease.extracted_data && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <p className="text-[15px] text-slate-400">
            {lease.status === 'failed'
              ? lease.error_message ?? 'Processing failed. No data was extracted.'
              : 'Data is still being extracted. Check back shortly.'}
          </p>
        </div>
      )}

      {/* Field groups */}
      {lease.extracted_data && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-7"
        >
          {FIELD_GROUPS.map((group) => (
            <motion.div key={group.label} variants={staggerItem}>
              <p className="mb-3 text-[12px] font-medium uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <div className="flex gap-4">
                {group.fields.map((field) => {
                  const isWide = 'wide' in field && field.wide
                  const value = data[field.key]

                  return (
                    <div
                      key={field.key}
                      className="flex flex-col gap-1 rounded-xl border border-[#E2E8F0] bg-white p-4"
                      style={{ flex: isWide ? 2 : 1 }}
                    >
                      <span className="text-[12px] text-[#94A3B8]">
                        {field.label}
                      </span>
                      <span className="text-[15px] font-medium text-[#0F172A]">
                        {value || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
