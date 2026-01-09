'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, Star, Link2, List, Plus } from 'lucide-react'

import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useListsQuery,
  useCreateEmptyListMutation,
  useSavedListsQuery,
  useAnalyticsStatsQuery,
} from '@/hooks/queries'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'
import { LoadingState } from '@/components/loading-state'

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab') || 'your-lists'

  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // TanStack Query hooks
  const { data: lists = [], isLoading: listsLoading } = useListsQuery()
  const { data: savedLists = [], isLoading: savedListsLoading } = useSavedListsQuery()
  const { data: analyticsData } = useAnalyticsStatsQuery()
  const createEmptyListMutation = useCreateEmptyListMutation()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateList = async () => {
    try {
      const newList = await createEmptyListMutation.mutateAsync()
      if (user?.username) {
        // New lists should open in edit mode so user can add content
        router.push(`/${user.username}/${newList.public_id || newList.id}?view=edit`)
      } else {
        router.push(`/list/${newList.public_id || newList.id}?view=edit`)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (!user) {
    router.push('/auth/sign-in')
    return null
  }

  const totalLinks = lists.reduce((acc, list) => acc + (list.links?.length || 0), 0)

  const currentTab = tab || 'your-lists'

  return (
    <div className="min-h-screen bg-background">
      <AppContainer variant="app">
        <div className="py-8">
          <div className="max-w-[560px] w-full mx-auto">

        {currentTab === 'your-lists' ? (
          <>
            {/* Breadcrumb */}
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Your Lists"
                profilePictureUrl={user.profile_picture_url}
              />
            </div>

            {/* Header with count and create button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <List className="w-4 h-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              <Button
                onClick={handleCreateList}
                disabled={createEmptyListMutation.isPending}
                variant="secondary"
                size="default"
                className="gap-2"
              >
                <span>Create list</span>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Lists */}
            <div className="space-y-3">
              {lists.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-secondary flex items-center justify-center text-2xl mx-auto mb-4">
                    🥨
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first list to start curating content
                  </p>
                  <Button
                    onClick={handleCreateList}
                    disabled={createEmptyListMutation.isPending}
                    size="lg"
                    className="px-6 py-3"
                  >
                    {createEmptyListMutation.isPending ? 'Creating...' : 'Create Your First List'}
                  </Button>
                </div>
              ) : (
                lists.map((list) => (
                  <div key={list.id}>
                    <Link
                      href={`/${user.username}/${list.public_id || list.id}`}
                      className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-colors rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-base flex-shrink-0">{list.emoji || '📋'}</span>
                        <span className="text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground flex-shrink-0 ml-3">
                        {list.links?.length || 0} links
                      </span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </>
        ) : currentTab === 'saved' ? (
          <>
            {/* Breadcrumb */}
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Saved"
                profilePictureUrl={user.profile_picture_url}
              />
            </div>

            {/* Header with count */}
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Star className="w-4 h-4" />
              <span className="text-base">{savedLists.length} saved lists</span>
            </div>

            {/* Lists */}
            {savedListsLoading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingState message="Loading saved lists..." />
              </div>
            ) : savedLists.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-secondary flex items-center justify-center text-2xl mx-auto mb-4" style={{ borderRadius: '12px' }}>
                  💾
                </div>
                <h3 className="text-lg font-semibold mb-2">No saved lists yet</h3>
                <p className="text-muted-foreground">
                  Click on the star icon on any list to save it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedLists.map((list) => {
                  const listOwner = list.user?.username || 'unknown'
                  return (
                    <div key={list.id}>
                      <Link
                        href={`/${listOwner}/${list.public_id || list.id}`}
                        className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-colors rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-base flex-shrink-0">{list.emoji || '📋'}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-base text-foreground group-hover:text-primary transition-colors block truncate">
                              {list.title || 'Untitled List'}
                            </span>
                            <span className="text-sm text-muted-foreground truncate block">
                              by @{listOwner}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0 ml-3">
                          <Star className="h-4 w-4" />
                          <span>{list.save_count || 0}</span>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : currentTab === 'stats' ? (
          <>
            {/* Breadcrumb */}
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Stats"
                profilePictureUrl={user.profile_picture_url}
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center border border-border rounded-lg py-4">
                <div className="text-2xl font-bold text-foreground">{formatCount(lists.length)}</div>
                <div className="text-sm text-muted-foreground">lists</div>
              </div>
              <div className="text-center border border-border rounded-lg py-4">
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? formatCount(analyticsData.totalViews) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">views</div>
              </div>
              <div className="text-center border border-border rounded-lg py-4">
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? formatCount(analyticsData.totalSaves) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">stars</div>
              </div>
            </div>

            {/* Per-list stats */}
            <div className="space-y-3">
              {lists.map((list) => {
                const listId = list.public_id || list.id
                const stats = analyticsData?.listStats[listId] || { views: 0, clicks: 0 }

                return (
                  <Link
                    key={list.id}
                    href={`/${user.username}/${listId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-colors rounded-md cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base">{list.emoji || '📋'}</span>
                        <span className="text-base text-foreground truncate">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Link2 className="h-4 w-4" aria-hidden="true" />
                          <span>{formatCount(list.links?.length || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span>{formatCount(stats.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" aria-hidden="true" />
                          <span>{formatCount(list.save_count || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : null}
          </div>
        </div>
      </AppContainer>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
