'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Copy, ExternalLink, Eye, MoreHorizontal } from 'lucide-react'
import { TopBar, BrandMark, PageActions, AppContainer } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { ListEditor } from '@/components/list-editor'
import { PublicListView } from '@/components/public-list-view'
import { CreateList } from '@/components/create-list'
import { ListWithLinks, CreateListForm, LinkInsert } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { validateUsername } from '@/lib/username-utils'

export default function UserListPage() {
  const params = useParams()
  const username = params?.username as string
  const listId = params?.listId as string
  const [currentList, setCurrentList] = useState<ListWithLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateList, setShowCreateList] = useState(false)
  const [isListPublic, setIsListPublic] = useState(true)
  const [isListPaid, setIsListPaid] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const isAuthenticated = !!user
  const currentUserId = user?.id || null
  const forcePublicView = searchParams.get('view') === 'public'

  // Fetch list data from API using username and listId
  useEffect(() => {
    if (!username || !listId) return

    // Validate username format first
    const validation = validateUsername(username)
    if (!validation.valid) {
      setError('Invalid username format')
      setLoading(false)
      return
    }

    const fetchList = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use new API endpoint that resolves by username and listId
        const response = await fetch(`/api/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(listId)}`)
        const data = await response.json()
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('List not found')
          } else if (response.status === 403) {
            setError('This list is private')
          } else {
            setError(data.error || 'Failed to load list')
          }
          return
        }
        
        setCurrentList(data.data)
      } catch (err) {
        console.error('Error fetching list:', err)
        setError('Failed to load list')
      } finally {
        setLoading(false)
      }
    }
    
    fetchList()
  }, [username, listId])
  
  // Determine if user can edit this list
  const canEdit = isAuthenticated && currentUserId === currentList?.user_id
  
  // Determine if list should be visible
  const canView = currentList?.is_public || canEdit

  const handleCreateList = async (formData: CreateListForm) => {
    // Navigate to dashboard to create new lists
    router.push('/dashboard')
  }

  const handleUpdateList = async (updates: Partial<ListWithLinks>) => {
    if (!currentList) return
    
    try {
      const response = await fetch(`/api/lists/${currentList.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update list (${response.status})`)
      }
      
      const data = await response.json()
      
      // If the API returned updated data, use it
      if (data.data) {
        setCurrentList(data.data)
      } else if (data.success) {
        // Update succeeded but no data returned, just apply the updates locally
        setCurrentList(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (error) {
      console.error('Error updating list:', error)
      // Could add toast notification here
    }
  }

  const handleAddLink = async (linkData: LinkInsert) => {
    if (!currentList) return
    
    try {
      const response = await fetch(`/api/lists/${currentList.id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add link')
      }
      
      const data = await response.json()
      
      // Re-fetch the list to get correct positions for all links
      const listResponse = await fetch(`/api/users/${username}/lists/${listId}`, {
        cache: 'no-store'
      })
      
      if (listResponse.ok) {
        const listData = await listResponse.json()
        setCurrentList(listData.data)
      }
    } catch (error) {
      console.error('Error adding link:', error)
      // Could add toast notification here
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    if (!currentList) return
    
    try {
      const response = await fetch(`/api/lists/${currentList.id}/links/${linkId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to remove link (${response.status})`)
      }
      
      setCurrentList(prev => prev ? {
        ...prev,
        links: prev.links?.filter(link => link.id !== linkId) || []
      } : null)
    } catch (error) {
      console.error('Error removing link:', error)
      // Could add toast notification here
    }
  }

  const handleReorderLinks = async (linkIds: string[]) => {
    if (!currentList) return
    
    try {
      // Update local state immediately for better UX
      const linkMap = new Map(currentList.links?.map(link => [link.id, link]) || [])
      const reorderedLinks = linkIds.map(id => linkMap.get(id)).filter(Boolean) as typeof currentList.links
      
      setCurrentList(prev => prev ? {
        ...prev,
        links: reorderedLinks.map((link, index) => ({
          ...link,
          position: index
        }))
      } : null)
      
      // Then sync with server
      const response = await fetch(`/api/lists/${currentList.id}/links`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkIds }),
      })
      
      if (!response.ok) {
        // Revert on failure
        setCurrentList(currentList)
        throw new Error('Failed to reorder links')
      }
    } catch (error) {
      console.error('Error reordering links:', error)
      // Could add toast notification here
    }
  }

  const handleLogout = async () => {
    // TODO: Implement proper logout functionality
    router.push('/auth/sign-in')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading list...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !currentList) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {error === 'List not found' ? 'List not found' : 'Unable to load list'}
          </h1>
          <p className="text-muted-foreground">
            {error === 'This list is private'
              ? 'This list is private and you don\'t have access to it.'
              : error === 'List not found'
              ? 'The list you\'re looking for doesn\'t exist or has been deleted.'
              : 'Something went wrong while loading this list. Please try again.'
            }
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/${username}`)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
            >
              Back to Profile
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show public view if forced via query param, or for non-authenticated users/non-owners
  if (forcePublicView || !canEdit) {
    return <PublicListView list={currentList} />
  }

  // Show editable view for authenticated owners (when not forced to public view)
  return (
    <div className="min-h-screen bg-background">
      <TopBar variant="app">
        <TopBar.Left>
          <BrandMark variant="app" href="/dashboard" />
        </TopBar.Left>

        <TopBar.Right>
          <button
            onClick={() => {
              const url = `${window.location.origin}/${username}/${currentList.public_id || listId}?view=public`
              window.open(url, '_blank')
            }}
            className="w-icon-button h-icon-button rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors inline-flex items-center justify-center"
            aria-label="Preview public view"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/${username}/${currentList.public_id || listId}`
              await navigator.clipboard.writeText(url)
            }}
            className="w-icon-button h-icon-button rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors inline-flex items-center justify-center"
            aria-label="Copy link"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              // TODO: Implement menu dropdown
              console.log('Open menu')
            }}
            className="w-icon-button h-icon-button rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors inline-flex items-center justify-center"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </TopBar.Right>
      </TopBar>

      {/* Main Content */}
      <AppContainer variant="app">
        <div className="py-8">
        <ListEditor
          list={currentList}
          onUpdateList={handleUpdateList}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
          onReorderLinks={handleReorderLinks}
        />
        </div>
      </AppContainer>

      {showCreateList && (
        <CreateList
          onCreateList={handleCreateList}
          onClose={() => setShowCreateList(false)}
        />
      )}
    </div>
  )
}