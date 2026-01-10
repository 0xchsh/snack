// Reserved words that cannot be used as usernames to prevent route conflicts
const RESERVED_WORDS = new Set([
  // Static app routes
  'auth', 'api', 'profile', 'dashboard', 'demo', 'u', 'list',
  'public-demo', 'dashboard-simple',

  // System routes
  'admin', 'administrator', 'root', 'www', 'mail', 'ftp',
  'assets', 'static', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',

  // Marketing routes (current and future)
  'about', 'help', 'support', 'contact', 'terms', 'privacy',
  'pricing', 'blog', 'features', 'faq', 'discover', 'explore',
  'careers', 'jobs', 'press', 'brand', 'changelog', 'updates',
  'docs', 'documentation', 'developers', 'dev',

  // Auth-related routes
  'settings', 'account', 'login', 'logout', 'signup', 'signin',
  'register', 'forgot', 'reset', 'verify', 'confirm',
  'home', 'index', 'main', 'app', 'application',

  // HTTP methods and common tech terms
  'get', 'post', 'put', 'delete', 'patch', 'head', 'options',
  'null', 'undefined', 'true', 'false', 'admin', 'test', 'staging',

  // Potential brand conflicts
  'snack', 'snacks', 'lists', 'list', 'links', 'link',

  // Purchase/commerce routes
  'purchase', 'checkout', 'buy', 'pay', 'billing', 'invoice',

  // Misc reserved
  'feed', 'trending', 'popular', 'new', 'search', 'notifications',
  'messages', 'inbox', 'activity', 'analytics', 'stats'
])

/**
 * Check if a username is reserved and cannot be used
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_WORDS.has(username.toLowerCase())
}

/**
 * Validate username format and availability
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Check length
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' }
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' }
  }
  
  // Check format: alphanumeric, hyphens, underscores only
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(username)
  if (!validFormat) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' }
  }
  
  // Cannot start or end with hyphen/underscore
  if (username.startsWith('-') || username.startsWith('_') || 
      username.endsWith('-') || username.endsWith('_')) {
    return { valid: false, error: 'Username cannot start or end with hyphens or underscores' }
  }
  
  // Cannot have consecutive hyphens/underscores
  if (username.includes('--') || username.includes('__') || username.includes('_-') || username.includes('-_')) {
    return { valid: false, error: 'Username cannot contain consecutive special characters' }
  }
  
  // Check if reserved
  if (isReservedUsername(username)) {
    return { valid: false, error: 'This username is reserved and cannot be used' }
  }
  
  return { valid: true }
}

/**
 * Check if a given path segment could be a username
 * This is used in middleware to determine routing
 */
export function couldBeUsername(segment: string): boolean {
  // Quick check: if it's clearly a reserved word, return false
  if (isReservedUsername(segment)) {
    return false
  }
  
  // Basic format check
  const basicFormatValid = /^[a-zA-Z0-9_-]+$/.test(segment) && 
                          segment.length >= 3 && 
                          segment.length <= 30
  
  return basicFormatValid
}

/**
 * Normalize username for consistent storage and comparison
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim()
}