/**
 * Validates if a string is a valid URL
 * @param url The URL string to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Normalizes a URL by adding https:// if missing
 * @param url The URL string to normalize
 * @returns Normalized URL string
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  
  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // Add https:// if it looks like a domain
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`
  }
  
  return trimmed
}

/**
 * Validates and normalizes a URL
 * @param url The URL string to process
 * @returns Object with success status and normalized URL or error
 */
export function validateAndNormalizeUrl(url: string): { 
  isValid: boolean
  normalizedUrl?: string
  error?: string 
} {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL cannot be empty' }
  }

  const normalized = normalizeUrl(url)
  
  if (!isValidUrl(normalized)) {
    return { isValid: false, error: 'Invalid URL format' }
  }

  return { isValid: true, normalizedUrl: normalized }
}

/**
 * Safely gets hostname from URL without throwing
 * @param url The URL string
 * @returns hostname or fallback
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Generates a favicon URL for a domain
 * @param url The URL to get favicon for
 * @returns Favicon URL
 */
export function getFaviconUrl(url: string): string {
  const hostname = getHostname(url)
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
}