'use client'

import { useState, useEffect } from 'react'
import { Copy, Clock, Link as LinkIcon, Eye, Bookmark, Edit, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { ListWithLinks, Link as LinkType } from '@/types'
import { getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { useAuth } from '@/hooks/useAuth'
import { Header } from './header'
import { generateListMetadata } from '@/lib/json-ld'

type ViewMode = 'menu' | 'rows' | 'grid'

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
  const router = useRouter()
  const { user } = useAuth()

  // Get view mode from list data, default to 'menu' if not set
  const viewMode: ViewMode = (list.view_mode as ViewMode) || 'menu'

  // Generate metadata for LLM consumption
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://snack.com'
  const metadata = generateListMetadata(list, baseUrl)
  
  // Debug logging to see what data we have
  console.log('PublicListView debug:', {
    listUser: list.user,
    currentUser: user,
    listUserId: list.user_id,
    currentUserId: user?.id,
    isOwner: user && list.user_id === user.id,
    viewMode,
    listViewMode: list.view_mode
  })
  
  // Get display name - prioritize current user's data for their own lists
  const isOwner = user && list.user_id === user.id
  
  let displayName = 'Unknown User'
  let displayInitial = 'U'
  
  if (isOwner && user) {
    // Use current user's name data for their own lists
    if (user.first_name && user.last_name) {
      displayName = `${user.first_name} ${user.last_name}`
      displayInitial = user.first_name[0]?.toUpperCase() || 'U'
    } else if (user.first_name) {
      displayName = user.first_name
      displayInitial = user.first_name[0]?.toUpperCase() || 'U'
    } else if (user.username) {
      displayName = user.username
      displayInitial = user.username.startsWith('@') ? user.username[1]?.toUpperCase() : user.username[0]?.toUpperCase() || 'U'
    }
  } else if (list.user) {
    // Use stored list user data for other users' lists
    displayName = list.user.username || 'Unknown User'
    displayInitial = displayName.startsWith('@') ? displayName[1]?.toUpperCase() : displayName[0]?.toUpperCase() || 'U'
  }
  
  // Get profile picture - use current user's profile picture if this is their list
  const profilePictureUrl = (user && list.user_id === user.id ? user.profile_picture_url : null) || null

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
      console.error('Failed to track click:', error)
    }
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // Silently handle error
    }
  }

  const handleLogin = () => {
    router.push('/auth/sign-in')
  }

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
        console.error('Failed to track view:', error)
      }
    }

    trackView()
  }, [list.id])

  // Update document meta tags dynamically
  useEffect(() => {
    // Update document title
    document.title = metadata.title

    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attr}="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Set primary meta tags
    setMetaTag('title', metadata.title)
    setMetaTag('description', metadata.description)
    if (metadata.keywords) {
      setMetaTag('keywords', metadata.keywords)
    }

    // Set Open Graph tags
    setMetaTag('og:type', metadata.type, true)
    setMetaTag('og:url', metadata.url, true)
    setMetaTag('og:title', metadata.title, true)
    setMetaTag('og:description', metadata.description, true)
    setMetaTag('og:site_name', metadata.siteName, true)
    if (metadata.image) {
      setMetaTag('og:image', metadata.image, true)
    }

    // Set Twitter tags
    setMetaTag('twitter:card', 'summary_large_image', true)
    setMetaTag('twitter:url', metadata.url, true)
    setMetaTag('twitter:title', metadata.title, true)
    setMetaTag('twitter:description', metadata.description, true)
    setMetaTag('twitter:creator', metadata.creator, true)
    if (metadata.image) {
      setMetaTag('twitter:image', metadata.image, true)
    }
  }, [metadata])

  return (
    <>
      {/* JSON-LD Structured Data for LLM Consumption */}
      <Script
        id="list-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(metadata.jsonLd),
        }}
      />
      <div className="min-h-screen bg-background">
      {isOwner ? (
        <Header
          logoHref="/dashboard"
          username={user?.username}
          buttons={[
            {
              type: 'custom',
              label: 'Edit',
              icon: <Edit className="w-4 h-4" />,
              onClick: () => {
                const username = user?.username || list.user?.username
                router.push(`/${username}/${list.public_id || list.id}`)
              },
              className: "flex items-center gap-2 px-4 py-2 text-base font-medium border border-border text-muted-foreground hover:text-foreground transition-colors rounded-sm"
            },
            {
              type: 'custom',
              label: 'Stats',
              icon: <BarChart3 className="w-4 h-4" />,
              onClick: () => {
                // TODO: Navigate to stats view
                console.log('View stats')
              },
              className: "flex items-center gap-2 px-4 py-2 text-base font-medium border border-border text-muted-foreground hover:text-foreground transition-colors rounded-sm"
            },
            {
              type: 'copy',
              onClick: async () => {
                const url = `${window.location.origin}/${list.user?.username}/${list.public_id || list.id}`
                await navigator.clipboard.writeText(url)
              }
            }
          ]}
        />
      ) : (
        <Header
          logoHref="/"
          username={user?.username}
          buttons={user ? [
            {
              type: 'custom',
              label: 'Dashboard',
              onClick: () => router.push('/dashboard'),
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
            }
          ] : [
            {
              type: 'custom',
              label: 'Make a Snack',
              onClick: handleLogin,
              className: "px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
            }
          ]}
        />
      )}
      
      <div className="mx-auto py-12 max-w-[560px]">
        <div className="flex flex-col gap-6">
          {/* Emoji */}
          <div className="w-12 h-12">
            <span className="text-5xl">{list.emoji}</span>
          </div>

          {/* Title and Creator */}
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-normal text-foreground break-words leading-[1.5]">
              {list.title || 'Untitled List'}
            </h1>

            {/* Creator */}
            {list.user?.username && (
              <Link
                href={`/${list.user.username}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors text-base w-fit"
              >
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                  {profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt={`${displayName}'s profile`}
                      width={16}
                      height={16}
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
                    className="text-white text-[8px] font-bold"
                    style={{ display: profilePictureUrl ? 'none' : 'flex' }}
                  >
                    {displayInitial}
                  </span>
                </div>
                <span className="font-medium text-neutral-600">{displayName}</span>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-start justify-between">
            {/* Left: Today */}
            <div className="bg-muted rounded-md px-3 py-1.5 h-9 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-base text-muted-foreground">Today</span>
            </div>

            {/* Right: Links, Views, Saves */}
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-md px-3 py-1.5 h-9 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-muted-foreground">{list.links?.length || 0}</span>
              </div>
              <div className="bg-muted rounded-md px-3 py-1.5 h-9 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-muted-foreground">69K</span>
              </div>
              <div className="bg-muted rounded-md px-3 py-1.5 h-9 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-muted-foreground">{formatCount(list.save_count || 0)}</span>
              </div>
            </div>
          </div>

          {/* Links List */}
          <div className="space-y-0">
            {list.links && list.links.length > 0 ? (
              list.links.map((link, index) => (
                <PublicLinkItem
                  key={link.id}
                  link={link}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  isClicked={clickedLinks.has(link.id)}
                  index={index}
                  viewMode="menu"
                  hasAnimated={hasAnimated}
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
    </>
  )
}

interface PublicLinkItemProps {
  link: LinkType
  onClick: () => void
  isClicked: boolean
  index: number
  viewMode: ViewMode
  hasAnimated: boolean
}

function PublicLinkItem({ 
  link, 
  onClick, 
  isClicked, 
  index,
  viewMode,
  hasAnimated
}: PublicLinkItemProps) {
  
  if (viewMode === 'menu') {
    // Public list view layout with domain on right
    return (
      <div
        className="flex items-center justify-between py-3 hover:bg-accent/50 transition-colors group cursor-pointer border-b border-border last:border-0"
        onClick={onClick}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
            <Favicon
              url={link.url}
              size={16}
              className="rounded-sm"
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

  if (viewMode === 'rows') {
    // Larger cards as rows - medium layout (exact match to edit view)
    return (
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={hasAnimated ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
        className="bg-muted rounded-2xl p-4 hover:bg-accent transition-all cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="w-[100px] h-14 rounded-xl overflow-hidden bg-accent flex-shrink-0 relative">
            {link.image_url ? (
              <>
                <Image 
                  src={link.image_url} 
                  alt="" 
                  fill
                  className="object-cover"
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
                  className="w-full h-full bg-background flex items-center justify-center absolute inset-0"
                  style={{ display: 'none' }}
                >
                  <Favicon
                    url={link.url}
                    size={24}
                    className="rounded-md"
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-background flex items-center justify-center">
                <Favicon 
                  url={link.url}
                  size={24}
                  className="rounded-md"
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-semibold text-foreground truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.title || getHostname(link.url)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                <Favicon 
                  url={link.url}
                  size={16}
                  className="rounded-sm"
                />
              </div>
              <p 
                className="text-sm text-muted-foreground/80 truncate"
                style={{ fontFamily: 'Open Runde' }}
              >
                {getHostname(link.url)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Grid layout - largest cards (exact match to edit view)
  return (
    <motion.div
      initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={hasAnimated ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
      className="bg-muted rounded-xl hover:bg-accent transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* OG Image Preview */}
        <div className="aspect-video bg-accent relative">
          {link.image_url ? (
            <>
              <Image 
                src={link.image_url} 
                alt={link.title || ''} 
                fill
                className="object-cover"
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
                className="w-full h-full bg-background flex items-center justify-center absolute inset-0"
                style={{ display: 'none' }}
              >
                <Favicon
                  url={link.url}
                  size={48}
                  className="rounded-lg"
                  fallbackClassName="bg-muted/20 rounded-lg"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-background flex items-center justify-center">
              <Favicon 
                url={link.url}
                size={48}
                className="rounded-lg"
                fallbackClassName="bg-muted/20 rounded-lg"
              />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4 space-y-2">
          <h3 
            className="font-semibold text-foreground text-base leading-tight truncate"
            style={{ fontFamily: 'Open Runde' }}
          >
            {link.title || getHostname(link.url)}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex-shrink-0">
              <Favicon 
                url={link.url}
                size={16}
                className="rounded-sm"
              />
            </div>
            <p 
              className="text-sm text-muted-foreground/70 truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {getHostname(link.url)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}