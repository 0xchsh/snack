import React, { useEffect, useState } from 'react'
import { cn } from '@/shared/utils'
import type { ToastData } from '@/shared/types'
import { TOAST_DURATION, TOAST_ERROR_DURATION } from '@/shared/constants'

interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Auto-dismiss
    const duration = toast.duration ||
      (toast.type === 'error' ? TOAST_ERROR_DURATION : TOAST_DURATION)

    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        handleRemove()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 200)
  }

  const icon = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    loading: (
      <div className="w-5 h-5 border-2 border-[rgb(47,51,54)] border-t-[#e5e5e5] rounded-full animate-spin" />
    ),
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-200',
        'bg-[rgb(22,24,28)] border border-[rgb(47,51,54)]',
        isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{ minWidth: '200px', maxWidth: '320px' }}
    >
      {icon[toast.type]}
      <span className="text-[14px] text-white flex-1">{toast.message}</span>
      {toast.type !== 'loading' && (
        <button
          onClick={handleRemove}
          className="p-1 hover:bg-[rgb(47,51,54)] rounded-full transition-colors"
        >
          <svg className="w-4 h-4 text-[rgb(113,118,123)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="snack-toast-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
