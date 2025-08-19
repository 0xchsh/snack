'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Menu, List, Grid3X3, GripVertical, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { motion, Reorder, useDragControls } from 'framer-motion'
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
  onReorderLinks 
}: ListEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [currentEmoji3D, setCurrentEmoji3D] = useState<Emoji3D>(
    list.emoji_3d || {
      unicode: list.emoji || '🎯',
      url: undefined,
      name: undefined
    }
  )
  const [items, setItems] = useState(list.links || [])
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

  // Update items when list.links changes
  useEffect(() => {
    setItems(list.links || [])
  }, [list.links])

  // Update emoji when list.emoji_3d changes
  useEffect(() => {
    if (list.emoji_3d) {
      setCurrentEmoji3D(list.emoji_3d)
    }
  }, [list.emoji_3d])

  const handleReorder = (newItems: Link[]) => {
    setItems(newItems)
    onReorderLinks?.(newItems.map(link => link.id))
  }

  return (
    <div className={`${viewMode === 'grid' ? 'w-full' : 'max-w-2xl mx-auto'} space-y-8`}>
      {/* Header */}
      <div className={`${viewMode === 'grid' ? 'max-w-2xl mx-auto' : ''} space-y-8`}>
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
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-6xl font-bold text-foreground bg-transparent border-none outline-none capitalize w-full max-w-2xl resize-none"
              style={{ 
                fontFamily: 'Open Runde',
                letterSpacing: '-2.24px',
                lineHeight: '100%'
              }}
              maxLength={60}
              rows={2}
              autoFocus
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-6xl font-bold text-foreground cursor-pointer capitalize hover:text-muted-foreground transition-colors max-w-2xl break-words"
              style={{ 
                fontFamily: 'Open Runde',
                letterSpacing: '-2.24px',
                lineHeight: '100%'
              }}
            >
              {list.title}
            </h1>
          )}
        </div>

        {/* Input and Controls Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Add Link Input */}
          <div className="mb-6">
            {linkError && (
              <div className="mb-3 text-sm text-destructive" style={{ fontFamily: 'Open Runde' }}>
                {linkError}
              </div>
            )}
            <div className="bg-neutral-100 rounded-xl p-4 flex items-center justify-between">
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
      </div>

      {/* Links List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-6">
          {items.map((link) => (
            <LinkItem
              key={link.id}
              link={link}
              viewMode={viewMode}
              onRemove={() => onRemoveLink?.(link.id)}
            />
          ))}
        </div>
      ) : (
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={handleReorder}
          className={viewMode === 'rows' ? 'space-y-6' : 'space-y-3'}
        >
          {items.map((link) => (
            <DraggableLinkItem
              key={link.id}
              link={link}
              viewMode={viewMode}
              onRemove={() => onRemoveLink?.(link.id)}
            />
          ))}
        </Reorder.Group>
      )}
      
      {(!items || items.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p style={{ fontFamily: 'Open Runde' }}>
            Add your first link to get started
          </p>
        </div>
      )}

      <EmojiPicker
        isOpen={showEmojiPicker}
        triggerRef={emojiButtonRef}
        currentEmoji={currentEmoji3D}
        onSelectEmoji={(emoji3D) => {
          setCurrentEmoji3D(emoji3D)
          onUpdateList?.({ 
            emoji: emoji3D.unicode,
            emoji_3d: emoji3D 
          })
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
  dragControls?: any
}

interface DraggableLinkItemProps {
  link: Link
  viewMode: ViewMode
  onRemove: () => void
}

function DraggableLinkItem({ link, viewMode, onRemove }: DraggableLinkItemProps) {
  const controls = useDragControls()
  
  return (
    <Reorder.Item 
      value={link}
      dragListener={false}
      dragControls={controls}
      className="list-none"
      initial={{ opacity: 0, y: 20, scale: 1 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileDrag={{ 
        scale: 1.05, 
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        zIndex: 50
      }}
      transition={{ 
        duration: 0.2,
        ease: "easeOut"
      }}
    >
      <LinkItem
        link={link}
        viewMode={viewMode}
        onRemove={onRemove}
        dragControls={controls}
      />
    </Reorder.Item>
  )
}

function LinkItem({ 
  link, 
  viewMode, 
  onRemove,
  dragControls 
}: LinkItemProps) {
  if (viewMode === 'menu') {
    // Compact rows - smallest layout
    return (
      <div 
        className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {link.favicon_url ? (
              <Image 
                src={link.favicon_url} 
                alt="" 
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-sm font-medium text-foreground truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.title || getHostname(link.url)}
            </h3>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
              onPointerDown={(e) => dragControls?.start(e)}
            >
              <GripVertical className="w-3 h-3" />
            </button>
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Delete link"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'rows') {
    // Larger cards as rows - medium layout
    return (
      <div 
        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {link.favicon_url ? (
              <Image 
                src={link.favicon_url} 
                alt="" 
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-semibold text-foreground truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.title || getHostname(link.url)}
            </h3>
            <p 
              className="text-sm text-muted-foreground/80 truncate mt-1"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.url}
            </p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-2 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
              onPointerDown={(e) => dragControls?.start(e)}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors p-2"
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout - largest cards with OG images
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden"
    >
      <div className="space-y-4">
        {/* OG Image Preview */}
        <div className="aspect-video bg-neutral-200 relative">
          {link.image_url ? (
            <Image 
              src={link.image_url} 
              alt="" 
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
          )}
          
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              className="bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
              onPointerDown={(e) => dragControls?.start(e)}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg"
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4 space-y-2">
          <h3 
            className="font-semibold text-foreground text-base leading-tight line-clamp-2"
            style={{ fontFamily: 'Open Runde' }}
          >
            {link.title || getHostname(link.url)}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex-shrink-0">
              {link.favicon_url ? (
                <Image 
                  src={link.favicon_url} 
                  alt="" 
                  width={16}
                  height={16}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
              )}
            </div>
            <p 
              className="text-sm text-muted-foreground/70 truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {getHostname(link.url)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}