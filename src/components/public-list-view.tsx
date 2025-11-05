'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { Copy, Clock, Link as LinkIcon, Eye, Bookmark, Edit } from 'lucide-react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ListWithLinks, Link as LinkType } from '@/types'
import { getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { useAuth } from '@/hooks/useAuth'
import { Header } from './header'

type ViewMode = 'row' | 'card'

interface PublicListViewProps {
  list: ListWithLinks
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

export function PublicListView({ list }: PublicListViewProps) {
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set())
  const [hasAnimated, setHasAnimated] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Get view mode from list data, default to 'row' if not set
  const viewMode: ViewMode = list.view_mode === 'card' ? 'card' : 'row'

  // Get display name - prioritize current user's data for their own lists
  const isOwner = user && list.user_id === user.id
  
  const resolveInitial = (value?: string | null) => {
    if (!value || value.length === 0) {
      return 'U'
    }
    const normalized = value.startsWith('@') ? value.slice(1) : value
    const char = normalized[0]
    return char ? char.toUpperCase() : 'U'
  }

  let displayName = 'Unknown User'
  let displayInitial = 'U'
  
  if (isOwner && user) {
    // Use current user's name data for their own lists
    if (user.first_name && user.last_name) {
      displayName = `${user.first_name} ${user.last_name}`
      displayInitial = resolveInitial(user.first_name)
    } else if (user.first_name) {
      displayName = user.first_name
      displayInitial = resolveInitial(user.first_name)
    } else if (user.username) {
      displayName = user.username
      displayInitial = resolveInitial(user.username)
    }
  } else if (list.user) {
    // Use stored list user data for other users' lists
    displayName = list.user.username || 'Unknown User'
    displayInitial = resolveInitial(displayName)
  }
  
  // Get profile picture - use current user's profile picture if this is their list, otherwise use list user's picture
  const profilePictureUrl =
    (user && list.user_id === user.id ? user.profile_picture_url : list.user?.profile_picture_url) || null

  const handleLinkClick = async (linkId: string, url: string) => {
    setClickedLinks(prev => new Set(prev).add(linkId))
    
    // Track the click
    try {
      await fetch('/api/analytics/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId: linkId,
          listId: list.id
        })
      })
    } catch (error) {
      // Silently fail - analytics shouldn't block UX
    }
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 2000)
    } catch {
      // Silently handle error
    }
  }

  const handleLogin = () => {
    router.push('/auth/sign-in')
  }

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Set hasAnimated to true after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Track view when component mounts
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/analytics/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listId: list.id
          })
        })
      } catch (error) {
        // Silently fail - analytics shouldn't block UX
      }
    }

    trackView()
  }, [list.id])

  return (
    <div className="min-h-screen bg-background">
      {/* Copy Success Toast */}
      <AnimatePresence>
        {showCopySuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="font-medium">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isOwner ? (
        <Header
          logoHref="/dashboard"
          username={user?.username || list.user?.username || ''}
          buttons={[
            {
              type: 'custom',
              icon: <Edit className="w-5 h-5" />,
              onClick: () => {
                const username = user?.username || list.user?.username
                router.push(`/${username}/${list.public_id || list.id}`)
              },
              className: "w-10 h-10 p-0 flex items-center justify-center"
            },
            {
              type: 'custom',
              icon: <Copy className="w-5 h-5" />,
              onClick: async () => {
                const url = `${window.location.origin}/${list.user?.username}/${list.public_id || list.id}`
                await navigator.clipboard.writeText(url)
                setShowCopySuccess(true)
                setTimeout(() => setShowCopySuccess(false), 2000)
              },
              className: "w-10 h-10 p-0 flex items-center justify-center"
            }
          ]}
        />
      ) : (
        <Header
          logoHref="/"
          username={user?.username || list.user?.username || ''}
          buttons={user ? [
            {
              type: 'custom',
              label: 'Dashboard',
              onClick: () => router.push('/dashboard'),
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            }
          ] : [
            {
              type: 'custom',
              label: 'Make a Snack',
              onClick: handleLogin,
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            }
          ]}
        />
      )}
      
      <div className="mx-auto py-6 md:py-12 max-w-[560px] px-4 md:px-0">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Emoji */}
          <div className="w-12 h-12">
            <span className="text-5xl">{list.emoji}</span>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-medium text-foreground break-words leading-[1.5]">
              {list.title || 'Untitled List'}
            </h1>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left: Creator */}
            <div>
              {list.user?.username && (
                <Link
                  href={`/${list.user.username}`}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors text-base w-fit"
                >
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                    {profilePictureUrl ? (
                      <Image
                        src={profilePictureUrl}
                        alt={`${displayName}'s profile`}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <span
                      className="text-muted-foreground text-[10px] font-bold"
                      style={{ display: profilePictureUrl ? 'none' : 'flex' }}
                    >
                      {displayInitial}
                    </span>
                  </div>
                  <span className="font-medium text-muted-foreground">{displayName}</span>
                </Link>
              )}
            </div>

            {/* Right: Links, Views, Saves */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{list.links?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{formatCount(list.view_count || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{formatCount(list.save_count || 0)}</span>
              </div>
            </div>
          </div>

          {/* Links List */}
          <div className={viewMode === 'card' ? 'space-y-6' : 'space-y-3'}>
            {list.links && list.links.length > 0 ? (
              list.links.map((link, index) => (
                <PublicLinkItem
                  key={link.id}
                  link={link}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  isClicked={clickedLinks.has(link.id)}
                  index={index}
                  viewMode={viewMode}
                  hasAnimated={hasAnimated}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))
            ) : (
              <div className="py-12 text-muted-foreground text-center">
                <p>This list is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PublicLinkItemProps {
  link: LinkType
  onClick: () => void
  isClicked: boolean
  index: number
  viewMode: ViewMode
  hasAnimated: boolean
  prefersReducedMotion: boolean
}

const PublicLinkItem = memo(function PublicLinkItem({
  link,
  onClick,
  isClicked,
  index,
  viewMode,
  hasAnimated,
  prefersReducedMotion
}: PublicLinkItemProps) {
  
  if (viewMode === 'row') {
    // Public list view layout with domain on right
    return (
      <div
        className="flex items-center justify-between py-3 hover:bg-accent/50 transition-colors group cursor-pointer border-b border-border last:border-0"
        onClick={onClick}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-4 h-4 overflow-hidden flex-shrink-0">
            <Favicon
              url={link.url}
              size={16}
            />
          </div>

          <span className="text-base text-foreground truncate">
            {link.title || getHostname(link.url)}
          </span>
        </div>

        <span className="text-sm text-muted-foreground ml-4 flex-shrink-0">
          {getHostname(link.url)}
        </span>
      </div>
    )
  }

  // Card layout - largest cards with OG images (exact match to edit view)
  return (
    <motion.div
      initial={hasAnimated || prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={hasAnimated || prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col gap-3 cursor-pointer group"
      onClick={onClick}
    >
      {/* OG Image Preview */}
      <div className="aspect-video bg-accent relative rounded-md overflow-hidden">
        {link.image_url ? (
          <>
            <Image
              src={link.image_url}
              alt={link.title || ''}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
              unoptimized
              onError={(e) => {
                // Hide the failed image
                e.currentTarget.style.display = 'none'
                // Show the fallback div
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) {
                  fallback.style.display = 'flex'
                }
              }}
            />
            {/* Fallback content (hidden by default, shown when image fails) */}
            <div
              className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.05]"
              style={{ display: 'none' }}
            >
              <div className="text-neutral-300 dark:text-neutral-600">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                  style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(91%) contrast(89%)' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.05]">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={48}
              height={48}
              className="w-12 h-12"
              style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(91%) contrast(89%)' }}
            />
          </div>
        )}
      </div>

      {/* Site Info - Separated from OG Image */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-4 h-4 overflow-hidden flex-shrink-0">
            <Favicon
              url={link.url}
              size={16}
            />
          </div>
          <h3
            className="font-medium text-foreground text-base leading-tight truncate"
          >
            {link.title || getHostname(link.url)}
          </h3>
        </div>
        <p
          className="text-sm text-muted-foreground flex-shrink-0"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {getHostname(link.url)}
        </p>
      </div>
    </motion.div>
  )
})
