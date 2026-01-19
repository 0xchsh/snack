import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateAccessToken } from '@/lib/extension-auth'

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// GET /api/extension/lists
// Get user's lists with basic info for dropdown
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Fetch user's lists with link count
    const { data: lists, error } = await supabaseAdmin
      .from('lists')
      .select(`
        id,
        public_id,
        title,
        emoji,
        is_public,
        updated_at,
        links(count)
      `)
      .eq('user_id', auth.userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching lists:', error)
      return NextResponse.json(
        { error: 'Failed to fetch lists' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Transform to extension format
    const formattedLists = lists?.map((list) => ({
      id: list.id,
      publicId: list.public_id,
      title: list.title,
      emoji: list.emoji,
      isPublic: list.is_public,
      linkCount: (list.links as unknown as { count: number }[])?.[0]?.count || 0,
      updatedAt: list.updated_at,
    }))

    return NextResponse.json(
      { data: formattedLists },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in GET /api/extension/lists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/extension/lists
// Create a new list
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { title, emoji, isPublic } = body

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { data: list, error } = await supabaseAdmin
      .from('lists')
      .insert({
        user_id: auth.userId,
        title,
        emoji: emoji || '🎯',
        is_public: isPublic !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating list:', error)
      return NextResponse.json(
        { error: 'Failed to create list' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        data: {
          id: list.id,
          publicId: list.public_id,
          title: list.title,
          emoji: list.emoji,
          isPublic: list.is_public,
          linkCount: 0,
          updatedAt: list.updated_at,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in POST /api/extension/lists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
