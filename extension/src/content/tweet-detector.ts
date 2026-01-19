import { TWITTER_SELECTORS } from '@/shared/constants'
import { extractLinksFromTweet, getTweetId } from './link-extractor'
import type { TweetData } from '@/shared/types'

type TweetCallback = (tweet: TweetData) => void

// Set to track processed tweets
const processedTweets = new Set<string>()

// Generate a unique key for a tweet element
function getTweetKey(element: Element): string {
  const tweetId = getTweetId(element)
  if (tweetId) {
    return `tweet-${tweetId}`
  }

  // Fallback: use a hash of the element's content
  const text = element.textContent?.slice(0, 200) || ''
  return `tweet-${hashString(text)}`
}

// Simple string hash
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// Process a single tweet element
function processTweet(element: Element, callback: TweetCallback): void {
  const tweetKey = getTweetKey(element)

  // Skip if already processed
  if (processedTweets.has(tweetKey)) {
    return
  }

  // Extract links
  const links = extractLinksFromTweet(element)

  console.log('[Snack] Processing tweet:', tweetKey, '- found', links.length, 'external links')
  if (links.length > 0) {
    console.log('[Snack] Links found:', links.map(l => l.expandedUrl))
  }

  // Skip tweets without external links
  if (links.length === 0) {
    // Mark as processed even if no links, to avoid re-checking
    processedTweets.add(tweetKey)
    return
  }

  // Mark as processed
  processedTweets.add(tweetKey)

  const tweetId = getTweetId(element)
  if (!tweetId) {
    console.log('[Snack] Could not get tweet ID for:', tweetKey)
    return
  }

  console.log('[Snack] Calling callback for tweet:', tweetId)
  callback({
    tweetId,
    links,
    element,
  })
}

// Find and process all tweets on page
function processExistingTweets(callback: TweetCallback): void {
  const tweets = document.querySelectorAll(TWITTER_SELECTORS.tweet)
  tweets.forEach((tweet) => processTweet(tweet, callback))
}

// Create MutationObserver to detect new tweets
function createTweetObserver(callback: TweetCallback): MutationObserver {
  return new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue
        }

        // Check if the added node is a tweet
        if (node.matches(TWITTER_SELECTORS.tweet)) {
          processTweet(node, callback)
        }

        // Check for tweets within the added node
        const tweets = node.querySelectorAll(TWITTER_SELECTORS.tweet)
        tweets.forEach((tweet) => processTweet(tweet, callback))
      }
    }
  })
}

// Start detecting tweets
export function startTweetDetection(callback: TweetCallback): () => void {
  // Process existing tweets
  processExistingTweets(callback)

  // Create observer for new tweets
  const observer = createTweetObserver(callback)

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Return cleanup function
  return () => {
    observer.disconnect()
    processedTweets.clear()
  }
}

// Force re-process all tweets (useful after auth state change)
export function reprocessAllTweets(callback: TweetCallback): void {
  processedTweets.clear()
  processExistingTweets(callback)
}
