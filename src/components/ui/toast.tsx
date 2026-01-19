'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ClipboardIcon, StarIcon } from '@heroicons/react/24/solid'

type ToastVariant = 'success' | 'error' | 'copied' | 'saved'

interface ToastProps {
  show: boolean
  message: string
  variant?: ToastVariant
}

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircleIcon; className: string }> = {
  success: {
    icon: CheckCircleIcon,
    className: 'bg-green-500 text-white',
  },
  error: {
    icon: XCircleIcon,
    className: 'bg-red-500 text-white',
  },
  copied: {
    icon: ClipboardIcon,
    className: 'bg-green-500 text-white',
  },
  saved: {
    icon: StarIcon,
    className: 'bg-green-500 text-white',
  },
}

export function Toast({ show, message, variant = 'success' }: ToastProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
          transition={{ duration: 0.2 }}
          className={`fixed top-4 left-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${config.className}`}
          role="status"
          aria-live="polite"
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
