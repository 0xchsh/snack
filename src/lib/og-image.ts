/**
 * Utility functions for fetching Open Graph images from URLs
 */

interface OGImageData {
  image_url: string | null
  title?: string
  description?: string
}

/**
 * Fetches Open Graph image and metadata from a URL
 * @param url The URL to fetch OG data from
 * @returns Promise with OG image data
 */
export async function fetchOGImage(url: string): Promise<OGImageData> {
  try {
    // Use a CORS proxy or service to fetch OG data
    // For now, we'll use a simple approach with common OG image patterns
    const hostname = new URL(url).hostname

    // For common services, we can construct OG image URLs
    if (hostname.includes('github.com')) {
      // GitHub has predictable OG images
      const pathParts = new URL(url).pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        const owner = pathParts[0]
        const repo = pathParts[1]
        return {
          image_url: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
          title: `${owner}/${repo}`
        }
      }
    }

    if (hostname.includes('vercel.com')) {
      return {
        image_url: 'https://assets.vercel.com/image/upload/front/vercel/dps.png'
      }
    }

    if (hostname.includes('figma.com')) {
      return {
        image_url: 'https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png?w=804&h=804&q=75&fit=max&auto=format'
      }
    }

    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      return {
        image_url: 'https://www.notion.so/images/meta/default.png'
      }
    }

    if (hostname.includes('miro.com')) {
      return {
        image_url: 'https://miro.com/static/images/social/facebook-share-image.png'
      }
    }

    if (hostname.includes('paper.design')) {
      return {
        image_url: 'https://framerusercontent.com/images/48ha9ZR9jZQGQ2KyU2A0hCkowJI.png'
      }
    }

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return {
        image_url: 'https://abs.twimg.com/favicons/twitter.3.ico'
      }
    }

    if (hostname.includes('youtube.com')) {
      return {
        image_url: 'https://www.youtube.com/img/desktop/yt_1200.png'
      }
    }

    if (hostname.includes('dribbble.com')) {
      return {
        image_url: 'https://cdn.dribbble.com/assets/dribbble-ball-mark-2bd45f09c2fb58dbbfb44766d5d1d07c5a12972d602ef8b32204d28fa3dda554.svg'
      }
    }

    // For other URLs, try to use a screenshot service or return null
    // You could integrate with services like:
    // - https://htmlcsstoimage.com/
    // - https://urlbox.io/
    // - https://screenshot.abstractapi.com/
    
    // For demo purposes, return null for unknown domains
    return {
      image_url: null
    }

  } catch (error) {
    console.error('Error fetching OG image:', error)
    return {
      image_url: null
    }
  }
}

/**
 * Gets a fallback OG image URL based on domain
 * @param url The URL to get fallback image for
 * @returns Fallback image URL or null
 */
export function getFallbackOGImage(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    
    // Use a generic screenshot service as fallback
    // return `https://api.urlbox.io/v1/ca482d7e-9417-4569-90fe-80f7c5e1c781/png?url=${encodeURIComponent(url)}&width=1200&height=630`
    
    // For now, return null to use the gradient fallback
    return null
  } catch {
    return null
  }
}