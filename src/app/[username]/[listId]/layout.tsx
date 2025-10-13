import type { Metadata } from 'next'
import { generateListMetadata } from '@/lib/json-ld'
import Script from 'next/script'

type Props = {
  params: Promise<{ username: string; listId: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, listId } = await params

  try {
    // Fetch the list data for metadata
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'
    const fullBaseUrl = `${protocol}://${host}`

    const response = await fetch(`${fullBaseUrl}/api/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(listId)}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      cache: 'no-store' // Don't cache during development
    })

    if (!response.ok) {
      // Return default metadata if list not found
      return {
        title: 'Snack - Curated Link Collections',
        description: 'Create, organize, and share curated collections of links'
      }
    }

    const { data: list } = await response.json()

    // Generate metadata using the JSON-LD generator
    const metadata = generateListMetadata(list, fullBaseUrl)

    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        url: metadata.url,
        type: 'website',
        siteName: metadata.siteName,
        images: metadata.image ? [{ url: metadata.image }] : undefined
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description,
        images: metadata.image ? [metadata.image] : undefined,
        creator: metadata.creator
      },
      keywords: metadata.keywords,
      other: {
        'theme-color': '#000000'
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Snack - Curated Link Collections',
      description: 'Create, organize, and share curated collections of links'
    }
  }
}

export default async function ListLayout({ params, children }: Props) {
  const { username, listId } = await params

  try {
    // Fetch the list data for JSON-LD
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'
    const fullBaseUrl = `${protocol}://${host}`

    const response = await fetch(`${fullBaseUrl}/api/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(listId)}`, {
      next: { revalidate: 60 },
      cache: 'no-store'
    })

    if (response.ok) {
      const { data: list } = await response.json()
      const metadata = generateListMetadata(list, fullBaseUrl)

      return (
        <>
          <Script
            id="list-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(metadata.jsonLd),
            }}
          />
          {children}
        </>
      )
    }
  } catch (error) {
    console.error('Error in layout:', error)
  }

  return children
}
