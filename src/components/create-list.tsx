'use client'

import { useState, useRef } from 'react'
import { getDefaultEmoji3D } from '@/lib/emoji'
import { EmojiPicker } from './emoji-picker'
import { CreateListForm, Emoji3D } from '@/types'
import { X } from 'lucide-react'
import Image from 'next/image'

interface CreateListProps {
  onCreateList: (list: CreateListForm) => void
  onClose: () => void
}

export function CreateList({ onCreateList, onClose }: CreateListProps) {
  const defaultEmoji3D = getDefaultEmoji3D()
  const [formData, setFormData] = useState<CreateListForm>({
    title: '',
    emoji: defaultEmoji3D.unicode,
    is_public: true
  })
  const [currentEmoji3D, setCurrentEmoji3D] = useState<Emoji3D>(defaultEmoji3D)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onCreateList({
        ...formData,
        title: formData.title.trim(),
        emoji: currentEmoji3D.unicode,
        emoji_3d: currentEmoji3D
      })
      onClose()
    } catch (error) {
      console.error('Failed to create list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40" onClick={onClose}>
        <div
          className="bg-background rounded-2xl p-8 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 
              className="text-2xl font-bold"
              style={{ fontFamily: 'Open Runde' }}
            >
              Create New List
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Emoji Selection */}
            <div className="text-center">
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                className="w-20 h-20 bg-secondary hover:bg-secondary/80 rounded-2xl flex items-center justify-center text-4xl transition-colors mx-auto mb-3"
              >
                {currentEmoji3D.url ? (
                  <Image
                    src={currentEmoji3D.url}
                    alt={currentEmoji3D.name || 'emoji'}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain"
                    unoptimized
                  />
                ) : (
                  <span>{currentEmoji3D.unicode}</span>
                )}
              </button>
              <p 
                className="text-sm text-muted-foreground"
                style={{ fontFamily: 'Open Runde' }}
              >
                Tap to change emoji
              </p>
            </div>

            {/* Title Input */}
            <div>
              <label 
                htmlFor="title"
                className="block text-sm font-medium text-foreground mb-2"
                style={{ fontFamily: 'Open Runde' }}
              >
                List Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My awesome list"
                className="w-full px-4 py-3 bg-secondary border-none rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                style={{ fontFamily: 'Open Runde' }}
                maxLength={100}
                required
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <p 
                    className="font-medium text-foreground"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Private
                  </p>
                  <p 
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Only you can see this list
                  </p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <p 
                    className="font-medium text-foreground"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Public
                  </p>
                  <p 
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Anyone can discover and view this list
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
                style={{ fontFamily: 'Open Runde' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim() || isLoading}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                style={{ fontFamily: 'Open Runde' }}
              >
                {isLoading ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        triggerRef={emojiButtonRef}
        currentEmoji={currentEmoji3D}
        onSelectEmoji={(emoji3D) => {
          setCurrentEmoji3D(emoji3D)
          setFormData(prev => ({ ...prev, emoji: emoji3D.unicode }))
          setShowEmojiPicker(false)
        }}
        onClose={() => setShowEmojiPicker(false)}
      />
    </>
  )
}