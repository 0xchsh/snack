'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, Heart, Link2, Clock } from 'lucide-react'
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
        <div className="mb-8">
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
          <div className="space-y-4">
            {lists.map((list) => {
              const username = list.users?.username || 'unknown'
              const listSlug = list.public_id || list.id
              const displayName = getDisplayName(list)
              const profilePicUrl = list.users?.avatar_url

              return (
                <Link
                  key={list.id}
                  href={`/${username}/${listSlug}`}
                  className="block"
                >
                  <div className="bg-background border border-border rounded-xl p-6 hover:bg-accent/50 transition-colors">
                    {/* Header with emoji and title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl flex-shrink-0">
                        {list.emoji || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-foreground mb-1 truncate">
                          {list.title || 'Untitled List'}
                        </h3>

                        {/* Creator info */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {profilePicUrl ? (
                              <Image
                                src={profilePicUrl}
                                alt={`${displayName}'s profile`}
                                width={20}
                                height={20}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {displayName}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{getRelativeTime(list.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link2 className="w-4 h-4" />
                            <span>{list.links?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" />
                            <span>{list.save_count || 0}</span>
                          </div>
                        </div>
                      </div>
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
