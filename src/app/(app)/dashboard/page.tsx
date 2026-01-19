'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EyeIcon, StarIcon, LinkIcon, ListBulletIcon, PlusIcon, GlobeAltIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'
import { useQueryClient } from '@tanstack/react-query'

import { Button, ListRowSkeleton, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useListsQuery,
  useCreateEmptyListMutation,
  useSavedListsQuery,
  useAnalyticsStatsQuery,
  listKeys,
} from '@/hooks/queries'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'
import { LoadingState } from '@/components/loading-state'

function ListsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  )
}

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
  const queryClient = useQueryClient()

  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'links' | 'alpha'>('recent')
  const [statsSortBy, setStatsSortBy] = useState<'links' | 'views' | 'stars'>('views')

  // TanStack Query hooks
  const { data: lists = [], isLoading: listsLoading } = useListsQuery()
  const { data: savedLists = [], isLoading: savedListsLoading } = useSavedListsQuery()
  const { data: analyticsData } = useAnalyticsStatsQuery()
  const createEmptyListMutation = useCreateEmptyListMutation()

  // Prefetch list data on hover for instant navigation
  const prefetchList = useCallback((listId: string) => {
    queryClient.prefetchQuery({
      queryKey: listKeys.list(listId),
      queryFn: async () => {
        const response = await fetch(`/api/lists/${listId}`)
        if (!response.ok) throw new Error('Failed to fetch list')
        const result = await response.json()
        return result.data
      },
      staleTime: 60 * 1000, // Consider fresh for 1 minute
    })
  }, [queryClient])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateList = async () => {
    try {
      const newList = await createEmptyListMutation.mutateAsync()
      if (user?.username) {
        // New lists open directly - owners see the edit view automatically
        router.push(`/${user.username}/${newList.public_id || newList.id}`)
      } else {
        router.push(`/list/${newList.public_id || newList.id}`)
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

  // Sort lists based on selected option
  const sortedLists = [...lists].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'links':
        return (b.links?.length || 0) - (a.links?.length || 0)
      case 'alpha':
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
      default:
        return 0
    }
  })

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
                <ListBulletIcon className="w-4 h-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              <div className="flex items-center gap-2">
                {lists.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none rounded-md">
                        {sortBy === 'recent' ? 'Recent' : sortBy === 'links' ? 'Links' : 'A-Z'}
                        <ChevronUpDownIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy('recent')}>
                        Recent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('links')}>
                        Links
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('alpha')}>
                        A-Z
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  onClick={handleCreateList}
                  disabled={createEmptyListMutation.isPending}
                  variant="outline"
                  size="default"
                  className="gap-2"
                >
                  <span>Create list</span>
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Lists */}
            <div className="space-y-3">
              {listsLoading ? (
                <ListsSkeleton count={3} />
              ) : lists.length === 0 ? (
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
                    {createEmptyListMutation.isPending ? 'Creating…' : 'Create Your First List'}
                  </Button>
                </div>
              ) : (
                sortedLists.map((list) => (
                  <div key={list.id}>
                    <Link
                      href={`/${user.username}/${list.public_id || list.id}`}
                      onMouseEnter={() => prefetchList(list.id)}
                      className="flex items-center justify-between px-3 py-3 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 active:scale-[0.995] transition-all duration-150 rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-base flex-shrink-0">{list.emoji || '📋'}</span>
                        <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">
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

            {/* Header with count and discover button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <StarIcon className="w-4 h-4" />
                <span className="text-base">{savedLists.length} saved lists</span>
              </div>
              <Button
                asChild
                variant="outline"
                size="default"
                className="gap-2"
              >
                <Link href="/discover">
                  <span>Discover</span>
                  <GlobeAltIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Lists */}
            {savedListsLoading ? (
              <ListsSkeleton count={3} />
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
                        onMouseEnter={() => prefetchList(list.id)}
                        className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 active:scale-[0.995] transition-all duration-150 rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <span className="text-2xl flex-shrink-0">{list.emoji || '📋'}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                              {list.title || 'Untitled List'}
                            </span>
                            <span className="text-sm text-muted-foreground truncate block">
                              {listOwner}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                          {list.links?.length || 0} links
                        </span>
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

            {/* Summary Stats - Stack on very small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <div className="mt-6">
                  <div className="text-2xl font-bold text-foreground">{formatCount(totalLinks)}</div>
                  <div className="text-sm text-muted-foreground">links</div>
                </div>
              </div>
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <EyeIcon className="w-4 h-4 text-muted-foreground" />
                <div className="mt-6">
                  <div className="text-2xl font-bold text-foreground">
                    {analyticsData ? formatCount(analyticsData.totalViews) : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">views</div>
                </div>
              </div>
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <StarIcon className="w-4 h-4 text-muted-foreground" />
                <div className="mt-6">
                  <div className="text-2xl font-bold text-foreground">
                    {analyticsData ? formatCount(analyticsData.totalSaves) : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">stars</div>
                </div>
              </div>
            </div>

            {/* Per-list stats header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListBulletIcon className="w-4 h-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              {lists.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none rounded-md">
                      {statsSortBy === 'links' ? 'Links' : statsSortBy === 'views' ? 'Views' : 'Stars'}
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setStatsSortBy('links')}>
                      Links
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatsSortBy('views')}>
                      Views
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatsSortBy('stars')}>
                      Stars
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Per-list stats */}
            <div className="space-y-3">
              {[...lists].sort((a, b) => {
                const aId = a.public_id || a.id
                const bId = b.public_id || b.id
                const aStats = analyticsData?.listStats[aId] || { views: 0, clicks: 0 }
                const bStats = analyticsData?.listStats[bId] || { views: 0, clicks: 0 }

                switch (statsSortBy) {
                  case 'links':
                    return (b.links?.length || 0) - (a.links?.length || 0)
                  case 'views':
                    return bStats.views - aStats.views
                  case 'stars':
                    return (b.save_count || 0) - (a.save_count || 0)
                  default:
                    return 0
                }
              }).map((list) => {
                const listId = list.public_id || list.id
                const stats = analyticsData?.listStats[listId] || { views: 0, clicks: 0 }

                return (
                  <Link
                    key={list.id}
                    href={`/${user.username}/${listId}`}
                    onMouseEnter={() => prefetchList(list.id)}
                    className="block"
                  >
                    <div className="flex items-center justify-between px-3 py-3 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 active:scale-[0.995] transition-all duration-150 rounded-md cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base">{list.emoji || '📋'}</span>
                        <span className="text-base font-medium text-foreground truncate">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" aria-hidden="true" />
                          <span>{formatCount(list.links?.length || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" aria-hidden="true" />
                          <span>{formatCount(stats.views)}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                          <StarIcon className="h-4 w-4" aria-hidden="true" />
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
