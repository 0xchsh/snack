import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'List preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface ListData {
  title: string
  description: string | null
  emoji: string | null
  links: Array<{ id: string }>
  users: {
    username: string
  } | null
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
    console.error('Error fetching list data for OG image:', error)
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ username: string; listId: string }> }) {
  const { username, listId } = await params
  const list = await fetchListData(username, listId)

  const linkCount = list?.links?.length || 0
  const displayUsername = list?.users?.username || username
  const title = list?.title || 'Untitled List'
  const description = list?.description || ''
  const emoji = list?.emoji || '📝'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', fontSize: 64 }}>
          {emoji}
        </div>

        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 'bold', lineHeight: 1.1 }}>
            {title.length > 50 ? title.substring(0, 50) + '...' : title}
          </div>

          {description && (
            <div style={{ display: 'flex', fontSize: 32, opacity: 0.9, lineHeight: 1.4 }}>
              {description.length > 100 ? description.substring(0, 100) + '...' : description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 500 }}>
            @{displayUsername}
          </div>
          <div style={{ display: 'flex', fontSize: 32 }}>
            {linkCount} {linkCount === 1 ? 'link' : 'links'}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
