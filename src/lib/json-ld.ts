import { ListWithLinks } from '@/types'

/**
 * JSON-LD Generator - Creates structured data for LLM consumption
 * Follows schema.org standards for maximum compatibility
 */

interface JsonLdItem {
  '@type': string
  url: string
  name?: string
  description?: string
}

interface JsonLdCollection {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  creator: {
    '@type': string
    name: string
    url?: string
  }
  numberOfItems: number
  keywords?: string[]
  itemListElement: JsonLdItem[]
  dateCreated?: string
  dateModified?: string
}

/**
 * Generate JSON-LD structured data for a Snack list
 * This data is embedded in the page <head> and read by LLMs
 */
export function generateListJsonLd(
  list: ListWithLinks,
  baseUrl: string
): JsonLdCollection {
  const listUrl = `${baseUrl}/${list.user?.username}/${list.public_id || list.id}`
  const userUrl = list.user?.username ? `${baseUrl}/${list.user.username}` : undefined

  // Use AI summary if available, otherwise generate basic description
  const description = list.ai_summary || generateBasicDescription(list)

  // Create item list from links
  const itemListElement: JsonLdItem[] = (list.links || []).map((link) => ({
    '@type': 'Thing',
    url: link.url,
    name: link.title || undefined,
    description: link.description || undefined,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title || 'Untitled List',
    description,
    url: listUrl,
    creator: {
      '@type': 'Person',
      name: list.user?.username || 'Unknown User',
      url: userUrl,
    },
    numberOfItems: list.links?.length || 0,
    keywords: list.ai_themes || undefined,
    itemListElement,
    dateCreated: list.created_at,
    dateModified: list.updated_at,
  }
}

/**
 * Generate a basic description when AI summary is not available
 */
function generateBasicDescription(list: ListWithLinks): string {
  const linkCount = list.links?.length || 0
  return `A curated collection titled "${list.title || 'Untitled List'}" containing ${linkCount} link${
    linkCount !== 1 ? 's' : ''
  }. Created by ${list.user?.username || 'a Snack user'}.`
}

/**
 * Convert JSON-LD object to HTML script tag for embedding
 */
export function jsonLdToScriptTag(jsonLd: JsonLdCollection): string {
  const jsonString = JSON.stringify(jsonLd, null, 0) // Compact format
  return `<script type="application/ld+json">${jsonString}</script>`
}

/**
 * Generate complete metadata object for a list page
 * Includes Open Graph and Twitter Card metadata
 */
export interface PageMetadata {
  title: string
  description: string
  url: string
  image?: string
  type: string
  siteName: string
  creator: string
  keywords?: string
  jsonLd: JsonLdCollection
}

export function generateListMetadata(
  list: ListWithLinks,
  baseUrl: string
): PageMetadata {
  const description = list.ai_summary || generateBasicDescription(list)
  const listUrl = `${baseUrl}/${list.user?.username}/${list.public_id || list.id}`

  // Use first link's image if available
  const image = list.links?.[0]?.image_url || undefined

  return {
    title: `${list.title || 'Untitled List'} by @${list.user?.username || 'user'} - Snack`,
    description,
    url: listUrl,
    image,
    type: 'website',
    siteName: 'Snack',
    creator: `@${list.user?.username || 'user'}`,
    keywords: list.ai_themes?.join(', ') || undefined,
    jsonLd: generateListJsonLd(list, baseUrl),
  }
}
