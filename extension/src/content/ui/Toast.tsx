import React, { useEffect, useState } from 'react'
import type { ToastData } from '@/shared/types'
import { TOAST_DURATION, TOAST_ERROR_DURATION } from '@/shared/constants'

// Design tokens
const colors = {
  bg: 'rgb(22, 24, 28)',
  bgElevated: 'rgb(32, 34, 38)',
  border: 'rgb(47, 51, 54)',
  text: 'rgb(255, 255, 255)',
  textMuted: 'rgb(113, 118, 123)',
  success: 'rgb(0, 186, 124)',
  error: 'rgb(244, 67, 54)',
}

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

  // Compact Cosmos-style icons
  const SnackIcon = () => (
    <div style={{
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: '10px',
      flexShrink: 0,
    }}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 72 72"
        fill="none"
        style={{ color: colors.text }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M37.79 17.558C42.746 14.468 48.035 13.877 52.977 17.463C58.33 21.35 59.754 27.144 59.058 33.342C58.389 39.3 55.83 44.504 51.295 48.652C50.673 49.221 50.249 50.633 50.498 51.411C51.208 53.64 51.798 55.553 48.937 56.675C45.884 57.873 45.314 55.489 44.346 53.625C44.247 53.437 44.092 53.276 43.88 52.986C39.142 52.986 28.239 53.022 28.171 53.023C28.159 53.042 27.584 54.002 27.121 54.778C26.067 56.544 25.018 57.66 22.811 56.567C20.835 55.591 20.088 54.232 21.223 52.23C22.17 50.557 21.692 49.534 20.322 48.227C14.059 42.249 11.581 34.68 13.323 26.366C15.29 16.982 24.104 12.036 33.588 17.151C34.969 17.897 36.011 18.667 37.79 17.558ZM30.579 46.352H41.392C39.527 41.837 37.887 37.864 35.955 33.188C34 37.975 32.409 41.872 30.579 46.352ZM51.875 27.11C50.449 21.762 44.554 20.084 40.488 23.832C40.043 24.242 39.66 25.249 39.854 25.735C42.134 31.427 44.53 37.072 47.111 43.248C51.774 38.336 53.489 33.161 51.875 27.11ZM31.431 23.862C28.944 20.884 23.721 21.275 21.521 24.5C17.813 29.937 19.292 37.755 24.718 43.009C24.925 42.952 29.694 31.71 31.892 26.221C32.148 25.58 31.891 24.415 31.431 23.862Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )

  const ErrorIcon = () => (
    <div style={{
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '8px',
      flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill={colors.error}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )

  const LoadingIcon = () => (
    <div style={{
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: '8px',
      flexShrink: 0,
    }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          border: `2px solid ${colors.border}`,
          borderTopColor: colors.text,
          borderRadius: '50%',
          animation: 'snack-spin 0.8s linear infinite',
        }}
      />
    </div>
  )

  const icons = {
    success: <SnackIcon />,
    error: <ErrorIcon />,
    loading: <LoadingIcon />,
  }

  // Parse message for list name (format: "Saved to {listName} ✓")
  const isSuccessWithList = toast.type === 'success' && toast.message.includes('Saved to')
  const isClickable = isSuccessWithList && toast.listPublicId

  const handleClick = () => {
    if (isClickable && toast.listPublicId) {
      window.open(`https://snack.xyz/list/${toast.listPublicId}`, '_blank')
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        borderRadius: '14px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        opacity: isVisible && !isExiting ? 1 : 0,
        transform: isVisible && !isExiting ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.2s ease-out',
        minWidth: '240px',
        maxWidth: '320px',
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      {icons[toast.type]}

      <div style={{ flex: 1, minWidth: 0 }}>
        {isSuccessWithList ? (
          <>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: colors.text,
            }}>
              Saved
            </div>
            <div style={{
              fontSize: '13px',
              color: colors.textMuted,
              marginTop: '2px',
            }}>
              View in Snack
            </div>
          </>
        ) : (
          <div style={{
            fontSize: '14px',
            color: colors.text,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Arrow icon for success toast - Cosmos style */}
      {isSuccessWithList && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.textMuted}
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
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
      {/* Inject keyframes for spinner animation */}
      <style>
        {`
          @keyframes snack-spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
