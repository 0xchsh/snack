'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, Star, Link as LinkPhosphor, ListBullets, Plus, Globe, CaretUpDown, Money } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { celebrate } from '@/lib/confetti'
import {
  useListsQuery,
  useCreateEmptyListMutation,
  useSavedListsQuery,
  useAnalyticsStatsQuery,
  listKeys,
} from '@/hooks/queries'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'
import { Skeleton } from 'boneyard-js/react'
import { isListPaid, formatListPrice, formatCurrency } from '@/lib/pricing'
import type { Currency } from '@/types'

function ListsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5 px-2">
          <div className="w-5 h-5 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded-md flex-1 max-w-[60%]" />
          <div className="h-4 w-8 bg-muted animate-pulse rounded-md" />
        </div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[560px] mx-auto px-4 py-8 space-y-4">
        <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
        <ListsSkeleton count={4} />
      </div>
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
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [earningsCurrency, setEarningsCurrency] = useState<Currency>('usd')

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

  // Fetch earnings data for stats tab
  useEffect(() => {
    if (tab === 'stats') {
      fetch('/api/stripe/connect/status')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.onboarding_complete) {
            // Earnings will show once Stripe is connected
            // Placeholder until earnings API endpoint is wired
            setTotalEarnings(0)
          }
        })
        .catch(() => {})
    }
  }, [tab])

  const handleCreateList = async () => {
    const isFirstList = lists.length === 0
    try {
      const newList = await createEmptyListMutation.mutateAsync()
      if (isFirstList) {
        celebrate()
        toast.success('Your first list is live. Welcome to Snack.')
      }
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
    return <DashboardSkeleton />
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
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'links':
        return (b.links?.length || 0) - (a.links?.length || 0)
      case 'alpha':
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
      default:
        return 0
    }
  })

  return (
    <Skeleton name="dashboard" loading={listsLoading && lists.length === 0} animate="pulse" transition={300} fallback={<DashboardSkeleton />}>
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
                <ListBullets weight="bold" className="size-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              <div className="flex items-center gap-2">
                {lists.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none rounded-md">
                        {sortBy === 'recent' ? 'Recent' : sortBy === 'links' ? 'Links' : 'A-Z'}
                        <CaretUpDown weight="bold" className="size-4" />
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
                  <Plus weight="bold" className="size-4" />
                </Button>
              </div>
            </div>

            {/* Lists */}
            <div className="flex flex-col">
              {listsLoading ? (
                <ListsSkeleton count={3} />
              ) : lists.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-secondary flex items-center justify-center text-2xl mx-auto mb-4">
                    🥨
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Make a list of the links you&apos;d actually send a friend.
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
                sortedLists.map((list, index) => (
                  <Link
                    key={list.id}
                    href={`/${user.username}/${list.public_id || list.id}`}
                    onMouseEnter={() => prefetchList(list.id)}
                    style={{ '--i': index } as React.CSSProperties}
                    className="animate-card-in flex items-center gap-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 -mx-2 px-2 rounded-md active:scale-[0.99] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-base shrink-0">{list.emoji || '📋'}</span>
                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                      {list.title || 'Untitled List'}
                    </span>
                    {isListPaid((list as any).price_cents) && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded shrink-0">
                        {formatListPrice((list as any).price_cents, (list as any).currency || 'usd')}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                      {list.links?.length || 0}
                    </span>
                  </Link>
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
                <Star weight="bold" className="size-4" />
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
                  <Globe weight="bold" className="size-4 !text-muted-foreground" />
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
                  Find a list worth keeping, tap the star, and it lands here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {savedLists.map((list, index) => {
                  const listOwner = list.user?.username || 'unknown'
                  return (
                    <Link
                      key={list.id}
                      href={`/${listOwner}/${list.public_id || list.id}`}
                      onMouseEnter={() => prefetchList(list.id)}
                      style={{ '--i': index } as React.CSSProperties}
                      className="animate-card-in flex items-center gap-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 -mx-2 px-2 rounded-md active:scale-[0.99] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-base shrink-0">{list.emoji || '📋'}</span>
                      <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                        {list.title || 'Untitled List'}
                      </span>
                      <span className="text-sm text-muted-foreground shrink-0">{listOwner}</span>
                      <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                        {list.links?.length || 0}
                      </span>
                    </Link>
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

            {/* Summary Stats - 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkPhosphor weight="bold" className="size-4" />
                  <span className="text-sm">Links</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatCount(totalLinks)}</div>
              </div>
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye weight="bold" className="size-4" />
                  <span className="text-sm">Views</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? formatCount(analyticsData.totalViews) : '0'}
                </div>
              </div>
              <div className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star weight="bold" className="size-4" />
                  <span className="text-sm">Stars</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? formatCount(analyticsData.totalSaves) : '0'}
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => {/* will navigate to monetization tab */}}
                className="flex flex-col justify-between border border-border rounded-lg p-4 min-h-[100px] hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Money weight="bold" className="size-4" />
                  <span className="text-sm">Earnings</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalEarnings, earningsCurrency)}
                </div>
              </Link>
            </div>

            {/* Per-list stats header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListBullets weight="bold" className="size-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              {lists.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none rounded-md">
                      {statsSortBy === 'links' ? 'Links' : statsSortBy === 'views' ? 'Views' : 'Stars'}
                      <CaretUpDown weight="bold" className="size-4" />
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
            <div className="flex flex-col">
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
              }).map((list, index) => {
                const listId = list.public_id || list.id
                const stats = analyticsData?.listStats[listId] || { views: 0, clicks: 0 }

                return (
                  <Link
                    key={list.id}
                    href={`/${user.username}/${listId}`}
                    onMouseEnter={() => prefetchList(list.id)}
                    style={{ '--i': index } as React.CSSProperties}
                    className="animate-card-in flex items-center gap-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 -mx-2 px-2 rounded-md active:scale-[0.99] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-base shrink-0">{list.emoji || '📋'}</span>
                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                      {list.title || 'Untitled List'}
                    </span>
                    {isListPaid((list as any).price_cents) && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded shrink-0">
                        {formatListPrice((list as any).price_cents, (list as any).currency || 'usd')}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                      <span className="tabular-nums">{formatCount(list.links?.length || 0)}</span>
                      <div className="flex items-center gap-1">
                        <Eye weight="bold" className="size-3.5" />
                        <span className="tabular-nums">{formatCount(stats.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star weight="bold" className="size-3.5" />
                        <span className="tabular-nums">{formatCount(list.save_count || 0)}</span>
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
    </Skeleton>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
