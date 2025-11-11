import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface ListData {
  title: string
  description: string | null
  links: Array<{ id: string }>
  users: {
    username: string
  } | null
  is_public: boolean
}

async function fetchListData(username: string, listId: string): Promise<ListData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(listId)}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching list data for metadata:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; listId: string }>
}): Promise<Metadata> {
  const { username, listId } = await params
  const list = await fetchListData(username, listId)

  if (!list) {
    return {
      title: 'List Not Found | Snack',
      description: 'The list you are looking for does not exist.',
    }
  }

  const linkCount = list.links?.length || 0
  const displayUsername = list.users?.username || username
  const title = list.title || 'Untitled List'
  const description = list.description || `Check out this curated collection of ${linkCount} ${linkCount === 1 ? 'link' : 'links'} by @${displayUsername}`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const url = `${baseUrl}/${username}/${listId}`

  return {
    title: `Snack - ${title}`,
    description,
    openGraph: {
      title: `Snack - ${title}`,
      description,
      url,
      siteName: 'Snack',
      type: 'website',
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} - A curated list by @${displayUsername}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Snack - ${title}`,
      description,
      images: [`${url}/opengraph-image`],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default function ListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
