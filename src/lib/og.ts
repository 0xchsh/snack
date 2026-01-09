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

    let html: string | null = null
    let response: Response | undefined

    {
      const { signal, cleanup } = createTimeoutSignal(10000)
      try {
        response = await fetch(url, {
          headers: {
            // Use a common desktop browser user agent to avoid being blocked by CDNs/bot filters
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          ...(signal && { signal }),
        })
      } catch (error) {
        console.warn('Direct OG fetch error, falling back to proxy', { url, error })
      } finally {
        cleanup?.()
      }
    }

    if (response?.ok) {
      html = await response.text()
    } else if (response) {
      console.warn('Direct OG fetch failed, falling back to proxy', { url, status: response.status })
    }

    if (!html) {
      html = await fetchHtmlViaProxy(urlObj)
    }

    if (!html) {
      throw new Error(`Failed to fetch HTML for OG parsing (status: ${response?.status ?? 'unknown'})`)
    }

    const ogData = parseOGTags(html, urlObj)

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
 * @param baseUrl The base URL used to resolve relative paths
 * @returns Parsed OG data
 */
function parseOGTags(html: string, baseUrl: URL): OGData {
  const ogData: OGData = {
    title: null,
    description: null,
    image_url: null,
    favicon_url: null,
    site_name: null
  }

  // Simple regex-based parsing (not perfect but works for basic cases)
  const tags = html.match(/<(meta|link)[^>]+>/gi) || []

  for (const tag of tags) {
    const propertyMatch = tag.match(/property\s*=\s*["']([^"']+)["']/i)
    const nameMatch = tag.match(/name\s*=\s*["']([^"']+)["']/i)
    const itempropMatch = tag.match(/itemprop\s*=\s*["']([^"']+)["']/i)
    const relMatch = tag.match(/rel\s*=\s*["']([^"']+)["']/i)
    const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i)
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i)

    const key = (propertyMatch?.[1] || nameMatch?.[1] || itempropMatch?.[1])?.toLowerCase()
    const content = contentMatch?.[1] ? decodeHtmlEntities(contentMatch[1]) : null

    if (key && content) {
      switch (key) {
        case 'og:title':
        case 'twitter:title':
          if (!ogData.title) {
            ogData.title = content
          }
          break
        case 'og:description':
        case 'twitter:description':
        case 'description':
          if (!ogData.description) {
            ogData.description = content
          }
          break
        case 'og:image':
        case 'og:image:url':
        case 'og:image:secure_url':
          ogData.image_url = resolveUrl(content, baseUrl)
          break
        case 'twitter:image':
        case 'twitter:image:src':
        case 'image':
          if (!ogData.image_url) {
            ogData.image_url = resolveUrl(content, baseUrl)
          }
          break
        case 'og:site_name':
          ogData.site_name = content
          break
        case 'og:url':
          if (!ogData.site_name) {
            try {
              const resolvedUrl = resolveUrl(content, baseUrl)
              ogData.site_name = new URL(resolvedUrl).hostname
            } catch {
              // Ignore malformed URLs
            }
          }
          break
      }
    }

    if (relMatch && hrefMatch?.[1] && relMatch[1]?.toLowerCase().includes('icon')) {
      ogData.favicon_url = resolveUrl(hrefMatch[1], baseUrl)
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

function resolveUrl(url: string, baseUrl: URL): string {
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
}

function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal | null; cleanup?: () => void } {
  const abortSignalTimeout = (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal })?.timeout
  if (typeof abortSignalTimeout === 'function') {
    return { signal: abortSignalTimeout(timeoutMs) }
  }

  if (typeof AbortController === 'undefined') {
    return { signal: null }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  }
}

async function fetchHtmlViaProxy(url: URL): Promise<string | null> {
  try {
    const proxyUrl = buildProxyUrl(url)
    const { signal, cleanup } = createTimeoutSignal(10000)
    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        ...(signal && { signal }),
      })

      if (!response.ok) {
        console.warn('Proxy OG fetch failed', { url: url.toString(), status: response.status })
        return null
      }

      return await response.text()
    } finally {
      cleanup?.()
    }
  } catch (error) {
    console.error('Proxy fetch error', error)
    return null
  }
}

function buildProxyUrl(url: URL): string {
  const stripped = url.toString().replace(/^https?:\/\//i, '')
  return `https://r.jina.ai/http://${stripped}`
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
      image_url: getScreenshotFallback(url),
      favicon_url: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
      site_name: urlObj.hostname
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

function getScreenshotFallback(url: string): string {
  return `https://v1.screenshot.11ty.dev/${encodeURIComponent(url)}/opengraph/`
}
