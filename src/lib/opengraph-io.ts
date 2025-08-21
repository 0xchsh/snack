/**
 * OpenGraph.io API integration for fetching Open Graph data
 */

interface OpenGraphIOResponse {
  hybridGraph?: {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: string
    site_name?: string
    favicon?: string
  }
  openGraph?: {
    title?: string
    description?: string
    image?: {
      url?: string
      width?: number
      height?: number
    }
    url?: string
    type?: string
    site_name?: string
  }
  htmlInferred?: {
    title?: string
    description?: string
    image?: string
    favicon?: string
  }
  requestInfo?: {
    success?: boolean
    error?: string
  }
}

interface OGData {
  title: string | null
  description: string | null
  image_url: string | null
  favicon_url: string | null
  site_name: string | null
}

/**
 * Fetches Open Graph data from OpenGraph.io API
 * @param url The URL to fetch OG data for
 * @returns Promise with OG data
 */
export async function fetchOpenGraphData(url: string): Promise<OGData> {
  const apiKey = process.env.OPENGRAPH_IO_API_KEY

  if (!apiKey || apiKey === 'your_opengraph_io_api_key_here') {
    console.warn('OpenGraph.io API key not configured, using fallback')
    return getFallbackOGData(url)
  }

  try {
    const encodedUrl = encodeURIComponent(url)
    const apiUrl = `https://opengraph.io/api/1.1/site/${encodedUrl}?app_id=${apiKey}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 24 hours
      next: { revalidate: 86400 }
    })

    if (!response.ok) {
      console.error(`OpenGraph.io API error: ${response.status}`)
      return getFallbackOGData(url)
    }

    const data: OpenGraphIOResponse = await response.json()

    // Check if request was successful
    if (data.requestInfo?.success === false) {
      console.error('OpenGraph.io request failed:', data.requestInfo?.error)
      return getFallbackOGData(url)
    }

    // Extract data with priority: hybridGraph > openGraph > htmlInferred
    const ogData: OGData = {
      title: data.hybridGraph?.title || 
             data.openGraph?.title || 
             data.htmlInferred?.title || 
             null,
      
      description: data.hybridGraph?.description || 
                   data.openGraph?.description || 
                   data.htmlInferred?.description || 
                   null,
      
      image_url: data.hybridGraph?.image || 
                 data.openGraph?.image?.url || 
                 data.htmlInferred?.image || 
                 null,
      
      favicon_url: data.hybridGraph?.favicon || 
                   data.htmlInferred?.favicon || 
                   null,
      
      site_name: data.hybridGraph?.site_name || 
                 data.openGraph?.site_name || 
                 null
    }

    return ogData

  } catch (error) {
    console.error('Error fetching OpenGraph data:', error)
    return getFallbackOGData(url)
  }
}

/**
 * Provides fallback OG data for known sites when API is unavailable
 * @param url The URL to get fallback data for
 * @returns Fallback OG data
 */
function getFallbackOGData(url: string): OGData {
  try {
    const hostname = new URL(url).hostname

    // GitHub
    if (hostname.includes('github.com')) {
      const pathParts = new URL(url).pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        const owner = pathParts[0]
        const repo = pathParts[1]
        return {
          title: `${owner}/${repo}`,
          description: 'GitHub repository',
          image_url: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
          favicon_url: 'https://github.githubassets.com/favicons/favicon.svg',
          site_name: 'GitHub'
        }
      }
    }

    // Vercel
    if (hostname.includes('vercel.com')) {
      return {
        title: 'Vercel',
        description: 'Develop. Preview. Ship.',
        image_url: 'https://assets.vercel.com/image/upload/front/vercel/dps.png',
        favicon_url: 'https://assets.vercel.com/favicon/favicon.ico',
        site_name: 'Vercel'
      }
    }

    // Figma
    if (hostname.includes('figma.com')) {
      return {
        title: 'Figma',
        description: 'The collaborative interface design tool',
        image_url: 'https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png?w=804&h=804&q=75&fit=max&auto=format',
        favicon_url: 'https://static.figma.com/app/icon/1/favicon.svg',
        site_name: 'Figma'
      }
    }

    // Notion
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      return {
        title: 'Notion',
        description: 'Your all-in-one workspace',
        image_url: 'https://www.notion.so/images/meta/default.png',
        favicon_url: 'https://www.notion.so/images/favicon.ico',
        site_name: 'Notion'
      }
    }

    // Default fallback
    return {
      title: null,
      description: null,
      image_url: null,
      favicon_url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      site_name: null
    }

  } catch (error) {
    return {
      title: null,
      description: null,
      image_url: null,
      favicon_url: null,
      site_name: null
    }
  }
}

/**
 * Server-side function to fetch OG data (for API routes)
 * This function can be called from API routes where environment variables are available
 */
export async function fetchOpenGraphDataServer(url: string, apiKey?: string): Promise<OGData> {
  const key = apiKey || process.env.OPENGRAPH_IO_API_KEY

  if (!key || key === 'your_opengraph_io_api_key_here') {
    return getFallbackOGData(url)
  }

  try {
    const encodedUrl = encodeURIComponent(url)
    const apiUrl = `https://opengraph.io/api/1.1/site/${encodedUrl}?app_id=${key}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      return getFallbackOGData(url)
    }

    const data: OpenGraphIOResponse = await response.json()

    if (data.requestInfo?.success === false) {
      return getFallbackOGData(url)
    }

    return {
      title: data.hybridGraph?.title || data.openGraph?.title || data.htmlInferred?.title || null,
      description: data.hybridGraph?.description || data.openGraph?.description || data.htmlInferred?.description || null,
      image_url: data.hybridGraph?.image || data.openGraph?.image?.url || data.htmlInferred?.image || null,
      favicon_url: data.hybridGraph?.favicon || data.htmlInferred?.favicon || null,
      site_name: data.hybridGraph?.site_name || data.openGraph?.site_name || null
    }

  } catch (error) {
    return getFallbackOGData(url)
  }
}