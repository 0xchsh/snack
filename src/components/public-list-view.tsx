'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { DocumentDuplicateIcon, ClockIcon, LinkIcon, EyeIcon, StarIcon, PencilIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ListWithLinks, Link as LinkType, Currency } from '@/types'
import { getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { useAuth } from '@/hooks/useAuth'
import { Header } from './header'
import { ListPaywall } from './list-paywall'
import { isListFree } from '@/lib/pricing'
import { DefaultAvatar } from '@/components/default-avatar'
import { Toast } from '@/components/ui'

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

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 86400) return 'Today'
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}m`

  return `${Math.floor(diffInSeconds / 31536000)}y`
}

export function PublicListView({ list: initialList }: PublicListViewProps) {
  const [list, setList] = useState(initialList)
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set())
  const [hasAnimated, setHasAnimated] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasAccess, setHasAccess] = useState(true) // Assume access by default
  const [checkingAccess, setCheckingAccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Update local list when prop changes
  useEffect(() => {
    setList(initialList)
  }, [initialList])

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

  const handleLinkClick = (linkId: string, url: string) => {
    setClickedLinks(prev => new Set(prev).add(linkId))

    // Open link immediately to avoid popup blocking on mobile
    window.open(url, '_blank', 'noopener,noreferrer')

    // Track the click asynchronously (don't await)
    fetch('/api/analytics/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkId: linkId,
        listId: list.id
      })
    }).catch(() => {
      // Silently fail - analytics shouldn't block UX
    })
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

  const handleSave = async () => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }

    if (isSaving) return

    setIsSaving(true)
    try {
      if (isSaved) {
        // Unsave
        const response = await fetch(`/api/lists/${list.id}/save`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const data = await response.json()
          setIsSaved(false)

          // Update save count from API response
          if (data.data && typeof data.data.save_count === 'number') {
            setList(prev => ({
              ...prev,
              save_count: data.data.save_count
            }))
          }

          // Refresh the router to invalidate cache
          router.refresh()
        }
      } else {
        // Save
        const response = await fetch(`/api/lists/${list.id}/save`, {
          method: 'POST',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Save API response:', data)
          setIsSaved(true)
          setShowSaveSuccess(true)
          setTimeout(() => setShowSaveSuccess(false), 2000)

          // Update save count from API response
          if (data.data && typeof data.data.save_count === 'number') {
            console.log('Updating save_count to:', data.data.save_count)
            setList(prev => ({
              ...prev,
              save_count: data.data.save_count
            }))
          } else {
            console.warn('No save_count in API response:', data)
          }

          // Refresh the router to invalidate cache
          router.refresh()
        }
      }
    } catch (error) {
      // Silently handle error
      console.error('Error saving/unsaving list:', error)
    } finally {
      setIsSaving(false)
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

  // Check if list is saved by current user
  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!user || isOwner) return // Don't check for owners or unauthenticated users

      try {
        const response = await fetch(`/api/lists/${list.id}/save`)
        const data = await response.json()
        if (data.success && data.data) {
          setIsSaved(data.data.isSaved)
        }
      } catch (error) {
        // Silently fail
      }
    }

    checkSaveStatus()
  }, [list.id, user, isOwner])

  // Check purchase status for paid lists
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      // If list is free, user has access
      if (isListFree(list.price_cents)) {
        setHasAccess(true)
        return
      }

      // If user is owner, they have access
      if (isOwner) {
        setHasAccess(true)
        return
      }

      setCheckingAccess(true)

      try {
        const response = await fetch(`/api/lists/${list.id}/purchase-status`)
        const data = await response.json()

        if (data.success && data.data) {
          setHasAccess(data.data.has_access)
        } else {
          // If API fails, default to no access for paid lists
          setHasAccess(false)
        }
      } catch (error) {
        console.error('Error checking purchase status:', error)
        // On error, default to no access for paid lists
        setHasAccess(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkPurchaseStatus()
  }, [list.id, list.price_cents, isOwner])

  return (
    <div className="min-h-screen bg-background">
      {/* Toasts */}
      <Toast show={showCopySuccess} message="Link copied to clipboard!" variant="copied" />
      <Toast show={showSaveSuccess} message="Saved successfully!" variant="saved" />

      {isOwner ? (
        <Header
          logoHref="/dashboard"
          username={user?.username || list.user?.username || ''}
          buttons={[
            {
              type: 'custom',
              icon: <PencilIcon className="w-5 h-5" />,
              onClick: () => {
                const username = user?.username || list.user?.username
                router.push(`/${username}/${list.public_id || list.id}`)
              },
              className: "w-icon-button h-icon-button p-0 flex items-center justify-center"
            },
            {
              type: 'custom',
              icon: <DocumentDuplicateIcon className="w-5 h-5" />,
              onClick: async () => {
                const url = `${window.location.origin}/${list.user?.username}/${list.public_id || list.id}`
                await navigator.clipboard.writeText(url)
                setShowCopySuccess(true)
                setTimeout(() => setShowCopySuccess(false), 2000)
              },
              className: "w-icon-button h-icon-button p-0 flex items-center justify-center"
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
              icon: isSaved ? (
                <StarIcon className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5" />
              ),
              onClick: handleSave,
              className: "w-icon-button h-icon-button p-0 flex items-center justify-center"
            },
            {
              type: 'custom',
              icon: <DocumentDuplicateIcon className="w-5 h-5" />,
              onClick: handleCopy,
              className: "w-icon-button h-icon-button p-0 flex items-center justify-center"
            },
            ...(isOwner ? [{
              type: 'custom' as const,
              label: 'Dashboard',
              onClick: () => router.push('/dashboard'),
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors"
            }] : [])
          ] : [
            {
              type: 'custom',
              label: 'Make a Snack',
              onClick: handleLogin,
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors"
            }
          ]}
        />
      )}
      
      <div className="mx-auto pt-6 md:pt-12 pb-[120px] max-w-[560px] px-4 md:px-0">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Emoji */}
          <div className="w-12 h-12">
            <span className="text-5xl">{list.emoji}</span>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium text-foreground break-words leading-tight">
              {list.title || 'Untitled List'}
            </h1>
            {list.description && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {list.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-row items-center justify-between gap-3">
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
                      />
                    ) : (
                      <DefaultAvatar size={24} />
                    )}
                  </div>
                  <span className="font-medium text-muted-foreground">{displayName}</span>
                </Link>
              )}
            </div>

            {/* Right: Links, Time, Saves */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{getRelativeTime(list.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{list.links?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">{formatCount(list.save_count || 0)}</span>
              </div>
            </div>
          </div>

          {/* Links List or Paywall */}
          {!hasAccess && !isListFree(list.price_cents) ? (
            <ListPaywall
              listId={list.id}
              title={list.title}
              emoji={list.emoji}
              priceCents={list.price_cents!}
              currency={(list.currency as Currency) || 'usd'}
              creatorName={displayName}
            />
          ) : (
            <div className="space-y-6">
              {list.links && list.links.length > 0 ? (
                list.links.map((link, index) => (
                  <PublicLinkItem
                    key={link.id}
                    link={link}
                    onClick={() => handleLinkClick(link.id, link.url)}
                    isClicked={clickedLinks.has(link.id)}
                    index={index}
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
          )}
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
  hasAnimated: boolean
  prefersReducedMotion: boolean
}

const PublicLinkItem = memo(function PublicLinkItem({
  link,
  onClick,
  isClicked,
  index,
  hasAnimated,
  prefersReducedMotion
}: PublicLinkItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  // Card layout - largest cards with OG images (exact match to edit view)
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      initial={hasAnimated || prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={hasAnimated || prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col gap-3 cursor-pointer group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
    >
      {/* OG Image Preview */}
      <div className="aspect-video bg-accent relative rounded-md overflow-hidden shadow-[0_2px_2px_0_rgba(0,0,0,0.25)]">
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
        <p className="text-sm text-muted-foreground flex-shrink-0">
          {getHostname(link.url)}
        </p>
      </div>
    </motion.div>
  )
})
