'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, ExternalLink, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { TopBar, BrandMark, PageActions, AppContainer } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { ListWithLinks, CreateListForm, LinkCreatePayload } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { validateUsername } from '@/lib/username-utils'
import { LoadingState } from '@/components/loading-state'

// Lazy load heavy components for better performance
const ListEditor = dynamic(() => import('@/components/list-editor').then(mod => ({ default: mod.ListEditor })), {
  loading: () => <LoadingState message="Loading editor..." />,
  ssr: false
})

const PublicListView = dynamic(() => import('@/components/public-list-view').then(mod => ({ default: mod.PublicListView })), {
  loading: () => <LoadingState message="Loading list..." />,
  ssr: false
})

const CreateList = dynamic(() => import('@/components/create-list').then(mod => ({ default: mod.CreateList })), {
  loading: () => <LoadingState message="Loading form..." />,
  ssr: false
})

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
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const isAuthenticated = !!user
  const currentUserId = user?.id || null
  const forceEditView = searchParams?.get('view') === 'edit'

  // Get query string once to avoid recreating on every render
  const queryString = searchParams?.toString() ?? ''

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

        const encodedUsername = encodeURIComponent(username)
        const encodedListId = encodeURIComponent(listId)

        // Use new API endpoint that resolves by username and listId
        const response = await fetch(`/api/users/${encodedUsername}/lists/${encodedListId}`)

        if (response.ok) {
          const data = await response.json()
          setCurrentList(data.data)
          return
        }

        if (response.status === 404) {
          // Fall back to the generic list endpoint which can resolve by id or public_id
          const fallbackResponse = await fetch(`/api/lists/${encodedListId}`, { cache: 'no-store' })

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const fallbackList = fallbackData.data

            setCurrentList(fallbackList)
            setError(null)

            // Redirect to the canonical username route if this slug belongs to someone else
            if (fallbackList?.user?.username && fallbackList.user.username !== username) {
              router.replace(`/${fallbackList.user.username}/${listId}${queryString ? `?${queryString}` : ''}`)
            }
            return
          }

          setError('List not found')
          return
        }

        if (response.status === 403) {
          setError('This list is private')
          return
        }

        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to load list')
      } catch (err) {
        console.error('Error fetching list:', err)
        setError('Failed to load list')
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [username, listId, router, queryString])
  
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

  const handleAddLink = async (linkData: LinkCreatePayload) => {
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

  const handleDelete = async () => {
    if (!currentList) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/lists/${currentList.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete list')
      }

      // Redirect to dashboard and refresh to invalidate cache
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error deleting list:', error)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading list..." />
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
            <Button
              onClick={() => router.push(`/${username}`)}
              variant="secondary"
              className="px-4 py-2 font-semibold"
            >
              Back to Profile
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="px-4 py-2 font-semibold"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show edit view only if explicitly requested via query param AND user is the owner
  if (forceEditView && canEdit) {
    return (
    <div className="min-h-screen bg-background">
      {/* Copy Success Toast */}
      <AnimatePresence>
        {showCopySuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="font-medium">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <TopBar variant="app">
        <TopBar.Left>
          <BrandMark variant="app" href="/dashboard" />
        </TopBar.Left>

        <TopBar.Right>
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="muted"
            size="icon"
            aria-label="Delete list"
            className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => {
              router.push(`/${username}/${currentList.public_id || listId}`)
            }}
            variant="muted"
            size="icon"
            aria-label="Preview public view"
            className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 dark:hover:text-green-300"
          >
            <Check className="w-5 h-5" />
          </Button>
          <Button
            onClick={async () => {
              const url = `${window.location.origin}/${username}/${currentList.public_id || listId}`
              await navigator.clipboard.writeText(url)
              setShowCopySuccess(true)
              setTimeout(() => setShowCopySuccess(false), 2000)
            }}
            variant="muted"
            size="icon"
            aria-label="Copy link"
          >
            <Copy className="w-5 h-5" />
          </Button>
          <ThemeToggle />
        </TopBar.Right>
      </TopBar>

      {/* Main Content */}
      <AppContainer variant="app">
        <div className="pt-8 pb-16">
          <div className="max-w-[560px] w-full mx-auto">
            <ListEditor
              list={currentList}
              onUpdateList={handleUpdateList}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onReorderLinks={handleReorderLinks}
            />
          </div>
        </div>
      </AppContainer>

      {showCreateList && (
        <CreateList
          onCreateList={handleCreateList}
          onClose={() => setShowCreateList(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background border border-border rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2">Delete List?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete &quot;{currentList.title || 'Untitled List'}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    )
  }

  // Default: show public view for everyone
  return <PublicListView list={currentList} />
}
