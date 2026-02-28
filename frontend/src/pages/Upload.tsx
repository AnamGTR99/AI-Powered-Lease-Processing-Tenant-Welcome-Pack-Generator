import { motion } from 'framer-motion'
import { smoothEase } from '@/lib/motion'

export default function Upload() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...smoothEase, duration: 0.3 }}
    >
      <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
        Upload Lease
      </h1>
      <p className="mt-1 text-[15px] text-slate-400">
        Upload a lease document to extract tenant details and generate a Welcome Pack.
      </p>
    </motion.div>
  )
}
