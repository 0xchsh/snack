'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DocumentDuplicateIcon, PlusIcon, EllipsisHorizontalIcon, SunIcon, MoonIcon, TrashIcon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { Button, Toast, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui'
import { AddLinkModal } from '@/components/add-link-modal'
import { TopBar, BrandMark, AppContainer } from '@/components/primitives'
import { useTheme } from '@/components/theme-provider'
import { ListWithLinks, LinkCreatePayload } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { validateUsername } from '@/lib/username-utils'
import {
  usePublicListQuery,
  useUpdateListMutation,
  useDeleteListMutation,
  useAddLinkMutation,
  useDeleteLinkMutation,
  useReorderLinksMutation,
  listKeys,
} from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'

// Skeleton component for list page
function ListPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-12 max-w-[560px] px-4 md:px-0">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="h-6 bg-muted rounded w-48" />
        </div>
        {/* Links skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lazy load heavy components for better performance
const ListEditor = dynamic(() => import('@/components/list-editor').then(mod => ({ default: mod.ListEditor })), {
  loading: () => <ListPageSkeleton />,
  ssr: false
})

const PublicListView = dynamic(() => import('@/components/public-list-view').then(mod => ({ default: mod.PublicListView })), {
  loading: () => <ListPageSkeleton />,
  ssr: false
})

export default function UserListPage() {
  const params = useParams()
  const username = params?.username as string
  const listId = params?.listId as string
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  // Validate username format
  useEffect(() => {
    if (username) {
      const validation = validateUsername(username)
      if (!validation.valid) {
        setValidationError('Invalid username format')
      }
    }
  }, [username])

  // TanStack Query - fetches with placeholderData from cache for instant navigation
  const {
    data: currentList,
    isLoading,
    error: queryError,
    isPlaceholderData,
  } = usePublicListQuery(
    validationError ? undefined : username,
    validationError ? undefined : listId
  )

  // TanStack Query mutations
  const updateListMutation = useUpdateListMutation()
  const deleteListMutation = useDeleteListMutation()
  const addLinkMutation = useAddLinkMutation()
  const deleteLinkMutation = useDeleteLinkMutation()
  const reorderLinksMutation = useReorderLinksMutation()

  const isAuthenticated = !!user
  const currentUserId = user?.id || null

  // Handle redirect for canonical username
  useEffect(() => {
    if (currentList?.user?.username && currentList.user.username !== username) {
      router.replace(`/${currentList.user.username}/${listId}`)
    }
  }, [currentList, username, listId, router])

  // Determine if user can edit this list
  const canEdit = isAuthenticated && currentUserId === currentList?.user_id

  // Determine if list should be visible
  const canView = currentList?.is_public || canEdit

  const handleUpdateList = async (updates: Partial<ListWithLinks>) => {
    if (!currentList) return

    try {
      await updateListMutation.mutateAsync({
        listId: currentList.id,
        updates,
      })
      // Invalidate to refetch with updated data
      queryClient.invalidateQueries({ queryKey: listKeys.publicList(username, listId) })
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const handleAddLink = async (linkData: LinkCreatePayload) => {
    if (!currentList) return

    try {
      await addLinkMutation.mutateAsync({
        listId: currentList.id,
        link: linkData,
      })
      // Invalidate to refetch with new link
      queryClient.invalidateQueries({ queryKey: listKeys.publicList(username, listId) })
    } catch (error) {
      console.error('Error adding link:', error)
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    if (!currentList) return

    try {
      await deleteLinkMutation.mutateAsync({
        listId: currentList.id,
        linkId,
      })
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: listKeys.publicList(username, listId) })
    } catch (error) {
      console.error('Error removing link:', error)
    }
  }

  const handleReorderLinks = async (linkIds: string[]) => {
    if (!currentList) return

    try {
      await reorderLinksMutation.mutateAsync({
        listId: currentList.id,
        linkIds,
      })
    } catch (error) {
      console.error('Error reordering links:', error)
    }
  }

  const handleDelete = async () => {
    if (!currentList) return

    try {
      await deleteListMutation.mutateAsync(currentList.id)
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting list:', error)
      setShowDeleteModal(false)
    }
  }

  // Derive error message
  const error = validationError || (queryError instanceof Error ? queryError.message : null)

  // Show skeleton while loading (but not if we have placeholder data!)
  if (isLoading && !currentList) {
    return <ListPageSkeleton />
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

  // Owners see the unified edit view
  if (canEdit) {
    return (
      <div className="min-h-screen bg-background">
        {/* Copy Success Toast */}
        <Toast show={showCopySuccess} message="Link copied to clipboard!" variant="copied" />

        <TopBar variant="app">
          <TopBar.Left>
            <BrandMark variant="app" href="/dashboard" />
          </TopBar.Left>

          <TopBar.Right>
            <Button
              onClick={() => setShowAddLinkModal(true)}
              variant="muted"
              size="icon"
              aria-label="Add link"
            >
              <PlusIcon className="w-4 h-4" />
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
              <DocumentDuplicateIcon className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="muted" size="icon" aria-label="More options">
                  <EllipsisHorizontalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? (
                    <>
                      <MoonIcon className="w-4 h-4" />
                      Dark mode
                    </>
                  ) : (
                    <>
                      <SunIcon className="w-4 h-4" />
                      Light mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteModal(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Add Link Modal */}
        <AddLinkModal
          isOpen={showAddLinkModal}
          onClose={() => setShowAddLinkModal(false)}
          onAddLink={async (url) => {
            await handleAddLink({ url, title: url })
          }}
        />

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
                  disabled={deleteListMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteListMutation.isPending}
                  className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive-hover rounded-md transition-colors disabled:opacity-50"
                >
                  {deleteListMutation.isPending ? 'Deleting...' : 'Delete'}
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
