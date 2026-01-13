'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    message: string,
    description?: string,
    duration?: number
  ) => void
  success: (message: string, description?: string, duration?: number) => void
  error: (message: string, description?: string, duration?: number) => void
  warning: (message: string, description?: string, duration?: number) => void
  info: (message: string, description?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircleIcon className="w-5 h-5" />,
  error: <XCircleIcon className="w-5 h-5" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  info: <InformationCircleIcon className="w-5 h-5" />,
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      description?: string,
      duration: number = 3000
    ) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        type,
        message,
        ...(description !== undefined && { description }),
        duration,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove toast after duration
      setTimeout(() => {
        removeToast(id)
      }, duration)
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('success', message, description, duration)
    },
    [showToast]
  )

  const error = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('error', message, description, duration)
    },
    [showToast]
  )

  const warning = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('warning', message, description, duration)
    },
    [showToast]
  )

  const info = useCallback(
    (message: string, description?: string, duration?: number) => {
      showToast('info', message, description, duration)
    },
    [showToast]
  )

  const value: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`${toastStyles[toast.type]} px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 pointer-events-auto`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">{toastIcons[toast.type]}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs mt-0.5 opacity-90">{toast.description}</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close notification"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
