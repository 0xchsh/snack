'use client'

import { useState, useEffect } from 'react'
import { Copy, Clock, Link as LinkIcon, Eye, Bookmark } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ListWithLinks, Link as LinkType } from '@/types'
import { getHostname } from '@/lib/url-utils'
import { Favicon } from './favicon'
import { useAuth } from '@/hooks/useAuth'

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

  const handleLinkClick = (linkId: string, url: string) => {
    setClickedLinks(prev => new Set(prev).add(linkId))
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo.svg"
                alt="Snack"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </Link>
            
            {user ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                style={{ fontFamily: 'Open Runde' }}
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                style={{ fontFamily: 'Open Runde' }}
              >
                Make a Snack
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className={`${viewMode === 'grid' ? 'w-full' : 'max-w-2xl mx-auto'} space-y-8`}>
          {/* List Header */}
          <div className={`${viewMode === 'grid' ? 'max-w-2xl mx-auto' : ''} space-y-6`}>
            {/* Emoji */}
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              {list.emoji_3d?.url ? (
                <Image
                  src={list.emoji_3d.url}
                  alt={list.emoji_3d.name || 'emoji'}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  unoptimized
                />
              ) : (
                <span>{list.emoji}</span>
              )}
            </div>
            
            {/* Title */}
            <h1 
              className="text-6xl font-bold text-foreground capitalize break-words max-w-2xl"
              style={{ 
                fontFamily: 'Open Runde',
                letterSpacing: '-2.24px',
                lineHeight: '100%'
              }}
            >
              {list.title}
            </h1>
            
            {/* Creator and buttons */}
            <div className="flex items-center justify-between">
              {list.user?.username ? (
                <Link 
                  href={`/${list.user.username}`}
                  className="flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-2 hover:bg-neutral-200 transition-colors"
                >
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                    {profilePictureUrl ? (
                      <Image
                        src={profilePictureUrl}
                        alt={`${displayName}'s profile`}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide failed image and show fallback
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-white text-xs font-bold"
                      style={{ display: profilePictureUrl ? 'none' : 'flex' }}
                    >
                      {displayInitial}
                    </span>
                  </div>
                  <span 
                    className="text-foreground font-semibold text-base"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    {displayName}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-2">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                    {profilePictureUrl ? (
                      <Image
                        src={profilePictureUrl}
                        alt={`${displayName}'s profile`}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide failed image and show fallback
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-white text-xs font-bold"
                      style={{ display: profilePictureUrl ? 'none' : 'flex' }}
                    >
                      {displayInitial}
                    </span>
                  </div>
                  <span 
                    className="text-foreground font-semibold text-base"
                    style={{ fontFamily: 'Open Runde' }}
                  >
                    {displayName}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={user ? undefined : handleLogin}
                  className="px-4 py-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                >
                  <span style={{ fontFamily: 'Open Runde' }}>Save</span>
                </button>
                <button 
                  onClick={user ? undefined : handleLogin}
                  className="px-4 py-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                >
                  <span style={{ fontFamily: 'Open Runde' }}>Share</span>
                </button>
              </div>
            </div>

            {/* Stats - Split between left and right */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                <Clock className="w-4 h-4" />
                <span>Last updated 6 hours ago</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                  <LinkIcon className="w-4 h-4" />
                  <span>{list.links?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                  <Eye className="w-4 h-4" />
                  <span>0</span>
                </div>
                <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                  <Bookmark className="w-4 h-4" />
                  <span>{formatCount(list.save_count || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Links List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-6">
              {list.links?.map((link, index) => (
                <PublicLinkItem
                  key={link.id}
                  link={link}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  isClicked={clickedLinks.has(link.id)}
                  index={index}
                  viewMode={viewMode}
                  hasAnimated={hasAnimated}
                />
              ))}
            </div>
          ) : (
            <div className={viewMode === 'rows' ? 'space-y-6' : 'space-y-3'}>
              {list.links?.map((link, index) => (
                <PublicLinkItem
                  key={link.id}
                  link={link}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  isClicked={clickedLinks.has(link.id)}
                  index={index}
                  viewMode={viewMode}
                  hasAnimated={hasAnimated}
                />
              ))}
            </div>
          )}
          
          {(!list.links || list.links.length === 0) && (
            <div className="py-12 text-muted-foreground text-center">
              <p style={{ fontFamily: 'Open Runde' }}>
                This list is empty
              </p>
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
    // Compact rows - smallest layout (exact match to edit view)
    return (
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={hasAnimated ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
        className="bg-neutral-100 rounded-xl p-3 hover:bg-neutral-200 transition-all cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Favicon 
              url={link.url}
              size={20}
              className="rounded-md"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-sm font-semibold text-foreground truncate"
              style={{ fontFamily: 'Open Runde' }}
            >
              {link.title || getHostname(link.url)}
            </h3>
          </div>
        </div>
      </motion.div>
    )
  }

  if (viewMode === 'rows') {
    // Larger cards as rows - medium layout (exact match to edit view)
    return (
      <motion.div
        initial={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={hasAnimated ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
        className="bg-neutral-100 rounded-2xl p-4 hover:bg-neutral-200 transition-all cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="w-[100px] h-14 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0 relative">
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
                  className="w-full h-full bg-neutral-50 flex items-center justify-center absolute inset-0"
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
              <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
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
      className="bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* OG Image Preview */}
        <div className="aspect-video bg-neutral-200 relative">
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
                className="w-full h-full bg-neutral-50 flex items-center justify-center absolute inset-0"
                style={{ display: 'none' }}
              >
                <Favicon 
                  url={link.url}
                  size={48}
                  className="rounded-lg"
                  fallbackClassName="bg-white/20 rounded-lg"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
              <Favicon 
                url={link.url}
                size={48}
                className="rounded-lg"
                fallbackClassName="bg-white/20 rounded-lg"
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