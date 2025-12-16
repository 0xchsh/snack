import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'List preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface ListData {
  title: string
  emoji: string | null
}

async function fetchListData(username: string, listId: string): Promise<ListData | null> {
  try {
    // Create Supabase client directly for edge runtime (no cookies needed for public data)
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
      .select('id')
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
      .select('title, emoji, is_public')
      .eq('public_id', listId)
      .eq('user_id', user.id)
      .single()

    if (listByPublicId && !publicIdError) {
      list = listByPublicId
    } else {
      // Fall back to id
      const { data: listById, error: idError } = await supabase
        .from('lists')
        .select('title, emoji, is_public')
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

    return {
      title: list.title,
      emoji: list.emoji,
    }
  } catch (error) {
    console.error('Error fetching list data for OG image:', error)
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ username: string; listId: string }> }) {
  const { username, listId } = await params
  const list = await fetchListData(username, listId)

  const title = list?.title || 'Untitled List'
  const emoji = list?.emoji || '📝'

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Centered Emoji */}
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            marginBottom: 32,
          }}
        >
          {emoji}
        </div>

        {/* Centered Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            color: '#000000',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.2,
          }}
        >
          {title.length > 60 ? title.substring(0, 60) + '...' : title}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
