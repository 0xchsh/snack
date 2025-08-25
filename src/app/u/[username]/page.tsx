'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
// import { User, Calendar, Bookmark, ArrowLeft, ExternalLink } from 'lucide-react'

interface PublicProfile {
  user: {
    id: string
    username: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
    bio: string | null
    created_at: string
  }
  lists: Array<{
    id: string
    title: string
    description: string | null
    emoji: string | null
    emoji_3d: any | null
    save_count: number
    created_at: string
    links?: Array<{ count: number }>
  }>
  stats: {
    total_public_lists: number
    total_saves_received: number
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params?.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/public-profile/${encodeURIComponent(username)}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load profile')
        }

        setProfile(result.data)
      } catch (err: any) {
        console.error('Error loading profile:', err)
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            style={{ fontFamily: 'Open Runde' }}
          >
            <span>←</span>
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const displayName = profile.user.first_name && profile.user.last_name
    ? `${profile.user.first_name} ${profile.user.last_name}`.trim()
    : profile.user.username

  const joinDate = new Date(profile.user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
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
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontFamily: 'Open Runde' }}
              >
                <span>←</span>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-8 mb-12">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
              {profile.user.profile_picture_url ? (
                <Image
                  src={profile.user.profile_picture_url}
                  alt={displayName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl">👤</div>
              )}
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h1 
              className="text-4xl font-bold text-foreground mb-2"
              style={{ fontFamily: 'Open Runde' }}
            >
              {displayName}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">@{profile.user.username}</p>
            
            {profile.user.bio && (
              <p className="text-lg text-foreground mb-6 max-w-2xl">
                {profile.user.bio}
              </p>
            )}

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔖</span>
                <span>{profile.stats.total_saves_received} saves received</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: 'Open Runde' }}
            >
              Public Lists ({profile.stats.total_public_lists})
            </h2>
          </div>

          {profile.lists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/demo?list=${list.id}&view=public`}
                  className="block"
                >
                  <div className="relative bg-white rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 group border border-gray-100">
                    {/* Large Emoji */}
                    <div className="flex items-center justify-center mb-6 pt-4">
                      <div className="w-32 h-32 flex items-center justify-center">
                        {list.emoji_3d?.url ? (
                          <Image
                            src={list.emoji_3d.url}
                            alt={list.emoji_3d.name || 'emoji'}
                            width={120}
                            height={120}
                            className="w-28 h-28 object-contain group-hover:scale-105 transition-transform duration-200"
                            unoptimized
                            onError={(e) => {
                              // Hide the failed image and show fallback emoji
                              const target = e.currentTarget as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) {
                                fallback.style.display = 'block'
                              }
                            }}
                          />
                        ) : null}
                        <span 
                          className="text-7xl"
                          style={{ display: list.emoji_3d?.url ? 'none' : 'block' }}
                        >
                          {list.emoji || '🥨'}
                        </span>
                      </div>
                    </div>

                    {/* List Info */}
                    <div className="text-center pb-2">
                      <h3 
                        className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors"
                        style={{ fontFamily: 'Open Runde' }}
                      >
                        {list.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span>{list.links?.[0]?.count || 0} links</span>
                        <span>•</span>
                        <span>{list.save_count} saves</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <span>🔖</span>
              </div>
              <h3 
                className="text-lg font-semibold text-foreground mb-2"
                style={{ fontFamily: 'Open Runde' }}
              >
                No public lists yet
              </h3>
              <p className="text-muted-foreground">
                {displayName} hasn't shared any public lists yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}