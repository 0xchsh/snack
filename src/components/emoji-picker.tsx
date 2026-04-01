'use client'

import { useRef, useEffect, useState } from 'react'
import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker as EmojiPickerPrimitive,
} from 'frimousse'
import { MagnifyingGlass, SpinnerGap } from '@phosphor-icons/react'

interface EmojiPickerProps {
  isOpen: boolean
  triggerRef: React.RefObject<HTMLElement | HTMLButtonElement | null>
  currentEmoji: string
  onSelectEmoji: (emoji: string) => void
  onClose: () => void
}

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="scroll-my-1 px-2">
      {children}
    </div>
  )
}

function EmojiPickerEmoji({ emoji, className, ...props }: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      className="data-[active]:bg-secondary flex size-7 items-center justify-center rounded-sm text-base cursor-pointer"
    >
      {emoji.emoji}
    </button>
  )
}

function EmojiPickerCategoryHeader({ category, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-popover text-muted-foreground px-2.5 pb-2 pt-3.5 text-xs leading-none"
    >
      {category.label}
    </div>
  )
}

export function EmojiPicker({
  isOpen,
  triggerRef,
  currentEmoji: _currentEmoji,
  onSelectEmoji,
  onClose
}: EmojiPickerProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 400)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const pickerWidth = isMobile ? Math.min(352, viewportWidth - 32) : 352
      const pickerHeight = 435

      let left = triggerRect.left
      let top = triggerRect.bottom + 8

      if (isMobile) {
        left = (viewportWidth - pickerWidth) / 2
      } else {
        if (left + pickerWidth > viewportWidth - 16) {
          left = viewportWidth - pickerWidth - 16
        }
      }

      if (top + pickerHeight > viewportHeight - 16) {
        top = triggerRect.top - pickerHeight - 8
      }

      left = Math.max(16, left)
      top = Math.max(16, top)

      setPosition({ top, left })
    }
  }, [isOpen, triggerRef, isMobile])

  if (!isOpen) return null

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

      {/* Picker */}
      <div
        ref={pickerRef}
        className="fixed z-50"
        style={{
          top: position.top,
          left: position.left,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : undefined,
        }}
      >
        <EmojiPickerPrimitive.Root
          className="bg-popover text-popover-foreground border border-border isolate flex h-[435px] w-[352px] flex-col overflow-hidden rounded-xl shadow-lg"
          onEmojiSelect={({ emoji }) => {
            onSelectEmoji(emoji)
            onClose()
          }}
        >
          {/* Search */}
          <div className="flex h-9 items-center gap-2 border-b border-border px-3">
            <MagnifyingGlass className="size-4 shrink-0 opacity-50" />
            <EmojiPickerPrimitive.Search
              className="outline-none placeholder:text-muted-foreground flex h-10 w-full bg-transparent py-3 text-sm"
              placeholder="Search emoji…"
            />
          </div>

          {/* Content */}
          <EmojiPickerPrimitive.Viewport className="outline-none relative flex-1">
            <EmojiPickerPrimitive.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <SpinnerGap className="size-4 animate-spin" />
            </EmojiPickerPrimitive.Loading>
            <EmojiPickerPrimitive.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No emoji found.
            </EmojiPickerPrimitive.Empty>
            <EmojiPickerPrimitive.List
              className="select-none pb-1"
              components={{
                Row: EmojiPickerRow,
                Emoji: EmojiPickerEmoji,
                CategoryHeader: EmojiPickerCategoryHeader,
              }}
            />
          </EmojiPickerPrimitive.Viewport>
        </EmojiPickerPrimitive.Root>
      </div>
    </>
  )
}
