'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, List, Grid3X3, GripVertical, Trash2, RefreshCw, MoreHorizontal, Clipboard, FileText, Eye, Link2 } from 'lucide-react'
import Image from 'next/image'
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

// Ghost loading component for different view modes
function GhostLinkItem({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'menu') {
    return (
      <div className="bg-muted rounded-lg px-3 py-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-accent flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-accent rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'rows') {
    return (
      <div className="bg-muted rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-11 rounded-xl bg-accent flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-5 bg-accent rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-accent rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div className="bg-muted rounded-xl animate-pulse overflow-hidden">
      <div className="aspect-video bg-accent"></div>
      <div className="px-4 pb-4 pt-4 space-y-2">
        <div className="h-4 bg-accent rounded w-3/4"></div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-accent flex-shrink-0"></div>
          <div className="h-3 bg-accent rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

export function ListEditor({ 
  list, 
  onUpdateList, 
  onAddLink, 
  onRemoveLink, 
  onReorderLinks 
}: ListEditorProps) {
  const [viewMode] = useState<ViewMode>('menu') // Fixed to menu view only
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
  const [isRefreshingOG, setIsRefreshingOG] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [loadingLinks, setLoadingLinks] = useState<string[]>([])
  const [optimisticList, setOptimisticList] = useState<ListWithLinks>(list)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemPosition, setDraggedItemPosition] = useState({ x: 0, y: 0, width: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const dragStartPosition = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const mobilePasteInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    checkMobile()
  }, [])

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

    // Add ghost loading placeholders immediately
    setLoadingLinks(validUrls)
    setLinkInput('')

    // Add links sequentially to the top of the list
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i]
      if (url) {
        await onAddLink?.({ 
          url,
          title: url // Use URL as default title, it will be updated with OG data
        })
        // Remove from loading state as each one completes
        setLoadingLinks(prev => prev.filter(loadingUrl => loadingUrl !== url))
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddLink()
    }
  }


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

  // Custom drag handlers with visual feedback
  const handleMouseDown = useCallback((e: React.MouseEvent, linkId: string, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    
    // Calculate center offset for better drag feel
    dragOffset.current = {
      x: rect.width / 2,
      y: rect.height / 2
    }
    
    setDraggedItemId(linkId)
    setIsDragging(true)
    setDraggedItemPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
      width: rect.width
    })
    
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedItemId) return
    
    // Update drag preview position
    setDraggedItemPosition(prev => ({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
      width: prev.width
    }))
    
    // Find which item we're hovering over (menu view only)
    const container = document.querySelector('.draggable-list-container')
    if (!container) return
    
    const items = container.children
    let newHoverIndex = null
    
    // Check each item to see if we're hovering over it
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement
      // Skip the drag preview element
      if (item.classList.contains('fixed')) continue
      
      const rect = item.getBoundingClientRect()

      // Menu view: check if mouse is in the vertical range
      const midY = rect.top + rect.height / 2
      if (e.clientY <= midY) {
        newHoverIndex = i
        break
      }
    }

    // If we're past all items, set to last position
    if (newHoverIndex === null && items.length > 0) {
      const lastItem = items[items.length - 1] as HTMLElement
      if (!lastItem.classList.contains('fixed')) {
        const lastRect = lastItem.getBoundingClientRect()
        if (e.clientY > lastRect.bottom) {
          newHoverIndex = items.length - 1
        }
      }
    }
    
    if (newHoverIndex !== null) {
      setDragOverIndex(newHoverIndex)
    }
  }, [isDragging, draggedItemId, viewMode])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    console.log('Mouse up:', { 
      isDragging, 
      draggedItemId, 
      dragOverIndex, 
      viewMode,
      hasLinks: !!list.links,
      linksCount: list.links?.length || 0
    })
    
    if (!isDragging || !optimisticList.links || !draggedItemId) {
      cleanup()
      return
    }
    
    const draggedIndex = optimisticList.links.findIndex(link => link.id === draggedItemId)
    console.log('Drag indices:', { draggedIndex, dragOverIndex, viewMode })
    
    if (draggedIndex !== -1 && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder the links
      const newLinks = [...optimisticList.links]
      const [draggedItem] = newLinks.splice(draggedIndex, 1)
      newLinks.splice(dragOverIndex, 0, draggedItem)
      
      console.log('Reordering in', viewMode, ':', {
        from: draggedIndex,
        to: dragOverIndex,
        draggedItem: draggedItem.id,
        newOrder: newLinks.map(l => l.id)
      })
      
      // Update the order
      onReorderLinks?.(newLinks.map(link => link.id))
    } else {
      console.log('No reordering needed:', {
        draggedIndex,
        dragOverIndex,
        samePosition: draggedIndex === dragOverIndex
      })
    }
    
    cleanup()
  }, [isDragging, optimisticList.links, draggedItemId, dragOverIndex, onReorderLinks, viewMode])
  
  const cleanup = useCallback(() => {
    setIsDragging(false)
    setDraggedItemId(null)
    setDragOverIndex(null)
    setDraggedItemPosition({ x: 0, y: 0, width: 0 })
    document.body.style.cursor = 'auto'
    document.body.style.userSelect = 'auto'
  }, [])
  
  // Set up global mouse event listeners when dragging starts
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Refresh OG data for all links that don't have images
  const refreshOGData = async () => {
    if (isRefreshingOG) {
      return
    }
    
    setIsRefreshingOG(true)
    setShowMoreMenu(false)
    
    try {
      const updatedLinks = await Promise.all(
        (list.links || []).map(async (link) => {
          // Only refresh if link doesn't have an image
          if (!link.image_url) {
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
      ...(list.links || []).map(link => {
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

  // Helper function to process pasted URLs (shared by desktop and mobile)
  const processPastedText = async (text: string) => {
    if (!text) return

    // Clear any previous errors
    setLinkError('')

    // Parse URLs from clipboard and add them directly
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
      // Add ghost loading placeholders immediately
      setLoadingLinks(validUrls)

      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i]
        if (url) {
          await onAddLink?.({
            url,
            title: url // Use URL as default title, it will be updated with OG data
          })

          // Remove from loading state as each one completes
          setLoadingLinks(prev => prev.filter(loadingUrl => loadingUrl !== url))
        }
      }
    }
  }

  // Paste from clipboard (desktop only - mobile uses visible input)
  const pasteFromClipboard = async () => {
    setShowMoreMenu(false)

    try {
      const text = await navigator.clipboard.readText()
      await processPastedText(text)
    } catch (error) {
      // Silently ignore clipboard errors - user can try Cmd+V
    }
  }

  // Handle mobile paste input
  const handleMobilePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')

    // Clear the input immediately
    if (mobilePasteInputRef.current) {
      mobilePasteInputRef.current.value = ''
    }

    await processPastedText(text)
  }

  // Copy public list link
  const copyListLink = async () => {
    setShowMoreMenu(false)
    
    try {
      const url = `${window.location.origin}/${list.user?.username || 'list'}/${list.id}`
      await navigator.clipboard.writeText(url)
      // TODO: Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy list link:', error)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = `${window.location.origin}/${list.user?.username || 'list'}/${list.id}`
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }

  // Delete list (placeholder - would need proper confirmation)
  const deleteList = () => {
    setShowMoreMenu(false)
    // This would need to be implemented with proper confirmation dialog
    // and call a delete handler passed from parent
  }

  // Handle link deletion with optimistic UI updates
  const handleDeleteLink = async (linkId: string) => {
    // Store the original optimistic list for potential rollback
    const originalOptimisticList = optimisticList
    
    // Optimistically remove the link from the UI immediately
    const updatedLinks = (optimisticList.links || []).filter(link => link.id !== linkId)
    const optimisticUpdate = { ...optimisticList, links: updatedLinks }
    
    // Update the optimistic state immediately
    setOptimisticList(optimisticUpdate)
    
    try {
      // Call the actual delete handler
      await onRemoveLink?.(linkId)
    } catch (error) {
      // If delete fails, revert to original optimistic list
      setOptimisticList(originalOptimisticList)
      console.error('Failed to delete link:', error)
    }
  }

  // Sync optimistic list with props when the parent component updates
  useEffect(() => {
    setOptimisticList(list)
  }, [list])

  // Auto-refresh OG data on mount if any links are missing images
  useEffect(() => {
    const hasLinksWithoutImages = (list.links || []).some(link => !link.image_url)
    if (hasLinksWithoutImages && !isRefreshingOG) {
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
        // Add ghost loading placeholders immediately
        setLoadingLinks(validUrls)
        
        // Add links sequentially
        for (let i = 0; i < validUrls.length; i++) {
          const url = validUrls[i]
          if (url) {
            await onAddLink?.({ 
              url,
              title: url // Use URL as default title, it will be updated with OG data
            })
            
            // Remove from loading state as each one completes
            setLoadingLinks(prev => prev.filter(loadingUrl => loadingUrl !== url))
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

  // Removed view mode change handler - fixed to menu view only

  return (
    <div className="space-y-6">
      {/* Emoji + Title */}
      <div className="flex items-start gap-4">
        <button
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker(true)}
          className="w-[62px] h-[62px] flex items-center justify-center bg-background border border-border rounded-xl text-3xl hover:border-muted-foreground transition-colors flex-shrink-0"
        >
          <span>{currentEmoji3D.unicode}</span>
        </button>

        {isEditingTitle ? (
          <input
            ref={titleTextareaRef as any}
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleTitleSave()
              }
            }}
            placeholder="Untitled List"
            className="flex-1 text-3xl font-normal text-foreground bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground break-all"
            maxLength={60}
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-left text-3xl font-normal text-foreground bg-background border border-border rounded-xl px-4 py-3 hover:border-muted-foreground transition-colors break-all hyphens-auto"
          >
            {list.title || <span className="text-muted-foreground">Untitled List</span>}
          </button>
        )}
      </div>

      {/* Link count and Paste button/input */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-2 rounded-sm flex-shrink-0">
          <Link2 className="w-4 h-4" />
          <span className="text-base">{optimisticList.links?.length || 0} links</span>
        </div>

        {/* Desktop: Paste button */}
        {!isMobile && (
          <button
            onClick={pasteFromClipboard}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-base text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors flex-shrink-0"
          >
            <span>Paste links</span>
            <span className="text-sm">⌘V</span>
          </button>
        )}

        {/* Mobile: Visible paste input */}
        {isMobile && (
          <input
            ref={mobilePasteInputRef}
            type="text"
            placeholder="Paste link(s) here"
            onPaste={handleMobilePaste}
            className="flex-1 px-4 py-2 border border-border rounded-sm text-base bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors min-w-0"
          />
        )}
      </div>

      {/* Error message */}
      {linkError && (
        <div className="text-sm text-destructive">
          {linkError}
        </div>
      )}

      {/* Links List - Menu View Only */}
      <div className="flex flex-col gap-3">
        {/* Ghost loading placeholders */}
        {loadingLinks.map((url, index) => (
          <GhostLinkItem key={`ghost-${url}-${index}`} viewMode="menu" />
        ))}

        {/* Draggable list */}
        <div className="relative draggable-list-container flex flex-col gap-3">
          {(optimisticList.links || []).map((link, index) => (
            <div
              key={link.id}
              data-link-id={link.id}
              onMouseDown={(e) => handleMouseDown(e, link.id, index)}
              className={`
                transition-all duration-300 ease-out select-none
                ${draggedItemId === link.id ? 'opacity-30' : 'opacity-100'}
                ${dragOverIndex === index && draggedItemId !== link.id ?
                  'transform translate-y-2 ring-1 ring-foreground rounded-lg' : ''}
              `}
            >
              <LinkItem
                link={link}
                viewMode="menu"
                onRemove={() => handleDeleteLink(link.id)}
              />
            </div>
          ))}

          {/* Floating Drag Preview */}
          {isDragging && draggedItemId && (() => {
            const draggedLink = optimisticList.links?.find(l => l.id === draggedItemId)
            if (!draggedLink) return null

            return (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: `${draggedItemPosition.x}px`,
                  top: `${draggedItemPosition.y}px`,
                  width: `${draggedItemPosition.width || 0}px`,
                  transform: 'rotate(1deg) scale(1.02)',
                  filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.2))',
                  opacity: 0.95
                }}
              >
                <LinkItem
                  link={draggedLink}
                  viewMode="menu"
                  onRemove={() => {}}
                />
              </div>
            )
          })()}
        </div>
      </div>
      
      {(!optimisticList.links || optimisticList.links.length === 0) && loadingLinks.length === 0 && (
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
}

function LinkItem({ 
  link, 
  viewMode, 
  onRemove
}: LinkItemProps) {
  if (viewMode === 'menu') {
    // Compact rows - clean list layout
    return (
      <div className="flex items-center gap-3 px-3 py-3 bg-muted hover:bg-muted/80 transition-transform transform hover:scale-[0.99] active:scale-[0.97] group cursor-grab rounded-lg select-none">
        <div className="w-5 h-5 flex-shrink-0">
          <Favicon
            url={link.url}
            size={20}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base text-foreground truncate">
            {link.title || getHostname(link.url)}
          </h3>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto">
          <div className="text-muted-foreground p-1 cursor-grab" title="Drag to reorder">
            <GripVertical className="w-4 h-4" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            className="text-red-600 hover:text-red-700 transition-colors p-1 cursor-pointer"
            title="Delete link"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (viewMode === 'rows') {
    // Larger cards as rows - medium layout
    return (
      <div
        className="bg-muted rounded-2xl p-4 hover:bg-accent transition-all group cursor-grab relative"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformOrigin: 'center',
          willChange: 'transform'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-[100px] h-14 rounded-xl overflow-hidden bg-accent flex-shrink-0 relative">
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
                  className="w-full h-full bg-background flex items-center justify-center absolute inset-0"
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
              <div className="w-full h-full bg-background flex items-center justify-center">
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
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                <Favicon 
                  url={link.url}
                  size={16}
                  className="rounded-sm"
                />
              </div>
              <p 
                className="text-sm text-muted-foreground/80 truncate"
                style={{ fontFamily: 'Open Runde' }}
              >
                {getHostname(link.url)}
              </p>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <div className="text-muted-foreground/50 p-2" title="Drag to reorder">
              <GripVertical className="w-4 h-4" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-2 cursor-pointer"
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
      className="bg-muted rounded-xl hover:bg-accent transition-all group overflow-hidden cursor-grab"
      style={{ 
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="space-y-4">
        {/* OG Image Preview */}
        <div className="aspect-video bg-accent relative">
          {link.image_url ? (
            <>
              <Image 
                src={link.image_url} 
                alt={link.title || ''} 
                fill
                className="object-cover"
                unoptimized
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
                className="w-full h-full bg-background flex items-center justify-center absolute inset-0"
                style={{ display: 'none' }}
              >
                <Favicon
                  url={link.url}
                  size={48}
                  className="rounded-lg"
                  fallbackClassName="bg-muted/20 rounded-lg"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-background flex items-center justify-center">
              <Favicon
                url={link.url}
                size={48}
                className="rounded-lg"
                fallbackClassName="bg-muted/20 rounded-lg"
              />
            </div>
          )}

          {/* Actions overlay */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg cursor-pointer"
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4 space-y-2 flex-1 flex flex-col justify-end">
          <h3 
            className="font-semibold text-foreground text-base leading-tight line-clamp-2 flex-1"
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
