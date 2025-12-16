import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache for 60 seconds (public content changes infrequently)
export const revalidate = 60

// GET /api/discover - Get public lists with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get total count of public lists
    const { count: totalCount, error: countError } = await supabase
      .from('lists')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    if (countError) {
      console.error('Error fetching total count:', countError)
    }

    // Fetch public lists with pagination
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id, public_id, title, emoji, is_public, view_count, save_count, created_at, user_id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listsError) {
      console.error('Error fetching public lists:', listsError)
      return NextResponse.json(
        { error: 'Failed to fetch public lists' },
        { status: 500 }
      )
    }

    if (!lists || lists.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          hasMore: false,
          total: totalCount || 0
        }
      })
    }

    // Get unique user IDs
    const userIds = [...new Set(lists.map(list => list.user_id).filter(Boolean))]

    // Fetch user data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, profile_picture_url, first_name, last_name')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Fetch links for all lists
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('id, list_id, url, title')
      .in('list_id', lists.map(list => list.id))

    if (linksError) {
      console.error('Error fetching links:', linksError)
    }

    // Create lookup maps
    const userMap = new Map((users || []).map(user => [user.id, user]))
    const linksMap = new Map<string, any[]>()

    ;(links || []).forEach(link => {
      if (!linksMap.has(link.list_id)) {
        linksMap.set(link.list_id, [])
      }
      linksMap.get(link.list_id)?.push(link)
    })

    // Combine the data
    const enrichedLists = lists.map(list => ({
      ...list,
      users: list.user_id ? userMap.get(list.user_id) || null : null,
      links: linksMap.get(list.id) || []
    }))

    // Check if there are more pages
    const hasMore = enrichedLists.length === limit

    return NextResponse.json({
      success: true,
      data: enrichedLists,
      pagination: {
        page,
        limit,
        hasMore,
        total: totalCount || 0
      }
    })
  } catch (error) {
    console.error('Error in discover endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
