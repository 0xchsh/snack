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
      <div className="bg-neutral-100 rounded-xl p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-neutral-200 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'rows') {
    return (
      <div className="bg-neutral-100 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-11 rounded-xl bg-neutral-200 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div className="bg-neutral-100 rounded-xl animate-pulse overflow-hidden">
      <div className="aspect-video bg-neutral-200"></div>
      <div className="px-4 pb-4 pt-4 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-neutral-200 flex-shrink-0"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
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
  const [isRefreshingOG, setIsRefreshingOG] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [loadingLinks, setLoadingLinks] = useState<string[]>([])
  const [optimisticList, setOptimisticList] = useState<ListWithLinks>(list)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemPosition, setDraggedItemPosition] = useState({ x: 0, y: 0 })
  const dragStartPosition = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
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
      y: e.clientY - dragOffset.current.y
    })
    
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedItemId) return
    
    // Update drag preview position
    setDraggedItemPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    })
    
    // Find which item we're hovering over based on current view mode
    let containerSelector: string
    if (viewMode === 'grid') {
      containerSelector = '#drag-grid-container'
    } else {
      containerSelector = '.draggable-list-container'
    }
    
    const container = document.querySelector(containerSelector)
    if (!container) return
    
    const items = container.children
    let newHoverIndex = null
    
    // Check each item to see if we're hovering over it
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement
      // Skip the drag preview element
      if (item.classList.contains('fixed')) continue
      
      const rect = item.getBoundingClientRect()
      
      if (viewMode === 'grid') {
        // Grid: check if mouse is within the grid cell bounds
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          newHoverIndex = i
          break
        }
      } else {
        // Linear layouts: check if mouse is in the vertical range
        const midY = rect.top + rect.height / 2
        if (e.clientY <= midY) {
          newHoverIndex = i
          break
        }
      }
    }
    
    // For linear layouts, if we're past all items, set to last position
    if (newHoverIndex === null && viewMode !== 'grid' && items.length > 0) {
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
                onClick={linkInput.trim() ? handleAddLink : pasteFromClipboard}
                className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors flex items-center gap-2"
              >
                {linkInput.trim() ? (
                  <>
                    <span className="font-medium">Add</span>
                    <span className="text-xs opacity-70">⌘⏎</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">Paste</span>
                    <span className="text-xs opacity-70">⌘V</span>
                  </>
                )}
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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Button */}
              <button
                onClick={() => window.open(`/${list.user?.username || 'list'}/${list.public_id || list.id}?view=public`, '_blank')}
                className="w-10 h-10 rounded-md flex items-center justify-center transition-colors bg-white text-foreground hover:bg-blue-50 hover:text-blue-600"
                title="View public list"
              >
                <Eye className="w-5 h-5" />
              </button>
              
              {/* More Options Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-10 h-10 rounded-md flex items-center justify-center transition-colors bg-white text-foreground hover:bg-white"
                  title="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              
              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  <button
                    onClick={pasteFromClipboard}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white transition-colors"
                  >
                    <Clipboard className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Paste clipboard</span>
                    <span className="text-xs text-muted-foreground">⌘V</span>
                  </button>
                  
                  <button
                    onClick={refreshOGData}
                    disabled={isRefreshingOG}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshingOG ? 'animate-spin' : ''}`} />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>
                      {isRefreshingOG ? 'Refreshing...' : 'Refresh images'}
                    </span>
                  </button>
                  
                  <button
                    onClick={exportAsCSV}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Export to .csv</span>
                  </button>
                  
                  <button
                    onClick={copyListLink}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1" style={{ fontFamily: 'Open Runde' }}>Copy link</span>
                  </button>
                  
                  <div className="my-2 border-t border-neutral-200" />
                  
                  <button
                    onClick={deleteList}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white transition-colors text-destructive"
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
      </div>

      {/* Links List */}
      {viewMode === 'grid' ? (
        <div className="space-y-6">
          {/* Ghost loading placeholders */}
          {loadingLinks.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {loadingLinks.map((url, index) => (
                <GhostLinkItem key={`ghost-${url}-${index}`} viewMode={viewMode} />
              ))}
            </div>
          )}
          {/* Custom Draggable CSS Grid Layout */}
          <div 
            className="grid grid-cols-3 gap-6 w-full relative"
            id="drag-grid-container"
          >
            {(optimisticList.links || []).map((link, index) => (
              <div
                key={link.id}
                onMouseDown={(e) => handleMouseDown(e, link.id, index)}
                className={`
                  transition-all duration-300 ease-out cursor-grab select-none
                  ${draggedItemId === link.id ? 'opacity-30' : 'opacity-100'}
                  ${dragOverIndex === index && draggedItemId !== link.id ? 
                    'transform scale-105 ring-2 ring-offset-2 rounded-xl' : ''}
                `}
              >
                <LinkItem
                  link={link}
                  viewMode={viewMode}
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
                    width: '320px',
                    transform: 'rotate(2deg) scale(1.03)',
                    filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.25))',
                    opacity: 0.95
                  }}
                >
                  <LinkItem
                    link={draggedLink}
                    viewMode={viewMode}
                    onRemove={() => {}}
                  />
                </div>
              )
            })()}
          </div>
        </div>
      ) : (
        <div className={viewMode === 'rows' ? 'space-y-6' : 'space-y-3'}>
          {/* Ghost loading placeholders */}
          {loadingLinks.map((url, index) => (
            <GhostLinkItem key={`ghost-${url}-${index}`} viewMode={viewMode} />
          ))}
          {/* Draggable linear layout for menu and rows modes */}
          <div className="relative draggable-list-container">
            {(optimisticList.links || []).map((link, index) => (
              <div 
                key={link.id}
                onMouseDown={(e) => handleMouseDown(e, link.id, index)}
                className={`
                  ${viewMode === 'rows' ? 'mb-6 last:mb-0' : 'mb-3 last:mb-0'}
                  transition-all duration-300 ease-out cursor-grab select-none
                  ${draggedItemId === link.id ? 'opacity-30' : 'opacity-100'}
                  ${dragOverIndex === index && draggedItemId !== link.id ? 
                    `transform translate-y-2 ring-2 ring-offset-1 ${
                      viewMode === 'rows' ? 'rounded-2xl' : 'rounded-xl'
                    }` : ''}
                `}
              >
                <LinkItem
                  link={link}
                  viewMode={viewMode}
                  onRemove={() => handleDeleteLink(link.id)}
                />
              </div>
            ))}
            
            {/* Floating Drag Preview for linear layouts */}
            {isDragging && draggedItemId && viewMode !== 'grid' && (() => {
              const draggedLink = optimisticList.links?.find(l => l.id === draggedItemId)
              if (!draggedLink) return null
              
              const width = viewMode === 'rows' ? '600px' : '400px'
              
              return (
                <div
                  className="fixed z-50 pointer-events-none"
                  style={{
                    left: `${draggedItemPosition.x}px`,
                    top: `${draggedItemPosition.y}px`,
                    width: width,
                    transform: 'rotate(1deg) scale(1.02)',
                    filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.2))',
                    opacity: 0.95
                  }}
                >
                  <LinkItem
                    link={draggedLink}
                    viewMode={viewMode}
                    onRemove={() => {}}
                  />
                </div>
              )
            })()}
          </div>
        </div>
      )}
      
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
    // Compact rows - smallest layout
    return (
      <div 
        className="bg-neutral-100 rounded-xl p-3 hover:bg-neutral-200 transition-all group cursor-grab relative"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformOrigin: 'center',
          willChange: 'transform'
        }}
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
            <div className="text-muted-foreground/50 p-1" title="Drag to reorder">
              <GripVertical className="w-3 h-3" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
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
        className="bg-neutral-100 rounded-2xl p-4 hover:bg-neutral-200 transition-all group cursor-grab relative"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformOrigin: 'center',
          willChange: 'transform'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-[100px] h-14 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0 relative">
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
                  className="w-full h-full bg-neutral-50 flex items-center justify-center absolute inset-0"
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
              <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
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
      className="bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all group overflow-hidden cursor-grab"
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
                className="w-full h-full bg-neutral-50 flex items-center justify-center absolute inset-0"
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
            <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
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
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg cursor-pointer"
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

