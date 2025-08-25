/**
 * Server-side OpenGraph fetching utilities
 */

export interface OGData {
  title: string | null
  description: string | null
  image_url: string | null
  favicon_url: string | null
  site_name: string | null
}

/**
 * Fetches OpenGraph data server-side
 * @param url The URL to fetch OG data for
 * @returns Promise with OG data
 */
export async function fetchOGData(url: string): Promise<OGData> {
  try {
    // Basic validation
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol')
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SnackBot/1.0; +https://snack.com/bot)'
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const ogData = parseOGTags(html)
    
    return {
      ...ogData,
      favicon_url: ogData.favicon_url || `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    }
  } catch (error) {
    console.error('Error fetching OG data:', error)
    return getDefaultOGData(url)
  }
}

/**
 * Parses OpenGraph tags from HTML content
 * @param html HTML content to parse
 * @returns Parsed OG data
 */
function parseOGTags(html: string): OGData {
  const ogData: OGData = {
    title: null,
    description: null,
    image_url: null,
    favicon_url: null,
    site_name: null
  }

  // Simple regex-based parsing (not perfect but works for basic cases)
  const metaTags = html.match(/<meta[^>]+>/gi) || []
  
  for (const tag of metaTags) {
    const propertyMatch = tag.match(/property\s*=\s*["']([^"']+)["']/i)
    const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i)
    
    if (propertyMatch && contentMatch) {
      const property = propertyMatch[1]?.toLowerCase()
      const content = contentMatch[1]
      
      if (!property || !content) continue
      
      switch (property) {
        case 'og:title':
          ogData.title = content
          break
        case 'og:description':
          ogData.description = content
          break
        case 'og:image':
          ogData.image_url = content
          break
        case 'og:site_name':
          ogData.site_name = content
          break
      }
    }
    
    // Also check for favicon
    const relMatch = tag.match(/rel\s*=\s*["']([^"']+)["']/i)
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i)
    
    if (relMatch && hrefMatch && relMatch[1]?.toLowerCase().includes('icon')) {
      ogData.favicon_url = hrefMatch[1] || null
    }
  }

  // Fallback to title tag if og:title not found
  if (!ogData.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      ogData.title = titleMatch[1].trim()
    }
  }

  // Fallback to meta description if og:description not found
  if (!ogData.description) {
    const descMatch = html.match(/<meta\s+name\s*=\s*["']description["']\s+content\s*=\s*["']([^"']+)["']/i)
    if (descMatch && descMatch[1]) {
      ogData.description = descMatch[1]
    }
  }

  return ogData
}

/**
 * Gets default OG data when fetching fails
 * @param url The URL to get default data for
 * @returns Default OG data
 */
function getDefaultOGData(url: string): OGData {
  try {
    const urlObj = new URL(url)
    
    return {
      title: urlObj.hostname,
      description: null,
      image_url: null,
      favicon_url: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
      site_name: null
    }
  } catch {
    return {
      title: null,
      description: null,
      image_url: null,
      favicon_url: null,
      site_name: null
    }
  }
}