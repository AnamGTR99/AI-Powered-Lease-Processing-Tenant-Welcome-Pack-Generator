import { motion } from 'framer-motion'
import { smoothEase } from '@/lib/motion'

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-[15px] text-slate-400">
          Welcome back. Here's an overview of your lease processing.
        </p>
      </div>

      {/* Stat cards — placeholder for INL-34 */}
      <div className="mb-8 grid grid-cols-3 gap-5">
        {[
          { label: 'Total Uploads', value: '—', color: '#0F172A' },
          { label: 'Processed', value: '—', color: '#1B4F72' },
          { label: 'Welcome Packs', value: '—', color: '#2E86C1' },
        ].map((stat) => (
          <div
            key={stat.label}
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
            <p
              className="mt-2 text-[32px] font-bold tracking-tight"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity — placeholder for INL-34 */}
      <div>
        <h2 className="mb-3 text-base font-medium text-slate-900">Recent Activity</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-center py-12 text-sm text-slate-400">
            No uploads yet. Upload a lease to get started.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
