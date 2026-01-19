// API Configuration
// For local development testing, set to true. For production, set to false.
const USE_LOCAL_API = true

export const API_BASE_URL = USE_LOCAL_API
  ? 'http://localhost:3000'
  : 'https://snack.xyz'

export const API_ENDPOINTS = {
  // Auth endpoints
  authorize: `${API_BASE_URL}/api/extension/auth/authorize`,
  token: `${API_BASE_URL}/api/extension/auth/token`,
  refresh: `${API_BASE_URL}/api/extension/auth/refresh`,
  revoke: `${API_BASE_URL}/api/extension/auth/revoke`,

  // Data endpoints
  lists: `${API_BASE_URL}/api/extension/lists`,
  addLinks: (listId: string) => `${API_BASE_URL}/api/extension/lists/${listId}/links`,
} as const

// Auth page for login flow
export const AUTH_PAGE_URL = `${API_BASE_URL}/extension/auth`

// Callback page URL (web-based to work with Arc and other browsers)
export const CALLBACK_URL = `${API_BASE_URL}/extension/callback`

// Storage keys
export const STORAGE_KEYS = {
  tokens: 'snack_tokens',
  user: 'snack_user',
  recentListId: 'snack_recent_list_id',
  listsCache: 'snack_lists_cache',
  listsCacheTime: 'snack_lists_cache_time',
} as const

// Cache configuration
export const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Token refresh buffer - refresh 5 minutes before expiry
export const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000

// Twitter DOM selectors
export const TWITTER_SELECTORS = {
  tweet: 'article[data-testid="tweet"]',
  // The action bar is the group containing reply, retweet, like, etc.
  // It's inside the tweet article and has role="group"
  tweetActions: '[role="group"]:has([data-testid="reply"]), [role="group"]:has([data-testid="like"])',
  tweetLink: 'a[href]',
  shareButton: '[data-testid="reply"], [data-testid="retweet"], [data-testid="like"]',
} as const

// Internal Twitter URLs to filter out
export const INTERNAL_TWITTER_DOMAINS = [
  'twitter.com',
  'x.com',
  't.co',
  'pic.twitter.com',
  'pbs.twimg.com',
  'video.twimg.com',
  'abs.twimg.com',
] as const

// Toast configuration
export const TOAST_DURATION = 2000 // 2 seconds
export const TOAST_ERROR_DURATION = 4000 // 4 seconds

// Default emoji for new lists
export const DEFAULT_LIST_EMOJI = '🎯'
