'use client'

import { useRef, useEffect, useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from './theme-provider'

interface EmojiPickerProps {
  isOpen: boolean
  triggerRef: React.RefObject<HTMLElement | HTMLButtonElement | null>
  currentEmoji: string
  onSelectEmoji: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({
  isOpen,
  triggerRef,
  currentEmoji: _currentEmoji,
  onSelectEmoji,
  onClose
}: EmojiPickerProps) {
  const { resolvedTheme } = useTheme()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Wait for mount to get correct theme and detect mobile
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 400)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Determine the actual theme to use
  const actualTheme = mounted ? resolvedTheme : 'light'

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const pickerWidth = isMobile ? Math.min(352, viewportWidth - 32) : 352 // Constrain width on mobile
      const pickerHeight = 435 // emoji-mart default height

      let left = triggerRect.left
      let top = triggerRect.bottom + 8

      // On mobile, center the picker horizontally
      if (isMobile) {
        left = (viewportWidth - pickerWidth) / 2
      } else {
        // Adjust if picker would go off-screen
        if (left + pickerWidth > viewportWidth - 16) {
          left = viewportWidth - pickerWidth - 16
        }
      }

      if (top + pickerHeight > viewportHeight - 16) {
        top = triggerRect.top - pickerHeight - 8
      }

      // Ensure minimum margins
      left = Math.max(16, left)
      top = Math.max(16, top)

      setPosition({ top, left })
    }
  }, [isOpen, triggerRef, isMobile])

  const handleEmojiSelect = (emoji: any) => {
    onSelectEmoji(emoji.native)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
        aria-label="Close emoji picker"
        tabIndex={-1}
      />

      {/* Emoji Mart Picker */}
      <div
        ref={pickerRef}
        className="fixed z-50"
        style={{
          top: position.top,
          left: position.left,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : undefined
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={actualTheme}
          previewPosition="none"
          skinTonePosition="search"
          perLine={isMobile ? 7 : 9}
        />
      </div>
    </>
  )
}
