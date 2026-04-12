'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, ListBullets, CaretUpDown } from '@phosphor-icons/react'
import { Spinner, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui'
import { useInView } from 'react-intersection-observer'
import { LoadingState } from '@/components/loading-state'

interface PublicList {
  id: string
  public_id: string | null
  title: string | null
  emoji: string | null
  is_public: boolean
  view_count: number
  save_count: number
  created_at: string
  users: {
    username: string | null
    profile_picture_url: string | null
    first_name: string | null
    last_name: string | null
  } | null
  links: Array<{
    id: string
    url: string
    title: string | null
  }>
}

type SortOption = 'recent' | 'links' | 'stars'

export default function DiscoverPage() {
  const [lists, setLists] = useState<PublicList[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [emojiFilter, setEmojiFilter] = useState<string | null>(null)

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

  // Initial fetch
  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/discover?page=1&limit=30')

        if (!response.ok) {
          throw new Error('Failed to fetch public lists')
        }

        const data = await response.json()
        setLists(data.data || [])
        setHasMore(data.pagination?.hasMore ?? false)
        setTotalCount(data.pagination?.total ?? 0)
        setPage(1)
      } catch (err) {
        console.error('Error fetching public lists:', err)
        setError('Failed to load lists')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicLists()
  }, [])

  // Load more when user scrolls near bottom
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const response = await fetch(`/api/discover?page=${nextPage}&limit=20`)

      if (!response.ok) {
        throw new Error('Failed to fetch more lists')
      }

      const data = await response.json()
      const newLists = data.data || []

      // Filter out any duplicates based on list ID
      setLists(prev => {
        const existingIds = new Set(prev.map(list => list.id))
        const uniqueNewLists = newLists.filter((list: PublicList) => !existingIds.has(list.id))
        return [...prev, ...uniqueNewLists]
      })

      setHasMore(data.pagination?.hasMore ?? false)
      setPage(nextPage)
    } catch (err) {
      console.error('Error fetching more lists:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore])

  // Trigger load more when scroll sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading, loadMore])

  const getDisplayName = (list: PublicList) => {
    if (!list.users) return 'Unknown User'

    const { first_name, last_name, username } = list.users

    if (first_name && last_name) {
      return `${first_name} ${last_name}`
    } else if (first_name) {
      return first_name
    } else if (username) {
      return username
    }

    return 'Unknown User'
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 86400) return 'Today'
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}m`

    return `${Math.floor(diffInSeconds / 31536000)}y`
  }

  const uniqueEmojis = [...new Set(lists.map(l => l.emoji || '📋'))]

  const sortedLists = [...lists]
    .filter(list => !emojiFilter || (list.emoji || '📋') === emojiFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'links':
          return (b.links?.length || 0) - (a.links?.length || 0)
        case 'stars':
          return (b.save_count || 0) - (a.save_count || 0)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Finding great lists…" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 md:py-12 max-w-2xl w-full px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Discover Lists</h1>
          <p className="text-muted-foreground">Explore curated lists from the community</p>
        </div>

        {/* Stats and Sort Controls */}
        {lists.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left side - Total lists */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ListBullets weight="bold" className="size-4" />
              <span className="text-sm sm:text-base">{totalCount} {totalCount === 1 ? 'list' : 'lists'}</span>
            </div>

            {/* Right side - Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none rounded-md">
                  {sortBy === 'recent' ? 'Recent' : sortBy === 'links' ? 'Links' : 'Stars'}
                  <CaretUpDown weight="bold" className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortBy('recent'); setAnimKey(k => k + 1) }}>
                  Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('links'); setAnimKey(k => k + 1) }}>
                  Links
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('stars'); setAnimKey(k => k + 1) }}>
                  Stars
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Emoji filter badges */}
        {lists.length > 0 && uniqueEmojis.length > 1 && (
          <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 w-max">
              <button
                onClick={() => { setEmojiFilter(null); setAnimKey(k => k + 1) }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!emojiFilter ? 'bg-foreground text-background' : 'bg-neutral-100 dark:bg-neutral-800 text-muted-foreground hover:text-foreground'}`}
              >
                All
              </button>
              {uniqueEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setEmojiFilter(emojiFilter === emoji ? null : emoji); setAnimKey(k => k + 1) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${emojiFilter === emoji ? 'bg-foreground text-background' : 'bg-neutral-100 dark:bg-neutral-800 text-muted-foreground hover:text-foreground'}`}
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums">{lists.filter(l => (l.emoji || '📋') === emoji).length}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No public lists yet. Be the first to create one!</p>
          </div>
        ) : (
          <div key={animKey} className="flex flex-col">
            {sortedLists.map((list, index) => {
              const username = list.users?.username || 'unknown'
              const listSlug = list.public_id || list.id
              const linkCount = list.links?.length || 0

              return (
                <Link
                  key={list.id}
                  href={`/${username}/${listSlug}`}
                  style={{ '--i': index } as React.CSSProperties}
                  className="animate-card-in flex items-center gap-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 -mx-2 px-2 rounded-lg active:scale-[0.99] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-base shrink-0">{list.emoji || '📋'}</span>
                  <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                    {list.title || 'Untitled List'}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0">{username}</span>
                  <span className="text-sm text-muted-foreground tabular-nums shrink-0">{linkCount}</span>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Star weight="bold" className="size-3.5" />
                    <span className="text-sm tabular-nums">{list.save_count || 0}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Loading more indicator */}
        {!loading && hasMore && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner size="sm" />
                <span className="text-sm">Loading more lists...</span>
              </div>
            )}
          </div>
        )}

        {/* End of results message */}
        {!loading && !hasMore && lists.length > 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">You've reached the end of the list</p>
          </div>
        )}
      </div>
    </div>
  )
}
