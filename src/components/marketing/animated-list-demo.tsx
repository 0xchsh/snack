'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Link2, Star, User } from 'lucide-react'

const DEMO_LINKS = [
  {
    title: 'Linear',
    url: 'linear.app',
    favicon: 'https://www.google.com/s2/favicons?domain=linear.app&sz=32',
    ogImage: 'https://linear.app/static/og/home.jpg',
  },
  {
    title: 'Notion',
    url: 'notion.so',
    favicon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=32',
    ogImage: 'https://www.notion.so/front-static/meta/default.png',
  },
  {
    title: 'Raycast',
    url: 'raycast.com',
    favicon: 'https://www.google.com/s2/favicons?domain=raycast.com&sz=32',
    ogImage: 'https://www.raycast.com/opengraph-image-pwu6ef.png',
  },
  {
    title: 'Slack',
    url: 'slack.com',
    favicon: 'https://www.google.com/s2/favicons?domain=slack.com&sz=32',
    ogImage: 'https://a.slack-edge.com/b211f31/marketing/img/homepage/true-prospects/unfurl/slack-e2e-homepage-unfurl.jpg',
  },
  {
    title: 'Vercel',
    url: 'vercel.com',
    favicon: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=32',
    ogImage: 'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/4JmubmYDJnFtstwHbaZPev/23caf8c05363419bb2b94c6c53299cb0/og-dark.png',
  },
  {
    title: 'Stripe',
    url: 'stripe.com',
    favicon: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=32',
    ogImage: 'https://images.ctfassets.net/fzn2n1nzq965/3AGidihOJl4nH9D1vDjM84/9540155d584be52fc54c443b6efa4ae6/homepage.png?q=80',
  },
]

const DEMO_TITLE = 'Beautiful Websites'
const DEMO_EMOJI = '🌐'
const DEMO_AUTHOR = 'Charles'

type DemoLink = (typeof DEMO_LINKS)[number] & { id: string }

export function AnimatedListDemo() {
  const [links, setLinks] = useState<DemoLink[]>([])
  const [linkCount, setLinkCount] = useState(1)
  const indexRef = useRef(0)
  const idCounter = useRef(0)

  useEffect(() => {
    const addLink = () => {
      const nextIndex = indexRef.current % DEMO_LINKS.length
      const uniqueId = `link-${idCounter.current++}`
      const newLink = { ...DEMO_LINKS[nextIndex], id: uniqueId }

      setLinks(currentLinks => [newLink, ...currentLinks].slice(0, 3))
      setLinkCount(current => current >= 6 ? 2 : current + 1)
      indexRef.current++
    }

    // Add first link immediately
    addLink()

    const interval = setInterval(addLink, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="space-y-4">
        {/* Published Header - Emoji */}
        <div className="flex items-start">
          <span className="text-5xl">{DEMO_EMOJI}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-neutral-900 text-left">
          {DEMO_TITLE}
        </h1>

        {/* Author & Stats Row */}
        <div className="flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
              <User className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-sm text-neutral-500">{DEMO_AUTHOR}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>2m</span>
            </div>
            <div className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              <span>{linkCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Links - card view matching published UI with OG images */}
        <div className="space-y-6 pt-2 min-h-[240px]">
          <AnimatePresence initial={false}>
            {links.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  layout: { duration: 0.3, ease: 'easeOut' },
                }}
                className="flex flex-col gap-3"
              >
                {/* OG Image Preview */}
                <div className="aspect-video bg-neutral-100 rounded-md overflow-hidden">
                  <img
                    src={link.ogImage}
                    alt={link.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Site Info - matches PublicLinkItem exactly */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={link.favicon}
                      alt=""
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                    />
                    <span className="font-medium text-neutral-900 text-base truncate">
                      {link.title}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-400 flex-shrink-0">
                    {link.url}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
