'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Menu, List, Grid3X3, GripVertical, Trash2, RefreshCw, MoreHorizontal, Clipboard, Download, FileText } from 'lucide-react'
import Image from 'next/image'
import { Reorder, useDragControls } from 'framer-motion'
import { ListWithLinks, LinkInsert, Link, Emoji3D } from '@/types'
import { EmojiPicker } from './emoji-picker'
import { validateAndNormalizeUrl, getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { fetchOGDataClient } from '@/lib/og-client'
import { getDefaultEmoji3D } from '@/lib/emoji'

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
  const [viewMode, setViewMode] = useState<ViewMode>((list.view_mode as ViewMode) || 'menu')
  const [isEditingTitle, setIsEditingTitle] = useState(!list.title) // Start editing if title is empty
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [title, setTitle] = useState(list.title || '') // Ensure title is never undefined
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [currentEmoji3D, setCurrentEmoji3D] = useState<Emoji3D>(
    list.emoji_3d || {
      unicode: list.emoji || '🥨',
      url: getDefaultEmoji3D().url,
      name: getDefaultEmoji3D().name
    }
  )
  const [items, setItems] = useState(list.links || [])
  const [isRefreshingOG, setIsRefreshingOG] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    if (titleTextareaRef.current) {
      // Reset height to auto to get the natural height
      titleTextareaRef.current.style.height = 'auto'
      
      // Only set explicit height if content wraps to multiple lines
      const scrollHeight = titleTextareaRef.current.scrollHeight
      const clientHeight = titleTextareaRef.current.clientHeight
      
      // If content overflows (wraps), set explicit height
      if (scrollHeight > clientHeight) {
        titleTextareaRef.current.style.height = `${scrollHeight}px`
      }
      // Otherwise, leave height as 'auto' to match h1 natural height
    }
  }, [])

  const handleTitleSave = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      // If title is empty, default to "Untitled List"
      setTitle('Untitled List')
      onUpdateList?.({ title: 'Untitled List' })
    } else if (trimmedTitle !== list.title) {
      onUpdateList?.({ title: trimmedTitle })
    }
    setIsEditingTitle(false)
  }

  const handleAddLink = async () => {
    if (!linkInput.trim()) {
      return
    }

    setLinkError('')
    // Split by newlines first, then by commas for each line
    const urls = linkInput
      .split('\n')
      .flatMap(line => line.split(','))
      .map(url => url.trim())
      .filter(url => url)

    const validUrls: string[] = []
    let hasInvalidUrls = false

    urls.forEach(url => {
      const { isValid, normalizedUrl } = validateAndNormalizeUrl(url)
      if (isValid && normalizedUrl) {
        validUrls.push(normalizedUrl)
      } else {
        hasInvalidUrls = true
      }
    })

    if (hasInvalidUrls) {
      setLinkError('Please enter a valid URL')
      return
    }

    // Add links sequentially to the top of the list
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i]
      if (url) {
        await onAddLink?.({ 
          url,
          title: url // Use URL as default title, it will be updated with OG data
        })
      }
    }
    
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

  // Adjust textarea height when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      // Small delay to ensure the textarea is rendered
      setTimeout(() => {
        adjustTextareaHeight()
      }, 0)
    }
  }, [isEditingTitle, adjustTextareaHeight])

  const handleReorder = (newItems: Link[]) => {
    setItems(newItems)
    onReorderLinks?.(newItems.map(link => link.id))
  }

  // Refresh OG data for all links that don't have images
  const refreshOGData = async () => {
    if (isRefreshingOG) return
    
    setIsRefreshingOG(true)
    setShowMoreMenu(false)
    console.log('Refreshing OG data for links without images...')
    
    try {
      const updatedLinks = await Promise.all(
        items.map(async (link) => {
          // Only refresh if link doesn't have an image
          if (!link.image_url) {
            console.log('Fetching OG data for:', link.url)
            const ogData = await fetchOGDataClient(link.url)
            
            return {
              ...link,
              title: link.title || ogData.title || getHostname(link.url),
              image_url: ogData.image_url,
              favicon_url: ogData.favicon_url || link.favicon_url
            }
          }
          return link
        })
      )
      
      // Update the list with new OG data
      onUpdateList?.({ links: updatedLinks })
      setItems(updatedLinks)
      console.log('OG data refresh complete')
    } catch (error) {
      console.error('Error refreshing OG data:', error)
    } finally {
      setIsRefreshingOG(false)
    }
  }

  // Export list as CSV
  const exportAsCSV = () => {
    setShowMoreMenu(false)
    
    // Create CSV content
    const csvContent = [
      // Headers
      ['Title', 'URL'].join(','),
      // Data rows
      ...items.map(link => {
        const title = (link.title || getHostname(link.url)).replace(/"/g, '""') // Escape quotes
        const url = link.url
        return `"${title}","${url}"`
      })
    ].join('\n')
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.title || 'list'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    setShowMoreMenu(false)
    
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        // Parse URLs from clipboard and add them directly (don't put in input field)
        const urls = text
          .split(/[\n,\s]+/)
          .map(url => url.trim())
          .filter(url => url)
        
        const validUrls: string[] = []
        urls.forEach(url => {
          const { isValid, normalizedUrl } = validateAndNormalizeUrl(url)
          if (isValid && normalizedUrl) {
            validUrls.push(normalizedUrl)
          }
        })
        
        if (validUrls.length > 0) {
          for (let i = 0; i < validUrls.length; i++) {
            const url = validUrls[i]
            if (url) {
              await onAddLink?.({ 
                url,
                title: url // Use URL as default title, it will be updated with OG data
              })
            }
          }
        } else {
          // If no valid URLs found, show the text in input for manual editing
          setLinkInput(text)
        }
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setLinkError('Clipboard access denied. Please allow clipboard permissions in your browser settings and try again.')
      } else {
        setLinkError('Failed to access clipboard. Please try again.')
      }
    }
  }

  // Delete list (placeholder - would need proper confirmation)
  const deleteList = () => {
    setShowMoreMenu(false)
    // This would need to be implemented with proper confirmation dialog
    // and call a delete handler passed from parent
    console.log('Delete list not yet implemented')
  }

  // Auto-refresh OG data on mount if any links are missing images
  useEffect(() => {
    const hasLinksWithoutImages = items.some(link => !link.image_url)
    if (hasLinksWithoutImages && !isRefreshingOG) {
      console.log('Found links without images, auto-refreshing OG data...')
      refreshOGData()
    }
  }, []) // Only run once on mount

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const activeElement = document.activeElement
      const isInputFocused = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.getAttribute('contenteditable') === 'true'
      
      if (isInputFocused) return
      
      // Cmd/Ctrl + V - Paste clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault()
        pasteFromClipboard()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle global paste event when not focused on any input
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Check if the user is focused on an input, textarea, or contenteditable element
      const activeElement = document.activeElement
      const isInputFocused = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.getAttribute('contenteditable') === 'true'
      
      // If user is focused on an input, let the default paste behavior handle it
      if (isInputFocused) {
        return
      }

      // Prevent default paste behavior
      e.preventDefault()
      
      // Get clipboard text
      const clipboardText = e.clipboardData?.getData('text')
      if (!clipboardText) return
      
      // Parse URLs from clipboard
      const urls = clipboardText
        .split(/[\n,\s]+/)
        .map(url => url.trim())
        .filter(url => url)
      
      const validUrls: string[] = []
      
      // Validate URLs
      urls.forEach(url => {
        const { isValid, normalizedUrl } = validateAndNormalizeUrl(url)
        if (isValid && normalizedUrl) {
          validUrls.push(normalizedUrl)
        }
      })
      
      // If we have valid URLs, add them to the list
      if (validUrls.length > 0) {
        // Add links sequentially (seamlessly, no UI indicators)
        for (let i = 0; i < validUrls.length; i++) {
          const url = validUrls[i]
          if (url) {
            await onAddLink?.({ 
              url,
              title: url // Use URL as default title, it will be updated with OG data
            })
          }
        }
        
        // Clear any existing errors
        setLinkError('')
      }
    }

    // Add paste event listener
    document.addEventListener('paste', handleGlobalPaste)
    
    // Cleanup
    return () => {
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [list.id, onAddLink])

  // Handle view mode change and save to database
  const handleViewModeChange = async (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    
    // Save the view mode to the database
    if (onUpdateList) {
      try {
        await onUpdateList({ view_mode: newViewMode })
        console.log('View mode updated to:', newViewMode)
      } catch (error) {
        console.error('Failed to update view mode:', error)
        // Optionally revert the local state if the update fails
        // setViewMode(viewMode)
      }
    }
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
            className="w-16 h-16 bg-neutral-100 hover:bg-neutral-200 rounded-2xl flex items-center justify-center text-3xl transition-colors"
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
              ref={titleTextareaRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, 60))
                adjustTextareaHeight()
              }}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTitleSave()
                }
              }}
              placeholder="Untitled List"
              className="text-6xl font-bold text-foreground bg-transparent border-none outline-none capitalize w-full max-w-2xl resize-none placeholder:text-muted-foreground break-words overflow-hidden"
              style={{ 
                fontFamily: 'Open Runde',
                letterSpacing: '-2.24px',
                lineHeight: '100%',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                minHeight: '1em'
              }}
              maxLength={60}
              rows={1}
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
              {list.title || <span className="text-muted-foreground">Untitled List</span>}
            </h1>
          )}
        </div>

        {/* Input and Controls Card */}
        <div className="bg-neutral-100 rounded-2xl p-6">
          {/* Add Link Input */}
          <div className="mb-6">
            {linkError && (
              <div className="mb-3 text-sm text-destructive" style={{ fontFamily: 'Open Runde' }}>
                {linkError}
              </div>
            )}
            <div className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <textarea
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value)
                    if (linkError) {
                      setLinkError('')
                    }
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
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 rounded-lg text-primary-foreground transition-colors flex items-center gap-2"
              >
                <span className="font-medium">Add</span>
                <span className="text-xs opacity-70">⌘⏎</span>
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewModeChange('menu')}
                className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'menu' 
                    ? 'bg-white text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleViewModeChange('rows')}
                className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'rows' 
                    ? 'bg-white text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
            
            {/* More Options Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-10 h-10 rounded-md flex items-center justify-center transition-colors bg-white text-foreground hover:bg-neutral-50"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  <button
                    onClick={pasteFromClipboard}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                  >
                    <Clipboard className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Paste clipboard</span>
                    <span className="text-xs text-muted-foreground">⌘V</span>
                  </button>
                  
                  <button
                    onClick={refreshOGData}
                    disabled={isRefreshingOG}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshingOG ? 'animate-spin' : ''}`} />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>
                      {isRefreshingOG ? 'Refreshing...' : 'Refresh images'}
                    </span>
                  </button>
                  
                  <button
                    onClick={exportAsCSV}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Export to .csv</span>
                  </button>
                  
                  <div className="my-2 border-t border-neutral-200" />
                  
                  <button
                    onClick={deleteList}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-neutral-50 transition-colors text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Delete list</span>
                  </button>
                </div>
              )}
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
  dragControls?: ReturnType<typeof useDragControls>
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
        scale: 1
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileDrag={{ 
        scale: 1.05,
        zIndex: 9999
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
        className="bg-neutral-100 rounded-xl p-3 hover:bg-neutral-200 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Favicon 
              url={link.url}
              size={20}
              className="rounded-md"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-sm font-semibold text-foreground truncate"
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
        className="bg-neutral-100 rounded-2xl p-4 hover:bg-neutral-200 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-11 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0 relative">
            {link.image_url ? (
              <>
                <Image 
                  src={link.image_url} 
                  alt="" 
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Hide the failed image
                    e.currentTarget.style.display = 'none'
                    // Show the fallback div
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) {
                      fallback.style.display = 'flex'
                    }
                  }}
                />
                {/* Fallback content (hidden by default, shown when image fails) */}
                <div 
                  className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center absolute inset-0"
                  style={{ display: 'none' }}
                >
                  <Favicon 
                    url={link.url}
                    size={24}
                    className="rounded-md"
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                <Favicon 
                  url={link.url}
                  size={24}
                  className="rounded-md"
                />
              </div>
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
  // Debug log to see what data we have
  console.log('Grid layout link data:', { 
    url: link.url, 
    title: link.title, 
    image_url: link.image_url,
    favicon_url: link.favicon_url 
  })
  
  return (
    <div 
      className="bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all group overflow-hidden"
    >
      <div className="space-y-4">
        {/* OG Image Preview */}
        <div className="aspect-video bg-neutral-200 relative">
          {link.image_url ? (
            <>
              <Image 
                src={link.image_url} 
                alt={link.title || ''} 
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  console.error('Failed to load OG image:', link.image_url)
                  // Hide the failed image
                  e.currentTarget.style.display = 'none'
                  // Show the fallback div
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = 'flex'
                  }
                }}
              />
              {/* Fallback content (hidden by default, shown when image fails) */}
              <div 
                className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center absolute inset-0"
                style={{ display: 'none' }}
              >
                <Favicon 
                  url={link.url}
                  size={48}
                  className="rounded-lg"
                  fallbackClassName="bg-white/20 rounded-lg"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
              <Favicon 
                url={link.url}
                size={48}
                className="rounded-lg"
                fallbackClassName="bg-white/20 rounded-lg"
              />
            </div>
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
              <Favicon 
                url={link.url}
                size={16}
                className="rounded-sm"
              />
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

