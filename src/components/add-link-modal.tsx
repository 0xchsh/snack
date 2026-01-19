'use client'

import { useState, useRef, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { validateAndNormalizeUrl } from '@/lib/url-utils'

interface AddLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLink: (url: string) => Promise<void>
}

export function AddLinkModal({ isOpen, onClose, onAddLink }: AddLinkModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrl('')
      setError('')
      setIsAdding(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    const { isValid, normalizedUrl } = validateAndNormalizeUrl(url.trim())
    if (!isValid || !normalizedUrl) {
      setError('Please enter a valid URL')
      return
    }

    setIsAdding(true)
    setError('')

    try {
      await onAddLink(normalizedUrl)
      onClose()
    } catch {
      setError('Failed to add link')
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-background border border-border rounded-lg p-4 w-full max-w-md shadow-lg"
          >
            {/* Close button - 44px touch target for mobile */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Header */}
            <h2 className="text-lg font-semibold mb-4">Add Link</h2>

            {/* Input row */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter link"
                className="flex-1 h-icon-button px-3 bg-background text-foreground border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                disabled={isAdding}
              />
              <Button
                type="button"
                onClick={handleSubmit}
                variant="primary"
                size="default"
                className="flex-shrink-0"
                disabled={isAdding || !url.trim()}
              >
                Add
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
