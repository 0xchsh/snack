import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

interface ListData {
  title: string
  description: string | null
  emoji: string | null
  is_public: boolean
  links_count: number
  username: string
}

async function fetchListData(username: string, listId: string): Promise<ListData | null> {
  try {
    // Create Supabase client directly (no cookies needed for public data)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return null
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // First get the user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      console.error('User not found:', username)
      return null
    }

    // Then get the list - try public_id first, then fall back to id
    let list = null

    // Try public_id first
    const { data: listByPublicId, error: publicIdError } = await supabase
      .from('lists')
      .select('title, description, emoji, is_public')
      .eq('public_id', listId)
      .eq('user_id', user.id)
      .single()

    if (listByPublicId && !publicIdError) {
      list = listByPublicId
    } else {
      // Fall back to id
      const { data: listById, error: idError } = await supabase
        .from('lists')
        .select('title, description, emoji, is_public')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single()

      if (listById && !idError) {
        list = listById
      }
    }

    if (!list) {
      console.error('List not found:', listId)
      return null
    }

    // Get link count
    const { count: linksCount } = await supabase
      .from('links')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', listId)

    return {
      title: list.title,
      description: list.description,
      emoji: list.emoji,
      is_public: list.is_public,
      links_count: linksCount || 0,
      username: user.username,
    }
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
  const description = list.description || `A curated collection of ${list.links_count} ${list.links_count === 1 ? 'link' : 'links'} by @${list.username}`

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
