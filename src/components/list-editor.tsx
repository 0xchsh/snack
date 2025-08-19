'use client'

import { useState, useRef } from 'react'
import { Plus, Menu, List, Grid3X3 } from 'lucide-react'
import Image from 'next/image'
import { ListWithLinks, LinkInsert, Link, Emoji3D } from '@/types'
import { EmojiPicker } from './emoji-picker'
import { validateAndNormalizeUrl, getHostname, getFaviconUrl } from '@/lib/url-utils'

interface ListEditorProps {
  list: ListWithLinks
  onUpdateList?: (updates: Partial<ListWithLinks>) => void
  onAddLink?: (link: LinkInsert) => void
  onRemoveLink?: (linkId: string) => void
  onReorderLinks?: (links: string[]) => void
}

type ViewMode = 'menu' | 'rows' | 'grid'

export function ListEditor({ 
  list, 
  onUpdateList, 
  onAddLink, 
  onRemoveLink, 
  onReorderLinks: _onReorderLinks 
}: ListEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [currentEmoji3D, setCurrentEmoji3D] = useState<Emoji3D>({
    unicode: list.emoji || '🎯',
    url: undefined,
    name: undefined
  })
  const emojiButtonRef = useRef<HTMLButtonElement>(null)

  const handleTitleSave = () => {
    if (title.trim() && title !== list.title) {
      onUpdateList?.({ title: title.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleAddLink = () => {
    if (!linkInput.trim()) {
      return
    }

    setLinkError('')
    const urls = linkInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url)

    const validUrls: string[] = []
    const invalidUrls: string[] = []

    urls.forEach(url => {
      const { isValid, normalizedUrl, error } = validateAndNormalizeUrl(url)
      if (isValid && normalizedUrl) {
        validUrls.push(normalizedUrl)
      } else {
        invalidUrls.push(`${url}: ${error}`)
      }
    })

    if (invalidUrls.length > 0) {
      setLinkError(`Invalid URLs: ${invalidUrls.join(', ')}`)
      return
    }

    validUrls.forEach((url, index) => {
      onAddLink?.({ 
        url,
        list_id: list.id,
        position: (list.links?.length || 0) + index
      })
    })
    
    setLinkInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddLink()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-8">
        {/* Icon & Title */}
        <div className="space-y-6">
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(true)}
            className="w-16 h-16 bg-white hover:bg-secondary rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-colors"
          >
            {currentEmoji3D.url ? (
              <Image
                src={currentEmoji3D.url}
                alt={currentEmoji3D.name || 'emoji'}
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                unoptimized
              />
            ) : (
              <span>{currentEmoji3D.unicode}</span>
            )}
          </button>
          
          {isEditingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-4xl font-bold text-foreground bg-transparent border-none outline-none capitalize"
              style={{ fontFamily: 'Open Runde' }}
              autoFocus
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-4xl font-bold text-foreground cursor-pointer capitalize hover:text-muted-foreground transition-colors"
              style={{ 
                fontFamily: 'Open Runde',
                letterSpacing: '-2.24px',
                lineHeight: '56px'
              }}
            >
              {list.title}
            </h1>
          )}
        </div>

        {/* Add Link Input */}
        <div className="bg-secondary rounded-2xl p-4">
          {linkError && (
            <div className="mb-3 text-sm text-destructive" style={{ fontFamily: 'Open Runde' }}>
              {linkError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <textarea
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value)
                  if (linkError) setLinkError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste a link or multiple links"
                className="w-full bg-transparent resize-none border-none outline-none text-muted-foreground placeholder:text-muted-foreground"
                style={{ 
                  fontFamily: 'Open Runde',
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '-0.32px'
                }}
                rows={1}
              />
            </div>
            
            <button
              onClick={handleAddLink}
              disabled={!linkInput.trim()}
              className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:bg-primary/50 rounded-full flex items-center justify-center text-primary-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('menu')}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                viewMode === 'menu' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('rows')}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                viewMode === 'rows' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('grid')}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Links List */}
      <div className={`
        ${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}
      `}>
        {list.links?.map((link) => (
          <LinkItem
            key={link.id}
            link={link}
            viewMode={viewMode}
            onRemove={() => onRemoveLink?.(link.id)}
          />
        ))}
        
        {(!list.links || list.links.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <p style={{ fontFamily: 'Open Runde' }}>
              Add your first link to get started
            </p>
          </div>
        )}
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        triggerRef={emojiButtonRef}
        currentEmoji={currentEmoji3D}
        onSelectEmoji={(emoji3D) => {
          setCurrentEmoji3D(emoji3D)
          onUpdateList?.({ emoji: emoji3D.unicode })
          setShowEmojiPicker(false)
        }}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  )
}

interface LinkItemProps {
  link: Link
  viewMode: ViewMode
  onRemove: () => void
}

function LinkItem({ link, viewMode, onRemove }: LinkItemProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border hover:shadow-sm transition-shadow group">
      <div className="flex items-center gap-3">
        {/* Favicon */}
        <div className="w-6 h-6 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {link.favicon_url ? (
            <Image 
              src={link.favicon_url} 
              alt="" 
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-muted-foreground truncate"
            style={{ fontFamily: 'Open Runde' }}
          >
            {link.title || getHostname(link.url)}
          </h3>
          
          {viewMode !== 'grid' && (
            <p 
              className="text-sm text-muted-foreground/70 truncate mt-1"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.url}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}