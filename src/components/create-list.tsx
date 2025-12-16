'use client'

import Image from 'next/image'
import { useRef, useState, useMemo } from 'react'
import { X } from 'lucide-react'

import { Button, Input, Label } from '@/components/ui'
import { CreateListForm } from '@/types'
import { EmojiPicker } from './emoji-picker'
import { getRandomEmoji3D } from '@/lib/emoji'

interface CreateListProps {
  onCreateList: (list: CreateListForm) => void
  onClose: () => void
}

export function CreateList({ onCreateList, onClose }: CreateListProps) {
  // Generate random emoji once when component mounts
  const initialEmoji = useMemo(() => getRandomEmoji3D().unicode, [])

  const [formData, setFormData] = useState<CreateListForm>({
    title: '',
    emoji: initialEmoji,
    is_public: true
  })
  const [currentEmoji, setCurrentEmoji] = useState<string>(initialEmoji)
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
        emoji: currentEmoji
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
          className="bg-background rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold"
            >
              Create New List
            </h2>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Emoji Selection */}
            <div className="text-center">
              <Button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                variant="secondary"
                className="w-20 h-20 rounded-2xl text-4xl mx-auto mb-3 hover:bg-secondary/80"
              >
                <span>{currentEmoji}</span>
              </Button>
              <p 
                className="text-sm text-muted-foreground"
              >
                Tap to change emoji
              </p>
            </div>

            {/* Title Input */}
            <div>
              <Label
                htmlFor="title"
                className="mb-2 block"
              >
                List Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="My awesome list"
                maxLength={100}
                required
                variant="secondary"
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
                  >
                    Private
                  </p>
                  <p 
                    className="text-sm text-muted-foreground"
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
                  >
                    Public
                  </p>
                  <p 
                    className="text-sm text-muted-foreground"
                  >
                    Anyone can discover and view this list
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.title.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        triggerRef={emojiButtonRef}
        currentEmoji={currentEmoji}
        onSelectEmoji={(emoji) => {
          setCurrentEmoji(emoji)
          setFormData(prev => ({ ...prev, emoji: emoji }))
          setShowEmojiPicker(false)
        }}
        onClose={() => setShowEmojiPicker(false)}
      />
    </>
  )
}
