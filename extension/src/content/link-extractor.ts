import { INTERNAL_TWITTER_DOMAINS } from '@/shared/constants'
import type { ExtractedLink } from '@/shared/types'

// Check if a URL is an internal Twitter link
function isInternalTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    return INTERNAL_TWITTER_DOMAINS.some(
      (domain: string) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return true // If we can't parse, assume internal
  }
}

// Extract expanded URL from a link element
// Twitter stores the expanded URL in various places
function getExpandedUrl(linkElement: HTMLAnchorElement): string | null {
  // Method 1: Check title attribute (Twitter often puts full URL here)
  const title = linkElement.getAttribute('title')
  if (title && (title.startsWith('http://') || title.startsWith('https://'))) {
    return title
  }

  // Method 2: Check for card data (for Twitter cards)
  const cardUrl = linkElement.getAttribute('data-url')
  if (cardUrl) {
    return cardUrl
  }

  // Method 3: Check aria-label which sometimes has the URL
  const ariaLabel = linkElement.getAttribute('aria-label')
  if (ariaLabel && (ariaLabel.startsWith('http://') || ariaLabel.startsWith('https://'))) {
    return ariaLabel
  }

  // Method 4: Check the visible text if it looks like a full URL
  const text = linkElement.textContent?.trim() || ''
  if (text.match(/^https?:\/\//)) {
    return text
  }

  // Method 5: Check for span with dir="ltr" which often contains the display URL
  const displaySpan = linkElement.querySelector('span[dir="ltr"]')
  const spanText = displaySpan?.textContent?.trim() || text

  // Method 6: If display text looks like a domain/URL (even truncated), try to extract
  // Handle truncation markers: … (unicode) or ... (ascii)
  const cleanText = spanText.replace(/…$/, '').replace(/\.\.\.$/, '').trim()

  if (cleanText && !cleanText.includes(' ')) {
    // Check if it's already a valid URL format
    if (cleanText.match(/^https?:\/\//)) {
      return cleanText
    }
    // If it looks like a domain, prepend https://
    if (cleanText.includes('.') && !cleanText.startsWith('@') && !cleanText.startsWith('#')) {
      return `https://${cleanText}`
    }
  }

  return null
}

// Extract all external links from a tweet element
export function extractLinksFromTweet(tweetElement: Element): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const seenUrls = new Set<string>()

  // Find the tweet text container (avoid picking up links from other parts like profile, etc.)
  const tweetTextContainer = tweetElement.querySelector('[data-testid="tweetText"]')

  // Find all links - both t.co and direct links
  // Search in tweet text first, then fall back to entire element
  const searchContainer = tweetTextContainer || tweetElement
  const linkElements = searchContainer.querySelectorAll<HTMLAnchorElement>('a[href]')

  for (const linkElement of linkElements) {
    const href = linkElement.href

    // Skip empty hrefs
    if (!href) continue

    // Skip hashtags and mentions
    if (href.includes('/hashtag/') || href.includes('/search?')) continue
    if (linkElement.textContent?.trim().startsWith('@')) continue
    if (linkElement.textContent?.trim().startsWith('#')) continue

    // Try to get the expanded URL
    let expandedUrl = getExpandedUrl(linkElement)

    // If no expanded URL found but href is a t.co link, skip (we need the expanded version)
    if (!expandedUrl && href.includes('t.co/')) {
      continue
    }

    // If no expanded URL and href is not t.co, use href directly
    if (!expandedUrl) {
      expandedUrl = href
    }

    // Normalize the URL
    const normalizedUrl = expandedUrl.toLowerCase()

    // Skip if we've already seen this URL (normalized)
    if (seenUrls.has(normalizedUrl)) {
      continue
    }

    // Skip internal Twitter URLs
    if (isInternalTwitterUrl(expandedUrl)) {
      continue
    }

    seenUrls.add(normalizedUrl)

    links.push({
      url: href,
      expandedUrl: expandedUrl,
      displayText: linkElement.textContent?.trim() || expandedUrl,
    })
  }

  // Also check for Twitter card links (embedded preview cards)
  const cardLinks = tweetElement.querySelectorAll<HTMLAnchorElement>(
    '[data-testid="card.wrapper"] a[href], [data-testid="card.layoutLarge.media"] a[href], [data-testid="card.layoutSmall.media"] a[href]'
  )

  for (const cardLink of cardLinks) {
    let url = cardLink.href

    // Card links might be t.co links
    if (url.includes('t.co')) {
      const expandedUrl = getExpandedUrl(cardLink)
      if (expandedUrl) {
        url = expandedUrl
      }
    }

    const normalizedUrl = url.toLowerCase()

    // Skip internal and already seen
    if (seenUrls.has(normalizedUrl) || isInternalTwitterUrl(url)) {
      continue
    }
    seenUrls.add(normalizedUrl)

    links.push({
      url: url,
      expandedUrl: url,
      displayText: cardLink.textContent?.trim() || url,
    })
  }

  return links
}

// Get tweet ID from tweet element
export function getTweetId(tweetElement: Element): string | null {
  // Method 1: Check for status link
  const statusLink = tweetElement.querySelector<HTMLAnchorElement>(
    'a[href*="/status/"]'
  )
  if (statusLink) {
    const match = statusLink.href.match(/\/status\/(\d+)/)
    if (match) {
      return match[1]
    }
  }

  // Method 2: Check time element's parent link
  const timeLink = tweetElement.querySelector<HTMLAnchorElement>('time')?.closest('a')
  if (timeLink) {
    const match = timeLink.href.match(/\/status\/(\d+)/)
    if (match) {
      return match[1]
    }
  }

  // Method 3: Generate a pseudo-ID based on position
  return null
}
