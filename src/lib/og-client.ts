/**
 * Client-side OpenGraph fetching utilities
 */

export interface OGData {
  title: string | null
  description: string | null
  image_url: string | null
  favicon_url: string | null
  site_name: string | null
}

/**
 * Fetches OpenGraph data from our API route (client-side)
 * @param url The URL to fetch OG data for
 * @returns Promise with OG data
 */
export async function fetchOGDataClient(url: string): Promise<OGData> {
  try {
    const response = await fetch('/api/opengraph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      console.error('Failed to fetch OG data:', response.status)
      return getDefaultOGData(url)
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error fetching OG data:', error)
    return getDefaultOGData(url)
  }
}

/**
 * Gets default OG data when API fails
 * @param url The URL to get default data for
 * @returns Default OG data
 */
function getDefaultOGData(url: string): OGData {
  try {
    const hostname = new URL(url).hostname
    
    return {
      title: hostname,
      description: null,
      image_url: null,
      favicon_url: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
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