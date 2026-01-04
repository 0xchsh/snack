import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/dashboard - Fetch all dashboard data in a single request
// Combines user lists, saved lists, and analytics for optimal performance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel for best performance
    const [listsResult, savedListsResult, analyticsResult] = await Promise.all([
      // 1. User's lists
      supabase
        .from('lists')
        .select('id, public_id, title, emoji, is_public, price_cents, currency, view_mode, user_id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // 2. Saved lists
      supabase
        .from('saved_lists')
        .select(`
          id,
          list_id,
          saved_at,
          notes,
          lists!inner (
            id,
            public_id,
            title,
            emoji,
            is_public,
            save_count,
            created_at,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false }),

      // 3. Analytics stats (optimized with aggregations)
      supabase
        .from('lists')
        .select('id')
        .eq('user_id', user.id)
    ])

    if (listsResult.error) {
      console.error('Error fetching lists:', listsResult.error)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    if (savedListsResult.error) {
      console.error('Error fetching saved lists:', savedListsResult.error)
      return NextResponse.json({ error: 'Failed to fetch saved lists' }, { status: 500 })
    }

    // Get user data for lists
    const { data: userData } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', user.id)
      .single()

    // Format lists with user data
    const listsWithUser = (listsResult.data || []).map(list => ({
      ...list,
      links: [], // Links will be fetched separately when needed
      user: {
        id: user.id,
        username: userData?.username || 'User'
      }
    }))

    // Format saved lists
    const savedListsFormatted = (savedListsResult.data || []).map(item => ({
      ...item,
      list: {
        ...item.lists,
        user: {
          id: (item.lists as any).user_id,
          username: userData?.username || 'User'
        }
      }
    }))

    // Calculate analytics efficiently
    let analyticsData = null
    if (analyticsResult.data && analyticsResult.data.length > 0) {
      const listIds = analyticsResult.data.map(l => l.id)

      // Fetch aggregated analytics in parallel
      const [viewsResult, clicksResult] = await Promise.all([
        // Aggregate views by list_id
        supabase
          .from('list_views')
          .select('list_id')
          .in('list_id', listIds),

        // Aggregate clicks by list_id
        supabase
          .from('link_clicks')
          .select('list_id')
          .in('list_id', listIds)
      ])

      const totalViews = viewsResult.data?.length || 0
      const totalClicks = clicksResult.data?.length || 0
      const totalSaves = listsResult.data?.reduce((sum, list) => sum + (list.save_count || 0), 0) || 0

      // Group by list for list-specific stats
      const listStats: Record<string, { views: number; clicks: number }> = {}

      viewsResult.data?.forEach(view => {
        if (!listStats[view.list_id]) {
          listStats[view.list_id] = { views: 0, clicks: 0 }
        }
        listStats[view.list_id].views++
      })

      clicksResult.data?.forEach(click => {
        if (!listStats[click.list_id]) {
          listStats[click.list_id] = { views: 0, clicks: 0 }
        }
        listStats[click.list_id].clicks++
      })

      analyticsData = {
        totalViews,
        totalClicks,
        totalSaves,
        listStats
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lists: listsWithUser,
        savedLists: savedListsFormatted,
        analytics: analyticsData
      }
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
