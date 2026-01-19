import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateAccessToken } from '@/lib/extension-auth'
import { fetchOpenGraphDataServer } from '@/lib/opengraph-io'

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Helper to extract and validate token
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const accessToken = authHeader.slice(7)
  return validateAccessToken(accessToken)
}

interface LinkData {
  url: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  faviconUrl?: string | null
  position?: number
}

// POST /api/extension/lists/[id]/links
// Add links to a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { id: listId } = await params
    const body = await request.json().catch(() => ({}))
    const { links } = body as { links: LinkData[] }

    if (!links || !Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'links array is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify list exists and user owns it
    const { data: list, error: listError } = await supabaseAdmin
      .from('lists')
      .select('id, user_id')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (list.user_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get current max position
    const { data: existingLinks } = await supabaseAdmin
      .from('links')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1)

    const startPosition = existingLinks?.[0]?.position ?? -1

    // Process each link (fetch OG data and insert)
    const createdLinks = await Promise.all(
      links.map(async (linkData, index) => {
        // Fetch OG data if not provided
        let ogData = null
        if (!linkData.title || !linkData.imageUrl) {
          try {
            ogData = await fetchOpenGraphDataServer(linkData.url)
          } catch (error) {
            console.error('Error fetching OG data:', error)
          }
        }

        const position = linkData.position ?? startPosition + index + 1

        // Shift existing links at or after this position
        if (position <= startPosition + 1) {
          const { data: linksToShift } = await supabaseAdmin
            .from('links')
            .select('id, position')
            .eq('list_id', listId)
            .gte('position', position)

          if (linksToShift && linksToShift.length > 0) {
            await Promise.all(
              linksToShift.map((link) =>
                supabaseAdmin
                  .from('links')
                  .update({ position: link.position + 1 })
                  .eq('id', link.id)
              )
            )
          }
        }

        const linkRecord = {
          list_id: listId,
          url: linkData.url,
          title: linkData.title || ogData?.title || new URL(linkData.url).hostname,
          description: linkData.description || ogData?.description,
          image_url: linkData.imageUrl || ogData?.image_url,
          favicon_url: linkData.faviconUrl || ogData?.favicon_url,
          position: 0, // Add to top
        }

        const { data: link, error: linkError } = await supabaseAdmin
          .from('links')
          .insert(linkRecord)
          .select()
          .single()

        if (linkError) {
          console.error('Error creating link:', linkError)
          return null
        }

        return link
      })
    )

    // Filter out any failed inserts
    const successfulLinks = createdLinks.filter(Boolean)

    // Update list's updated_at
    await supabaseAdmin
      .from('lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)

    return NextResponse.json(
      {
        data: {
          added: successfulLinks.length,
          total: links.length,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in POST /api/extension/lists/[id]/links:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
