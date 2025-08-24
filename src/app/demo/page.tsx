'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ListEditor } from '@/components/list-editor'
import { PublicListView } from '@/components/public-list-view'
import { CreateList } from '@/components/create-list'
import { ListWithLinks, CreateListForm, LinkInsert } from '@/types'
import { getRandomEmoji } from '@/lib/emoji'
import { getHostname, getFaviconUrl } from '@/lib/url-utils'
import { useLists } from '@/hooks/useLists'
import { useAuth } from '@/hooks/useAuth'
import { Plus, ArrowLeft, Copy, Eye } from 'lucide-react'

function DemoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const listId = searchParams.get('list')
  
  const [showCreateList, setShowCreateList] = useState(false)
  
  // Use authentication hook
  const { user, loading: authLoading, signOut } = useAuth()
  
  // Use the hybrid database useLists hook
  const { 
    lists, 
    loading: listsLoading, 
    createList,
    updateList,
    addLinkToList,
    removeLinkFromList
  } = useLists()

  // Find current list from lists array
  const currentList = listId ? lists.find(list => list.id === listId) : null

  // Handle list creation from the create list form
  const handleCreateList = async (formData: CreateListForm) => {
    try {
      const newList = await createList(formData)
      router.push(`/demo?list=${newList.id}`)
      setShowCreateList(false)
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  // Handle list updates
  const handleUpdateList = async (updates: Partial<ListWithLinks>) => {
    if (!currentList) return
    await updateList(currentList.id, updates)
  }

  // Handle adding links to current list
  const handleAddLink = async (linkData: LinkInsert) => {
    if (!currentList) return
    await addLinkToList(currentList.id, {
      url: linkData.url,
      title: linkData.title
    })
  }

  // Handle removing links from current list
  const handleRemoveLink = async (linkId: string) => {
    if (!currentList) return
    await removeLinkFromList(currentList.id, linkId)
  }

  // Determine if user can edit this list
  const isAuthenticated = !!user && !authLoading
  const canEdit = isAuthenticated && currentList?.user?.id === user?.id

  // Handle copy URL
  const handleCopyUrl = async () => {
    try {
      const listUrl = `${window.location.origin}/demo?list=${currentList?.id}`
      await navigator.clipboard.writeText(listUrl)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  // Handle view public version
  const handleViewPublic = () => {
    if (currentList) {
      const publicUrl = `${window.location.origin}/demo?list=${currentList.id}`
      window.open(publicUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Show loading state
  if (authLoading || listsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle case where no list is specified
  if (!listId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            📝
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Open Runde' }}>
              No List Selected
            </h1>
            <p className="text-muted-foreground">
              Choose a list from your dashboard or create a new one to get started.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              style={{ fontFamily: 'Open Runde' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            {isAuthenticated && (
              <div>
                <button
                  onClick={() => setShowCreateList(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-semibold"
                  style={{ fontFamily: 'Open Runde' }}
                >
                  <Plus className="w-4 h-4" />
                  Create New List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Handle case where list doesn't exist
  if (!currentList) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            ❓
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Open Runde' }}>
              List Not Found
            </h1>
            <p className="text-muted-foreground">
              The list you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            style={{ fontFamily: 'Open Runde' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Show the appropriate view based on authentication and ownership
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {canEdit ? (
              // Editing mode header - Back button on left
              <>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleViewPublic}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    View
                  </button>
                </div>
              </>
            ) : (
              // Public mode header - Logo on left
              <>
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-3">
                    <Image
                      src="/images/logo.svg"
                      alt="Snack"
                      width={40}
                      height={40}
                      className="w-10 h-10"
                    />
                    <h1 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Open Runde' }}
                    >
                      Snack
                    </h1>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    Dashboard
                  </Link>
                  {isAuthenticated ? (
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                      style={{ fontFamily: 'Open Runde' }}
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      href="/auth/sign-in"
                      className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      style={{ fontFamily: 'Open Runde' }}
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {canEdit ? (
          // Editing mode for list owner
          <ListEditor
            list={currentList}
            onUpdateList={handleUpdateList}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
          />
        ) : (
          // Public view mode for non-owners or non-authenticated users
          <PublicListView list={currentList} />
        )}
      </div>

      {/* Create List Modal */}
      {showCreateList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CreateList
              onCreateList={handleCreateList}
              onClose={() => setShowCreateList(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DemoPageContent />
    </Suspense>
  )
}