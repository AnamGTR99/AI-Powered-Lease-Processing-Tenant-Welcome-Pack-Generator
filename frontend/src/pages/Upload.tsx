import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { smoothEase, staggerContainer, staggerItem } from '@/lib/motion'
import { apiFetch } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = 'idle' | 'selected' | 'uploading' | 'extracting' | 'generating' | 'complete' | 'error'

interface ExtractedData {
  tenant_name: string
  property_address: string
  lease_start_date: string
  lease_end_date: string
  rent_amount: string
  bond_amount: string
  num_occupants: string
  pet_permission: string
  parking: string
  special_conditions: string | null
  landlord_name: string
  property_manager_name: string
  property_manager_email: string
  property_manager_phone: string
}

interface UploadResult {
  upload_id: string
  status: string
  extracted_data: ExtractedData
  welcome_pack_url: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const PROCESSING_STAGES: { key: Stage; label: string }[] = [
  { key: 'uploading', label: 'Uploaded' },
  { key: 'extracting', label: 'Extracting' },
  { key: 'generating', label: 'Generating' },
  { key: 'complete', label: 'Complete' },
]

const STAGE_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  uploading: { title: 'Uploading your document...', subtitle: 'Sending to server' },
  extracting: { title: 'Extracting lease details...', subtitle: 'AI is reading your document' },
  generating: { title: 'Generating Welcome Pack...', subtitle: 'Almost there' },
  complete: { title: 'Processing complete!', subtitle: 'Your Welcome Pack is ready' },
}

// Field display configuration
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStageIndex(stage: Stage): number {
  return PROCESSING_STAGES.findIndex((s) => s.key === stage)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Upload() {
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const stageTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => stageTimerRef.current.forEach(clearTimeout)
  }, [])

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Only PDF and DOCX files are accepted'
    }
    if (f.size > MAX_SIZE) {
      return `File is too large (${formatFileSize(f.size)}). Maximum is 10MB.`
    }
    return null
  }

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f)
    if (err) {
      setError(err)
      setTimeout(() => setError(null), 4000)
      return
    }
    setFile(f)
    setStage('selected')
    setError(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const handleUpload = async () => {
    if (!file) return
    setStage('uploading')
    setError(null)

    // Fake stage progression while API runs
    stageTimerRef.current = [
      setTimeout(() => setStage((s) => (s === 'uploading' ? 'extracting' : s)), 2000),
      setTimeout(() => setStage((s) => (s === 'extracting' ? 'generating' : s)), 5000),
    ]

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await apiFetch('/api/lease/upload', {
        method: 'POST',
        body: formData,
      })

      // Clear fake timers — real response arrived
      stageTimerRef.current.forEach(clearTimeout)

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(body.detail || `Upload failed (${res.status})`)
      }

      const data: UploadResult = await res.json()
      setResult(data)
      setStage('complete')
    } catch (err) {
      stageTimerRef.current.forEach(clearTimeout)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  const handleDownload = async () => {
    if (!result) return
    setDownloading(true)

    try {
      const res = await apiFetch(`/api/welcome-pack/download/${result.upload_id}`)
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Welcome_Pack.docx`
      a.click()
      URL.revokeObjectURL(url)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch {
      setError('Failed to download Welcome Pack')
      setTimeout(() => setError(null), 4000)
    } finally {
      setDownloading(false)
    }
  }

  const reset = () => {
    setStage('idle')
    setFile(null)
    setResult(null)
    setError(null)
    setDownloaded(false)
    stageTimerRef.current.forEach(clearTimeout)
  }

  const isProcessing = ['uploading', 'extracting', 'generating'].includes(stage)
  const currentStageIndex = getStageIndex(stage)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      {/* Header — only show in idle/selected states */}
      <AnimatePresence>
        {(stage === 'idle' || stage === 'selected') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-9"
          >
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
              Upload Lease
            </h1>
            <p className="mt-1 text-[15px] text-slate-400">
              Upload a lease document to extract tenant details and generate a Welcome Pack.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && stage !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-xl bg-red-50 px-4 py-3"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ---- IDLE: Drop zone ---- */}
        {stage === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={smoothEase}
            className="relative cursor-pointer rounded-[20px] border-2 border-dashed transition-colors"
            style={{
              borderColor: dragOver ? '#1B4F72' : '#CBD5E1',
              background: dragOver ? 'rgba(27,79,114,0.03)' : 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4 px-10 py-16">
              <motion.div
                animate={{ y: dragOver ? -4 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(27,79,114,0.06)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B4F72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </motion.div>
              <div className="text-center">
                <p className="text-base font-medium text-slate-700">
                  Drag and drop your lease document
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  or{' '}
                  <span className="font-medium text-[#1B4F72] underline underline-offset-2">
                    browse files
                  </span>
                </p>
              </div>
              <p className="text-xs text-slate-300">PDF or DOCX, up to 10MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
          </motion.div>
        )}

        {/* ---- SELECTED: File ready to upload ---- */}
        {stage === 'selected' && file && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={smoothEase}
            className="rounded-[20px] border border-slate-200 bg-white p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(27,79,114,0.06)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B4F72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  Remove
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="rounded-xl bg-[#1B4F72] px-6 py-2.5 text-[14px] font-semibold text-white"
                >
                  Process Lease
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- PROCESSING: Stage indicator ---- */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={smoothEase}
            className="flex flex-col items-center gap-10 py-24"
          >
            {/* Spinner */}
            <div className="flex flex-col items-center gap-6">
              <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#1B4F72]" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <p className="text-lg font-medium text-slate-900">
                    {STAGE_MESSAGES[stage]?.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {STAGE_MESSAGES[stage]?.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stage pills */}
            <div className="flex items-center gap-3">
              {PROCESSING_STAGES.map((s, i) => {
                const isDone = i < currentStageIndex
                const isActive = i === currentStageIndex
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    {i > 0 && (
                      <div
                        className="h-0.5 w-8 rounded-full transition-colors duration-500"
                        style={{ background: isDone || isActive ? '#1B4F72' : '#E2E8F0' }}
                      />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500"
                        style={{
                          background: isDone ? '#1B4F72' : 'white',
                          border: `2px solid ${isDone || isActive ? '#1B4F72' : '#E2E8F0'}`,
                        }}
                      >
                        {isDone && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-[13px] transition-colors duration-300"
                        style={{
                          fontWeight: isDone || isActive ? 500 : 400,
                          color: isDone || isActive ? '#1B4F72' : '#94A3B8',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ---- COMPLETE: Results ---- */}
        {stage === 'complete' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={smoothEase}
          >
            {/* Success header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <div>
                  <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
                    Lease Processed Successfully
                  </h2>
                  <p className="text-sm text-slate-400">
                    {file?.name} — 14 fields extracted
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Upload Another
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity disabled:opacity-60"
                >
                  {downloaded ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Downloaded
                    </>
                  ) : downloading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Welcome Pack
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Extracted fields */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-7"
            >
              {FIELD_GROUPS.map((group) => (
                <motion.div key={group.label} variants={staggerItem}>
                  <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${group.fields.length}, minmax(0, 1fr))` }}>
                    {group.fields.map((field) => {
                      const value = result.extracted_data[field.key as keyof ExtractedData]
                      const isWide = 'wide' in field && field.wide
                      const isAccent = 'accent' in field && field.accent
                      return (
                        <div
                          key={field.key}
                          className="rounded-[14px] border border-slate-100 bg-white px-5 py-[18px]"
                          style={isWide ? { gridColumn: 'span 2' } : undefined}
                        >
                          <p className="text-xs text-slate-400">{field.label}</p>
                          <p
                            className="mt-1 text-[15px] font-medium"
                            style={{ color: isAccent ? '#1B4F72' : '#0F172A' }}
                          >
                            {value ?? '—'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ---- ERROR ---- */}
        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={smoothEase}
            className="flex flex-col items-center gap-6 py-24"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">Processing Failed</p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Start Over
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                className="rounded-xl bg-[#1B4F72] px-5 py-2.5 text-[14px] font-medium text-white"
              >
                Retry
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
