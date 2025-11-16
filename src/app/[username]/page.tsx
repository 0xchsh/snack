'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { List, Link2, Star, Copy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { validateUsername } from '@/lib/username-utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoadingState } from '@/components/loading-state'

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
    public_id: string | null
    title: string
    description: string | null
    emoji: string | null
    save_count: number
    created_at: string
    links: Array<{ count: number }>
  }>
  stats: {
    total_public_lists: number
    total_saves_received: number
    total_links: number
    total_views: number
  }
}

export default function UsernamePage() {
  const params = useParams()
  const username = params?.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopySuccess, setShowCopySuccess] = useState(false)

  useEffect(() => {
    if (!username) return

    // Validate username format first
    const validation = validateUsername(username)
    if (!validation.valid) {
      setError('Invalid username format')
      setLoading(false)
      return
    }

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
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

  const resolveInitial = (value?: string | null) => {
    if (!value || value.length === 0) {
      return 'U'
    }
    const normalized = value.startsWith('@') ? value.slice(1) : value
    const char = normalized[0]
    return char ? char.toUpperCase() : 'U'
  }

  const displayName = profile.user.first_name && profile.user.last_name
    ? `${profile.user.first_name} ${profile.user.last_name}`.trim()
    : profile.user.username

  const profileInitial = resolveInitial(profile.user.username)

  const joinDate = new Date(profile.user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const handleCopyProfile = async () => {
    const url = `${window.location.origin}/${profile.user.username}`
    await navigator.clipboard.writeText(url)
    setShowCopySuccess(true)
    setTimeout(() => setShowCopySuccess(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Copy Success Toast */}
      <AnimatePresence>
        {showCopySuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="font-medium">Profile link copied!</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="bg-background">
        <div className="mx-auto w-full max-w-container-app px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center">
              <Image
                src="/images/logo.svg"
                alt="Snack"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto py-12 max-w-[560px]">
        <div className="flex flex-col gap-6">
          {/* Profile Picture - 48px */}
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profile.user.profile_picture_url ? (
              <Image
                src={profile.user.profile_picture_url}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {profileInitial}
              </span>
            )}
          </div>

          {/* Username and Join Date */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex items-start text-xl font-normal leading-[1.5]">
                <span className="text-neutral-400">@</span>
                <span className="text-foreground">{profile.user.username}</span>
              </div>
              <button
                onClick={handleCopyProfile}
                className="p-1.5 hover:bg-accent rounded-md transition-colors flex items-center justify-center"
                aria-label="Copy profile link"
              >
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-normal text-neutral-400">
                Joined {joinDate}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <List className="w-4 h-4" />
              <span className="text-sm sm:text-base">{profile.stats.total_public_lists} lists</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                <span className="text-sm sm:text-base">{profile.stats.total_links}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4" />
                <span className="text-sm sm:text-base">{profile.stats.total_saves_received}</span>
              </div>
            </div>
          </div>

          {/* Lists */}
          <div className="flex flex-col gap-3">
            {profile.lists.length > 0 ? (
              profile.lists.map((list) => {
                const linkCount = list.links?.[0]?.count || 0
                return (
                  <div key={list.id}>
                    <Link
                      href={`/${profile.user.username}/${list.public_id || list.id}`}
                      className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-transform transform hover:scale-[0.99] active:scale-[0.97] rounded-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          <span className="text-base">{list.emoji || '📋'}</span>
                        </div>
                        <span className="text-base text-foreground truncate">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <span className="text-base text-neutral-400 ml-4 flex-shrink-0">
                        {linkCount} {linkCount === 1 ? 'link' : 'links'}
                      </span>
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No public lists yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
