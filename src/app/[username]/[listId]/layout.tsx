import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

interface ListData {
  title: string
  description: string | null
  emoji: string | null
}

async function fetchListData(username: string, listId: string): Promise<ListData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return null
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Query list directly - RLS will only return public lists for anonymous users
    // Try by public_id first, then by id
    const { data: listByPublicId } = await supabase
      .from('lists')
      .select('title, description, emoji')
      .eq('public_id', listId)
      .eq('is_public', true)
      .maybeSingle()

    if (listByPublicId) {
      return listByPublicId
    }

    // Try by id
    const { data: listById } = await supabase
      .from('lists')
      .select('title, description, emoji')
      .eq('id', listId)
      .eq('is_public', true)
      .maybeSingle()

    if (listById) {
      return listById
    }

    console.error('List not found or not public:', listId)
    return null
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

  const title = list.title || 'Untitled List'
  const description = list.description || `A curated collection of links by @${username}`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const url = `${baseUrl}/${username}/${listId}`

  return {
    title: `${title} | Snack`,
    description,
    openGraph: {
      title: `${title} | Snack`,
      description,
      url,
      siteName: 'Snack',
      type: 'website',
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${list.emoji || ''} ${title}`.trim(),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Snack`,
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
