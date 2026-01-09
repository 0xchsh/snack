/**
 * OpenGraph.io API integration for fetching Open Graph data
 */

import { fetchOGData as fetchOGDataDirect, type OGData } from '@/lib/og'

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url YouTube URL
 * @returns Video ID or null if not found
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) return videoId
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1).split('?')[0]
      if (videoId) return videoId
    }

    return null
  } catch {
    return null
  }
}

/**
 * Generates YouTube thumbnail URL for a video ID
 * @param videoId YouTube video ID
 * @param quality Thumbnail quality (maxres = 1280x720)
 * @returns Thumbnail URL
 */
function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'maxres'): string {
  const qualityMap = {
    'default': 'default.jpg',      // 120x90
    'hq': 'hqdefault.jpg',          // 480x360
    'maxres': 'maxresdefault.jpg'   // 1280x720
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`
}

/**
 * Extracts place information from Google Maps URLs
 * Handles multiple URL formats: /maps/place/, /maps/search/, coordinate URLs
 * @param url Google Maps URL
 * @returns Place data or null if not a valid Maps URL
 */
function parseGoogleMapsUrl(url: string): {
  placeName: string | null
  coordinates: { lat: number; lng: number } | null
  zoom: number | null
} | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Check if it's a Google Maps URL
    if (!hostname.includes('google.com') && !hostname.includes('maps.app.goo.gl')) {
      return null
    }

    let placeName: string | null = null
    let coordinates: { lat: number; lng: number } | null = null
    let zoom: number | null = null

    // Extract coordinates from URL: /@lat,lng,zoom or /@lat,lng,zoomz
    const coordPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z?/
    const coordMatch = url.match(coordPattern)

    if (coordMatch && coordMatch[1] && coordMatch[2] && coordMatch[3]) {
      coordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      }
      zoom = parseInt(coordMatch[3])
    }

    // Extract place name from /maps/place/PlaceName
    if (url.includes('/maps/place/')) {
      const placePattern = /\/maps\/place\/([^/@?]+)/
      const placeMatch = url.match(placePattern)

      if (placeMatch?.[1]) {
        // Decode URI component and replace + with spaces
        placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ')
      }
    }

    // Extract search query from /maps/search/
    else if (url.includes('/maps/search/')) {
      const searchPattern = /\/maps\/search\/([^/@?]+)/
      const searchMatch = url.match(searchPattern)

      if (searchMatch?.[1]) {
        placeName = decodeURIComponent(searchMatch[1]).replace(/\+/g, ' ')
      }
    }

    return {
      placeName,
      coordinates,
      zoom
    }
  } catch {
    return null
  }
}

/**
 * Generates a static map image URL using Google Static Maps API
 * @param lat Latitude
 * @param lng Longitude
 * @param zoom Zoom level (1-20)
 * @returns Static map image URL
 */
function getGoogleMapsStaticImage(lat: number, lng: number, zoom: number): string {
  // Use Google Static Maps API (works without API key for basic usage)
  // Size optimized for OG images (1200x630 is standard)
  // Scale=2 for higher resolution on retina displays
  const markerColor = 'red'
  const markerLabel = ''

  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=1200x630&scale=2&format=jpg&markers=color:${markerColor}%7C${lat},${lng}`
}

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

/**
 * Fetches Open Graph data from OpenGraph.io API
 * @param url The URL to fetch OG data for
 * @returns Promise with OG data
 */
export async function fetchOpenGraphData(url: string): Promise<OGData> {
  const apiKey = process.env.OPENGRAPH_IO_API_KEY

  if (!apiKey || apiKey === 'your_opengraph_io_api_key_here') {
    console.warn('OpenGraph.io API key not configured, using fallback')
    return fallbackOgData(url)
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
      return fallbackOgData(url)
    }

    const data: OpenGraphIOResponse = await response.json()

    // Check if request was successful
    if (data.requestInfo?.success === false) {
      console.error('OpenGraph.io request failed:', data.requestInfo?.error)
      return fallbackOgData(url)
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

    if (needsSupplementalData(ogData)) {
      const supplemental = await fallbackOgData(url)
      return mergeOgData(ogData, supplemental)
    }

    return ogData

  } catch (error) {
    console.error('Error fetching OpenGraph data:', error)
    return fallbackOgData(url)
  }
}

function needsSupplementalData(data: OGData): boolean {
  return !data.image_url || !data.title || !data.favicon_url || !data.site_name
}

async function fallbackOgData(url: string): Promise<OGData> {
  const directData = await fetchOGDataDirect(url)

  if (!needsSupplementalData(directData)) {
    return directData
  }

  const fallbackData = await getFallbackOGData(url)
  return mergeOgData(directData, fallbackData)
}

function mergeOgData(primary: OGData, secondary: OGData): OGData {
  const merged: OGData = {
    title: primary.title ?? secondary.title,
    description: primary.description ?? secondary.description,
    image_url: primary.image_url ?? secondary.image_url,
    favicon_url: primary.favicon_url ?? secondary.favicon_url,
    site_name: primary.site_name ?? secondary.site_name
  }

  if (
    primary.favicon_url &&
    primary.favicon_url.includes('google.com/s2/favicons') &&
    secondary.favicon_url
  ) {
    merged.favicon_url = secondary.favicon_url
  }

  return merged
}

/**
 * Provides fallback OG data for known sites when API is unavailable
 * @param url The URL to get fallback data for
 * @returns Fallback OG data
 */
async function getFallbackOGData(url: string): Promise<OGData> {
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
      } else {
        // Generic GitHub fallback
        return {
          title: 'GitHub',
          description: 'Where software is built',
          image_url: 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
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

    // Google Maps
    if (hostname.includes('google.com/maps') || hostname.includes('maps.google.com') || hostname.includes('maps.app.goo.gl')) {
      const mapsData = parseGoogleMapsUrl(url)

      if (mapsData && mapsData.coordinates) {
        const { placeName, coordinates, zoom } = mapsData

        return {
          title: placeName || 'Location on Google Maps',
          description: placeName ? `View ${placeName} on Google Maps` : 'View this location on Google Maps',
          image_url: getGoogleMapsStaticImage(
            coordinates.lat,
            coordinates.lng,
            zoom || 15
          ),
          favicon_url: 'https://www.gstatic.com/mapspro/images/favicon-001.ico',
          site_name: 'Google Maps'
        }
      }

      // Generic fallback if parsing fails
      return {
        title: 'Google Maps',
        description: 'Explore places and get directions',
        image_url: 'https://www.google.com/images/branding/product/2x/maps_96dp.png',
        favicon_url: 'https://www.gstatic.com/mapspro/images/favicon-001.ico',
        site_name: 'Google Maps'
      }
    }

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = getYouTubeVideoId(url)

      if (videoId) {
        // Try to fetch video title from YouTube oEmbed API (no API key required)
        let videoTitle = 'YouTube'
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          const response = await fetch(oembedUrl)
          if (response.ok) {
            const data = await response.json()
            if (data.title) {
              videoTitle = data.title
            }
          }
        } catch (error) {
          console.warn('Failed to fetch YouTube video title:', error)
        }

        return {
          title: videoTitle,
          description: 'Enjoy the videos and music you love',
          image_url: getYouTubeThumbnail(videoId, 'maxres'),
          favicon_url: 'https://www.youtube.com/s/desktop/f506e53b/img/favicon_32x32.png',
          site_name: 'YouTube'
        }
      }

      // Generic fallback if video ID can't be extracted
      return {
        title: 'YouTube',
        description: 'Enjoy the videos and music you love',
        image_url: 'https://www.youtube.com/img/desktop/yt_1200.png',
        favicon_url: 'https://www.youtube.com/s/desktop/f506e53b/img/favicon_32x32.png',
        site_name: 'YouTube'
      }
    }

    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return {
        title: 'X (Twitter)',
        description: 'From breaking news and entertainment to sports and politics',
        image_url: 'https://abs.twimg.com/errors/logo46x38.png',
        favicon_url: 'https://abs.twimg.com/favicons/twitter.3.ico',
        site_name: 'X'
      }
    }

    // LinkedIn
    if (hostname.includes('linkedin.com')) {
      return {
        title: 'LinkedIn',
        description: 'Professional networking platform',
        image_url: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
        favicon_url: 'https://static.licdn.com/favicon.ico',
        site_name: 'LinkedIn'
      }
    }

    // Dribbble
    if (hostname.includes('dribbble.com')) {
      return {
        title: 'Dribbble',
        description: 'Discover the world\'s top designers & creatives',
        image_url: 'https://cdn.dribbble.com/assets/dribbble-ball-mark-2bd45f09c2fb58dbbfb44766d5d1d07c5a12972d602ef8b32204d28fa3dda554.svg',
        favicon_url: 'https://cdn.dribbble.com/assets/favicon-b38525134603b5513b6e8844d1b0be7e5d4aef35ad8e67aeca20b2a13ca7f5e5.ico',
        site_name: 'Dribbble'
      }
    }

    // Medium
    if (hostname.includes('medium.com')) {
      return {
        title: 'Medium',
        description: 'Where good ideas find you',
        image_url: 'https://miro.medium.com/v2/1*m-R_BkNf1Qjr1YbyOIJY2w.png',
        favicon_url: 'https://cdn-static-1.medium.com/sites/medium.com/favicon.ico',
        site_name: 'Medium'
      }
    }

    // Default fallback
    return {
      title: hostname,
      description: null,
      image_url: getScreenshotFallback(url),
      favicon_url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      site_name: hostname
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

function getScreenshotFallback(url: string): string {
  return `https://v1.screenshot.11ty.dev/${encodeURIComponent(url)}/opengraph/`
}

/**
 * Server-side function to fetch OG data (for API routes)
 * This function can be called from API routes where environment variables are available
 */
export async function fetchOpenGraphDataServer(url: string, apiKey?: string): Promise<OGData> {
  const key = apiKey || process.env.OPENGRAPH_IO_API_KEY

  if (!key || key === 'your_opengraph_io_api_key_here') {
    return fallbackOgData(url)
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
      return fallbackOgData(url)
    }

    const data: OpenGraphIOResponse = await response.json()

    if (data.requestInfo?.success === false) {
      return fallbackOgData(url)
    }

    const ogData: OGData = {
      title: data.hybridGraph?.title || data.openGraph?.title || data.htmlInferred?.title || null,
      description: data.hybridGraph?.description || data.openGraph?.description || data.htmlInferred?.description || null,
      image_url: data.hybridGraph?.image || data.openGraph?.image?.url || data.htmlInferred?.image || null,
      favicon_url: data.hybridGraph?.favicon || data.htmlInferred?.favicon || null,
      site_name: data.hybridGraph?.site_name || data.openGraph?.site_name || null
    }

    if (needsSupplementalData(ogData)) {
      const supplemental = await fallbackOgData(url)
      return mergeOgData(ogData, supplemental)
    }

    return ogData

  } catch (error) {
    return fallbackOgData(url)
  }
}
