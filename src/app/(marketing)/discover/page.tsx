'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StarIcon, LinkIcon, ListBulletIcon } from '@heroicons/react/24/solid'
import { Spinner } from '@/components/ui'
import { useInView } from 'react-intersection-observer'
import { LoadingState } from '@/components/loading-state'
import { DefaultAvatar } from '@/components/default-avatar'

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

  const sortedLists = [...lists].sort((a, b) => {
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
        <LoadingState message="Loading lists..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 md:py-12 max-w-[560px] w-full px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Discover Lists</h1>
          <p className="text-muted-foreground">Explore curated lists from the community</p>
        </div>

        {/* Stats and Sort Controls */}
        {lists.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left side - Total lists */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ListBulletIcon className="w-4 h-4" />
              <span className="text-sm sm:text-base">{totalCount} {totalCount === 1 ? 'list' : 'lists'}</span>
            </div>

            {/* Right side - Sort controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSortBy('recent')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('links')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'links'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                Links
              </button>
              <button
                onClick={() => setSortBy('stars')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'stars'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                Stars
              </button>
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
          <div className="space-y-3">
            {sortedLists.map((list) => {
              const username = list.users?.username || 'unknown'
              const listSlug = list.public_id || list.id
              const displayName = getDisplayName(list)
              const profilePicUrl = list.users?.profile_picture_url
              const linkCount = list.links?.length || 0

              return (
                <Link
                  key={list.id}
                  href={`/${username}/${listSlug}`}
                  className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-background border border-border hover:bg-muted active:bg-muted/80 active:scale-[0.995] transition-all duration-150 rounded-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {/* Left side - emoji and title */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {list.emoji || '📋'}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-base font-medium text-foreground truncate">
                        {list.title || 'Untitled List'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profilePicUrl ? (
                            <Image
                              src={profilePicUrl}
                              alt={`${displayName}'s profile`}
                              width={16}
                              height={16}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <DefaultAvatar size={16} />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {displayName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - stats */}
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-sm">{linkCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarIcon className="w-4 h-4" />
                      <span className="text-sm">{list.save_count || 0}</span>
                    </div>
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
