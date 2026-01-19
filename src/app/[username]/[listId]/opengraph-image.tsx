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
      .select('title, emoji')
      .eq('public_id', listId)
      .eq('is_public', true)
      .maybeSingle()

    if (listByPublicId) {
      return { title: listByPublicId.title, emoji: listByPublicId.emoji }
    }

    // Try by id
    const { data: listById } = await supabase
      .from('lists')
      .select('title, emoji')
      .eq('id', listId)
      .eq('is_public', true)
      .maybeSingle()

    if (listById) {
      return { title: listById.title, emoji: listById.emoji }
    }

    console.error('List not found or not public:', listId)
    return null
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

        {/* Username */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            fontWeight: 400,
            color: '#9CA3AF',
            marginTop: 16,
          }}
        >
          {username}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
