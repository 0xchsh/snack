'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Link2 } from 'lucide-react'
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
    avatar_url: string | null
    first_name: string | null
    last_name: string | null
  } | null
  links: Array<{
    id: string
    url: string
    title: string | null
  }>
}

export default function DiscoverPage() {
  const [lists, setLists] = useState<PublicList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/discover')

        if (!response.ok) {
          throw new Error('Failed to fetch public lists')
        }

        const data = await response.json()
        setLists(data.data || [])
      } catch (err) {
        console.error('Error fetching public lists:', err)
        setError('Failed to load lists')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicLists()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading lists..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 md:py-12 max-w-[800px] px-4 md:px-0">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Lists</h1>
          <p className="text-muted-foreground">Explore curated lists from the community</p>
        </div>

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
            {lists.map((list) => {
              const username = list.users?.username || 'unknown'
              const listSlug = list.public_id || list.id
              const displayName = getDisplayName(list)
              const profilePicUrl = list.users?.avatar_url
              const linkCount = list.links?.length || 0

              return (
                <Link
                  key={list.id}
                  href={`/${username}/${listSlug}`}
                  className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-transform transform hover:scale-[0.99] active:scale-[0.97] rounded-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {/* Left side - emoji and title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            <span className="text-[9px] font-bold text-muted-foreground">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-neutral-400 truncate">
                          {displayName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - stats */}
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0 text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="w-4 h-4" />
                      <span className="text-sm">{linkCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{list.save_count || 0}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
