'use client'

import { useRef, useEffect, useState } from 'react'
import { Picker, EmojiType } from 'ms-3d-emoji-picker'
import { Emoji3D } from '@/types'

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
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const pickerWidth = 400 // Approximate picker width
      const pickerHeight = 500 // Approximate picker height

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

  const handle3DEmojiSelect = (selectedEmoji: EmojiType) => {
    // Since the 3D emoji picker only provides URLs and numeric names,
    // we'll use a default emoji unicode and rely on the 3D image
    const emoji3D: Emoji3D = {
      unicode: '✨', // Default emoji as fallback since 3D picker doesn't provide Unicode
      url: selectedEmoji.url,
      name: selectedEmoji.name
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
      
      {/* Just the 3D Picker */}
      <div
        ref={pickerRef}
        className="fixed z-50"
        style={{
          top: position.top,
          left: position.left
        }}
      >
        <Picker
          isOpen={true}
          handleEmojiSelect={handle3DEmojiSelect}
        />
      </div>
    </>
  )
}