'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, DocumentDuplicateIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui'
import { ListEditor } from '@/components/list-editor'
import { PublicListView } from '@/components/public-list-view'
import { CreateList } from '@/components/create-list'
import { ListWithLinks, CreateListForm, LinkCreatePayload } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/loading-state'
import {
  useUpdateListMutation,
  useAddLinkMutation,
  useDeleteLinkMutation,
  useReorderLinksMutation,
} from '@/hooks/queries'

interface ListPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ListPage({ params }: ListPageProps) {
  const { id } = use(params)
  const [currentList, setCurrentList] = useState<ListWithLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateList, setShowCreateList] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // TanStack Query mutations
  const updateListMutation = useUpdateListMutation()
  const addLinkMutation = useAddLinkMutation()
  const deleteLinkMutation = useDeleteLinkMutation()
  const reorderLinksMutation = useReorderLinksMutation()

  const isAuthenticated = !!user
  const currentUserId = user?.id || null
  const forcePublicView = searchParams.get('view') === 'public'

  // Fetch list data from API
  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/lists/${id}`)
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
        
        // Redirect to the new URL structure if we have username
        if (data.data?.user?.username) {
          const queryParams = searchParams.toString()
          const newUrl = `/${data.data.user.username}/${id}${queryParams ? `?${queryParams}` : ''}`
          router.replace(newUrl)
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
    
    if (id) {
      fetchList()
    }
  }, [id])
  
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
      const updatedList = await updateListMutation.mutateAsync({
        listId: currentList.id,
        updates,
      })
      setCurrentList(updatedList)
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const handleAddLink = async (linkData: LinkCreatePayload) => {
    if (!currentList) return

    try {
      const updatedList = await addLinkMutation.mutateAsync({
        listId: currentList.id,
        link: linkData,
      })
      setCurrentList(updatedList)
    } catch (error) {
      console.error('Error adding link:', error)
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    if (!currentList) return

    // Optimistic update
    setCurrentList(prev =>
      prev
        ? { ...prev, links: prev.links?.filter(link => link.id !== linkId) || [] }
        : null
    )

    try {
      await deleteLinkMutation.mutateAsync({
        listId: currentList.id,
        linkId,
      })
    } catch (error) {
      console.error('Error removing link:', error)
      // Rollback by refetching
      const response = await fetch(`/api/lists/${currentList.id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentList(data.data)
      }
    }
  }

  const handleReorderLinks = async (linkIds: string[]) => {
    if (!currentList) return

    // Optimistic update
    const linkMap = new Map(currentList.links?.map(link => [link.id, link]) || [])
    const reorderedLinks = linkIds
      .map(id => linkMap.get(id))
      .filter(Boolean) as typeof currentList.links

    setCurrentList(prev =>
      prev
        ? {
            ...prev,
            links: reorderedLinks.map((link, index) => ({
              ...link,
              position: index,
            })),
          }
        : null
    )

    try {
      await reorderLinksMutation.mutateAsync({
        listId: currentList.id,
        linkIds,
      })
    } catch (error) {
      console.error('Error reordering links:', error)
      // Rollback by refetching
      const response = await fetch(`/api/lists/${currentList.id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentList(data.data)
      }
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState message="Loading list..." />
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
          <Button
            onClick={() => router.push('/')}
            className="px-4 py-2 font-semibold"
          >
            Go Home
          </Button>
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
            {/* Back button */}
            <Link 
              href="/dashboard" 
              className="navigation-button flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors bg-neutral-100 rounded-full no-underline"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Link>
            
            {/* Copy and View buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/${user?.username || 'list'}/${currentList.id}?view=public`
                  await navigator.clipboard.writeText(url)
                }}
                variant="muted"
                className="gap-2 rounded-full bg-neutral-100 text-muted-foreground hover:text-foreground"
              >
                Copy
                <DocumentDuplicateIcon className="w-4 h-4" />
              </Button>
              <Link
                href={`/${user?.username || 'list'}/${currentList.public_id || currentList.id}?view=public`}
                target="_blank"
                rel="noopener noreferrer"
                className="navigation-button flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors bg-neutral-100 rounded-full no-underline"
              >
                View
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
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

      {showCreateList && (
        <CreateList
          onCreateList={handleCreateList}
          onClose={() => setShowCreateList(false)}
        />
      )}
    </div>
  )
}
