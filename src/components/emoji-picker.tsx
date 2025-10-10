'use client'

import { useRef, useEffect, useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Emoji3D } from '@/types'
import { useTheme } from 'next-themes'

interface EmojiPickerProps {
  isOpen: boolean
  triggerRef: React.RefObject<HTMLElement | HTMLButtonElement | null>
  currentEmoji: Emoji3D
  onSelectEmoji: (emoji: Emoji3D) => void
  onClose: () => void
}

export function EmojiPicker({
  isOpen,
  triggerRef,
  currentEmoji: _currentEmoji,
  onSelectEmoji,
  onClose
}: EmojiPickerProps) {
  const { theme, resolvedTheme } = useTheme()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const pickerRef = useRef<HTMLDivElement>(null)

  // Determine the actual theme to use (resolvedTheme handles 'system')
  const actualTheme = resolvedTheme || theme || 'light'

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const pickerWidth = 352 // emoji-mart default width
      const pickerHeight = 435 // emoji-mart default height

      let left = triggerRect.left
      let top = triggerRect.bottom + 8

      // Adjust if picker would go off-screen
      if (left + pickerWidth > viewportWidth - 16) {
        left = viewportWidth - pickerWidth - 16
      }

      if (top + pickerHeight > viewportHeight - 16) {
        top = triggerRect.top - pickerHeight - 8
      }

      // Ensure minimum margins
      left = Math.max(16, left)
      top = Math.max(16, top)

      setPosition({ top, left })
    }
  }, [isOpen, triggerRef])

  const handleEmojiSelect = (emoji: any) => {
    const emoji3D: Emoji3D = {
      unicode: emoji.native,
      url: '', // No URL needed for native emojis
      name: emoji.name
    }

    onSelectEmoji(emoji3D)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Emoji Mart Picker */}
      <div
        ref={pickerRef}
        className="fixed z-50"
        style={{
          top: position.top,
          left: position.left
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={actualTheme}
          previewPosition="none"
          skinTonePosition="search"
        />
      </div>
    </>
  )
}
