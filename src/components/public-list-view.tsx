'use client'

import { useState } from 'react'
import { Copy, Clock, Link as LinkIcon, Eye, Bookmark } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ListWithLinks, Link as LinkType, Emoji3D } from '@/types'
import { getHostname } from '@/lib/url-utils'

interface PublicListViewProps {
  list: ListWithLinks
  onLoginClick?: () => void
}

export function PublicListView({ list, onLoginClick }: PublicListViewProps) {
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set())

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

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <h1 
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Open Runde' }}
                >
                  Snack
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontFamily: 'Open Runde' }}
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                style={{ fontFamily: 'Open Runde' }}
              >
                Login (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* List Header */}
          <div className="space-y-6">
            {/* Emoji */}
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
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
            
            {/* Creator and metadata */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">R</span>
                </div>
                <span 
                  className="text-foreground font-medium"
                  style={{ fontFamily: 'Open Runde' }}
                >
                  {list.user.username}
                </span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <button className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <span style={{ fontFamily: 'Open Runde' }}>Save</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <span style={{ fontFamily: 'Open Runde' }}>Share</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                <Clock className="w-4 h-4" />
                <span>Last updated 6 hours ago</span>
              </div>
              <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                <LinkIcon className="w-4 h-4" />
                <span>11</span>
              </div>
              <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                <Eye className="w-4 h-4" />
                <span>7.2K</span>
              </div>
              <div className="flex items-center gap-1" style={{ fontFamily: 'Open Runde' }}>
                <Bookmark className="w-4 h-4" />
                <span>2.4K</span>
              </div>
            </div>
          </div>

          {/* Links List */}
          <div className="space-y-3">
            {list.links?.map((link, index) => (
              <PublicLinkItem
                key={link.id}
                link={link}
                onClick={() => handleLinkClick(link.id, link.url)}
                isClicked={clickedLinks.has(link.id)}
                index={index}
              />
            ))}
          </div>
          
          {(!list.links || list.links.length === 0) && (
            <div className="py-12 text-muted-foreground">
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
}

function PublicLinkItem({ 
  link, 
  onClick, 
  isClicked, 
  index 
}: PublicLinkItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`w-full bg-white rounded-xl p-4 hover:bg-gray-50 transition-all cursor-pointer group text-left ${
        isClicked ? 'ring-2 ring-blue-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
          {link.favicon_url ? (
            <Image 
              src={link.favicon_url} 
              alt="" 
              width={24}
              height={24}
              className="w-6 h-6 object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-blue-100 rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-400 rounded-sm" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="text-base font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors"
            style={{ fontFamily: 'Open Runde' }}
          >
            {link.title || getHostname(link.url)}
          </h3>
        </div>
        
        <div className="text-sm text-gray-400 flex-shrink-0" style={{ fontFamily: 'Open Runde' }}>
          {getHostname(link.url)}
        </div>
      </div>
    </motion.button>
  )
}