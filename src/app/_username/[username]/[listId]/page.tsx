'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ListEditor } from '@/components/list-editor'
import { PublicListView } from '@/components/public-list-view'
import { CreateList } from '@/components/create-list'
import { ListWithLinks, CreateListForm, LinkInsert } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { validateUsername } from '@/lib/username-utils'

interface UserListPageProps {
  params: Promise<{
    username: string
    listId: string
  }>
}

export default function UserListPage({ params }: UserListPageProps) {
  const { username, listId } = useParams() as { username: string; listId: string }
  const [currentList, setCurrentList] = useState<ListWithLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateList, setShowCreateList] = useState(false)
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
        throw new Error('Failed to update list')
      }
      
      const data = await response.json()
      setCurrentList(data.data)
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
      setCurrentList(prev => prev ? {
        ...prev,
        links: [...(prev.links || []), data.data]
      } : null)
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
        throw new Error('Failed to remove link')
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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {user ? (
                  <Link href="/dashboard" className="flex items-center gap-3">
                    <Image
                      src="/images/logo.svg"
                      alt="Snack"
                      width={32}
                      height={32}
                      className="w-8 h-8 cursor-pointer"
                    />
                    <h1 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Open Runde' }}
                    >
                      Snack
                    </h1>
                  </Link>
                ) : (
                  <>
                    <Image
                      src="/images/logo.svg"
                      alt="Snack"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                    <h1 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Open Runde' }}
                    >
                      Snack
                    </h1>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/${username}`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                style={{ fontFamily: 'Open Runde' }}
              >
                Back to Profile
              </Link>
              {user && (
                <>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowCreateList(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    <Plus className="w-4 h-4" />
                    New List
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <ListEditor
          list={currentList}
          onUpdateList={handleUpdateList}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
          onReorderLinks={handleReorderLinks}
        />
      </div>

      {showCreateList && (
        <CreateList
          onCreateList={handleCreateList}
          onClose={() => setShowCreateList(false)}
        />
      )}
    </div>
  )
}