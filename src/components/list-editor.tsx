'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bars3Icon, TrashIcon, ArrowPathIcon, LinkIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { ListWithLinks, Link, LinkCreatePayload } from '@/types'
import { EmojiPicker } from './emoji-picker'
import { validateAndNormalizeUrl, getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { fetchOGDataClient } from '@/lib/og-client'
import { Button, Toast, LinkCardSkeleton } from '@/components/ui'

interface ListEditorProps {
  list: ListWithLinks
  onUpdateList?: (updates: Partial<ListWithLinks>) => void
  onAddLink?: (link: LinkCreatePayload) => void
  onRemoveLink?: (linkId: string) => void
  onReorderLinks?: (links: string[]) => void
}

// Ghost loading component for card view - uses LinkCardSkeleton for exact dimension matching
function GhostLinkItem() {
  return <LinkCardSkeleton />
}

export function ListEditor({
  list,
  onUpdateList,
  onAddLink,
  onRemoveLink,
  onReorderLinks
}: ListEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [title, setTitle] = useState(list.title || '') // Ensure title is never undefined
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [currentEmoji, setCurrentEmoji] = useState<string>(list.emoji || '🥨')
  const [isRefreshingOG, setIsRefreshingOG] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [loadingLinks, setLoadingLinks] = useState<string[]>([])
  const [optimisticList, setOptimisticList] = useState<ListWithLinks>(list)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemPosition, setDraggedItemPosition] = useState({ x: 0, y: 0, width: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [refreshingLinkIds, setRefreshingLinkIds] = useState<Record<string, boolean>>({})
  const dragStartPosition = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
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

  const handleTitleSave = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      // If title is empty, default to "Untitled List"
      setTitle('Untitled List')
      onUpdateList?.({ title: 'Untitled List' })
    } else if (trimmedTitle !== list.title) {
      onUpdateList?.({ title: trimmedTitle })
    }
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


  // Update emoji when list changes
  useEffect(() => {
    if (list.emoji) {
      setCurrentEmoji(list.emoji)
    }
  }, [list.emoji])


  // Custom drag handlers with visual feedback
  const handleMouseDown = useCallback((e: React.MouseEvent, linkId: string, index: number) => {
    e.preventDefault()
    e.stopPropagation()

    // Find the card wrapper element by data-link-id attribute
    const cardElement = document.querySelector(`[data-link-id="${linkId}"]`) as HTMLElement
    if (!cardElement) return

    const rect = cardElement.getBoundingClientRect()
    
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
  }, [isDragging, draggedItemId])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging || !optimisticList.links || !draggedItemId) {
      cleanup()
      return
    }

    const draggedIndex = optimisticList.links.findIndex(link => link.id === draggedItemId)

    if (draggedIndex !== -1 && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder the links
      const newLinks = [...optimisticList.links]
      const [draggedItem] = newLinks.splice(draggedIndex, 1)
      if (!draggedItem) {
        cleanup()
        return
      }
      newLinks.splice(dragOverIndex, 0, draggedItem)

      // Update local state immediately for visual feedback
      setOptimisticList(prev => ({ ...prev, links: newLinks }))

      // Update the order on the server
      onReorderLinks?.(newLinks.map(link => link.id))
    }

    cleanup()
  }, [isDragging, optimisticList.links, draggedItemId, dragOverIndex, onReorderLinks])
  
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
    if (!isDragging) {
      return undefined
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
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
      // Try modern Clipboard API with multiple format support
      if ('read' in navigator.clipboard) {
        try {
          const items = await navigator.clipboard.read()
          for (const item of items) {
            // Try text/uri-list first
            if (item.types.includes('text/uri-list')) {
              const blob = await item.getType('text/uri-list')
              const text = await blob.text()
              await processPastedText(text)
              return
            }
            // Fallback to text/html
            if (item.types.includes('text/html')) {
              const blob = await item.getType('text/html')
              const html = await blob.text()
              // Extract URLs from HTML
              const urlMatch = html.match(/href=["']([^"']+)["']/i)
              if (urlMatch && urlMatch[1]) {
                await processPastedText(urlMatch[1])
                return
              }
            }
            // Fallback to text/plain
            if (item.types.includes('text/plain')) {
              const blob = await item.getType('text/plain')
              const text = await blob.text()
              await processPastedText(text)
              return
            }
          }
        } catch (readError) {
          // Fall through to older API
        }
      }

      // Fallback to older API
      const text = await navigator.clipboard.readText()
      await processPastedText(text)
    } catch (error) {
      // Silently ignore clipboard errors - user can try Cmd+V
    }
  }

  // Handle mobile paste input
  const handleMobilePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    // Clear the input immediately
    if (mobilePasteInputRef.current) {
      mobilePasteInputRef.current.value = ''
    }

    // Try multiple clipboard formats for iOS Share Sheet compatibility
    let text = ''

    // Try text/uri-list first (standard format for URLs)
    text = e.clipboardData.getData('text/uri-list')

    // Fallback to text/html and extract URLs
    if (!text) {
      text = e.clipboardData.getData('text/html')
      if (text && text.includes('href=')) {
        const urlMatch = text.match(/href=["']([^"']+)["']/i)
        if (urlMatch && urlMatch[1]) {
          text = urlMatch[1]
        }
      }
    }

    // Fallback to plain text
    if (!text) {
      text = e.clipboardData.getData('text')
    }

    // Final fallback to text/plain
    if (!text) {
      text = e.clipboardData.getData('text/plain')
    }

    await processPastedText(text)
  }

  // Copy public list link
  const copyListLink = async () => {
    setShowMoreMenu(false)

    try {
      const url = `${window.location.origin}/${list.user?.username || 'list'}/${list.id}`
      await navigator.clipboard.writeText(url)
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 2000)
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
  
  const handleRefreshLink = async (link: Link) => {
    if (refreshingLinkIds[link.id]) {
      return
    }

    setRefreshingLinkIds(prev => ({ ...prev, [link.id]: true }))
    
    const originalLink = link
    
    try {
      const ogData = await fetchOGDataClient(link.url)
      const updatedLink: Link = {
        ...link,
        title: ogData.title || link.title || getHostname(link.url),
        description: ogData.description || link.description,
        image_url: ogData.image_url || link.image_url,
        favicon_url: ogData.favicon_url || link.favicon_url
      }

      setOptimisticList(prev => ({
        ...prev,
        links: prev.links?.map(l => l.id === link.id ? updatedLink : l) || []
      }))

      const response = await fetch(`/api/lists/${list.id}/links/${link.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updatedLink.title,
          description: updatedLink.description,
          image_url: updatedLink.image_url,
          favicon_url: updatedLink.favicon_url,
          url: updatedLink.url
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to refresh link')
      }
    } catch (error) {
      console.error('Failed to refresh link:', error)
      setOptimisticList(prev => ({
        ...prev,
        links: prev.links?.map(l => l.id === originalLink.id ? originalLink : l) || []
      }))
    } finally {
      setRefreshingLinkIds(prev => {
        const { [link.id]: _, ...rest } = prev
        return rest
      })
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
    console.log('Setting up paste listener, onAddLink exists:', !!onAddLink)

    const handleGlobalPaste = async (e: ClipboardEvent) => {
      console.log('Paste event fired', { onAddLink: !!onAddLink })

      // Check if the user is focused on an input, textarea, or contenteditable element
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true'

      console.log('Is input focused:', isInputFocused, 'Active element:', activeElement?.tagName)

      // If user is focused on an input, let the default paste behavior handle it
      if (isInputFocused) {
        return
      }

      // Prevent default paste behavior
      e.preventDefault()

      // Get clipboard text - try multiple formats for iOS compatibility
      let clipboardText = e.clipboardData?.getData('text/uri-list')
      if (!clipboardText) clipboardText = e.clipboardData?.getData('text/html')
      if (!clipboardText) clipboardText = e.clipboardData?.getData('text')
      if (!clipboardText) clipboardText = e.clipboardData?.getData('text/plain')

      console.log('Clipboard text:', clipboardText)
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

      console.log('Valid URLs:', validUrls)

      // If we have valid URLs, add them to the list
      if (validUrls.length > 0) {
        // Add ghost loading placeholders immediately
        setLoadingLinks(validUrls)

        // Add links sequentially
        for (let i = 0; i < validUrls.length; i++) {
          const url = validUrls[i]
          if (url) {
            console.log('Adding link:', url)
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
    console.log('Paste listener added')

    // Cleanup
    return () => {
      console.log('Removing paste listener')
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [list.id, onAddLink])

  // Removed view mode change handler - fixed to menu view only

  return (
    <div className="pb-18">
      {/* Copy Success Toast */}
      <Toast show={showCopySuccess} message="Link copied to clipboard!" variant="copied" />

      <div className="flex flex-col gap-4 md:gap-6">
        {/* Emoji */}
        <div className="w-12 h-12">
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(true)}
            className="text-5xl cursor-pointer"
            aria-label="Change list emoji"
          >
            <span aria-hidden="true">{currentEmoji}</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <textarea
            value={title}
            onChange={(e) => {
              const newValue = e.target.value.slice(0, 60)
              setTitle(newValue)
              // Auto-resize
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            placeholder="Untitled List"
            className="text-3xl font-medium text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground focus:bg-accent/50 rounded-md px-2 -mx-2 py-1 -my-1 transition-colors cursor-text leading-tight resize-none overflow-hidden w-full"
            maxLength={60}
            rows={1}
            ref={(el) => {
              if (el) {
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }
            }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
            <LinkIcon className="w-4 h-4" aria-hidden="true" />
            <span className="text-base">{optimisticList.links?.length || 0} links</span>
          </div>

          {/* Desktop: Paste button */}
          {!isMobile && (
            <Button
              type="button"
              onClick={pasteFromClipboard}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 text-base text-muted-foreground hover:text-foreground hover:border-muted-foreground flex-shrink-0"
            >
              <span>Paste links</span>
              <span className="text-sm">⌘V</span>
            </Button>
          )}

          {/* Mobile: Visible paste input */}
          {isMobile && (
            <input
              ref={mobilePasteInputRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="Paste links here…"
              aria-label="Paste links"
              onPaste={handleMobilePaste}
              className="flex-1 px-4 py-2 bg-background text-foreground border border-border rounded-md text-base placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors min-w-0"
            />
          )}
        </div>

        {/* Error message */}
        {linkError && (
          <div className="text-sm text-destructive">
            {linkError}
          </div>
        )}

        {/* Links List - Card View Only */}
        <div className="flex flex-col gap-6">
          {/* Ghost loading placeholders */}
          {loadingLinks.map((url, index) => (
            <GhostLinkItem key={`ghost-${url}-${index}`} />
          ))}

          {/* Draggable list */}
          <div className="relative draggable-list-container flex flex-col gap-6">
            {(optimisticList.links || []).map((link, index) => {
              // Show skeleton loader if link is being refreshed
              if (refreshingLinkIds[link.id]) {
                return <GhostLinkItem key={`refreshing-${link.id}`} />
              }

              return (
                <div
                  key={link.id}
                  data-link-id={link.id}
                  className={`
                    transition-all duration-300 ease-out select-none
                    ${draggedItemId === link.id ? 'opacity-30' : 'opacity-100'}
                    ${dragOverIndex === index && draggedItemId !== link.id ?
                      'transform translate-y-2 ring-1 ring-foreground rounded-md' : ''}
                  `}
                >
                  <LinkItem
                    link={link}
                    onRemove={() => handleDeleteLink(link.id)}
                    onRefresh={() => handleRefreshLink(link)}
                    isRefreshing={false}
                    onDragStart={(e) => handleMouseDown(e, link.id, index)}
                    onOpenLink={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                  />
                </div>
              )
            })}

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
                    onRemove={() => {}}
                    onRefresh={() => {}}
                    isRefreshing={false}
                  />
                </div>
              )
            })()}
          </div>
        </div>

        {(!optimisticList.links || optimisticList.links.length === 0) && loadingLinks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>
              Paste your first link to get started
            </p>
          </div>
        )}
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        triggerRef={emojiButtonRef}
        currentEmoji={currentEmoji}
        onSelectEmoji={(emoji) => {
          setCurrentEmoji(emoji)
          onUpdateList?.({
            emoji: emoji
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
  onRemove: () => void
  onRefresh: () => void
  isRefreshing: boolean
  onDragStart?: (e: React.MouseEvent) => void
  onOpenLink?: () => void
}

function LinkItem({
  link,
  onRemove,
  onRefresh,
  isRefreshing,
  onDragStart,
  onOpenLink
}: LinkItemProps) {
  // Card layout - full-width cards with OG images
  return (
    <div
      className="rounded-md group cursor-pointer flex flex-col gap-3 transition-transform"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      onClick={onOpenLink}
    >
      {/* OG Image Preview */}
      <div className="aspect-video bg-accent relative rounded-md overflow-hidden">
        {link.image_url ? (
          <>
            <Image
              src={link.image_url}
              alt={link.title || ''}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
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
              className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.05]"
              style={{ display: 'none' }}
            >
              <div className="text-neutral-300 dark:text-neutral-600">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                  style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(91%) contrast(89%)' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.05]">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={48}
              height={48}
              className="w-12 h-12"
              style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(91%) contrast(89%)' }}
            />
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-muted rounded-md px-2 py-2 flex items-center gap-4">
            <div
              className="flex items-center justify-center text-muted-foreground cursor-grab hover:text-foreground transition-colors"
              role="button"
              aria-label="Drag to reorder"
              tabIndex={0}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onDragStart?.(e)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Bars3Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label="Refresh link preview"
              disabled={isRefreshing}
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label="Delete link"
            >
              <TrashIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Site Info - Separated from OG Image */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
            <Favicon
              url={link.url}
              size={16}
              className="rounded-sm"
            />
          </div>
          <h3
            className="font-medium text-foreground text-base leading-tight truncate"
          >
            {link.title || getHostname(link.url)}
          </h3>
        </div>
        <p
          className="text-sm text-muted-foreground flex-shrink-0"
        >
          {getHostname(link.url)}
        </p>
      </div>
    </div>
  )
}
