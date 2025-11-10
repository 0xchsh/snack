import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type ListSummary = Pick<Database['public']['Tables']['lists']['Row'], 'id' | 'public_id' | 'title' | 'emoji' | 'save_count'>
type TopList = ListSummary & { view_count: number; click_count: number }

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if analytics tables exist by trying to query them
    let hasAnalyticsTables = false
    let totalViews = 0
    let totalClicks = 0
    
    // Try to get views if table exists
    const { error: viewsError } = await supabase
      .from('list_views')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', 'dummy') // Just checking if table exists
    
    if (!viewsError || viewsError.code !== '42P01') {
      // Table exists, get real count
      hasAnalyticsTables = true
      
      // Get user's list IDs first
      const { data: userLists } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', user.id)
      
      if (userLists && userLists.length > 0) {
        const listIds = userLists.map(l => l.id)
        
        // Get view count
        const { count } = await supabase
          .from('list_views')
          .select('*', { count: 'exact', head: true })
          .in('list_id', listIds)
        
        totalViews = count || 0
        
        // Get click count
        const { count: clicks } = await supabase
          .from('link_clicks')
          .select('*', { count: 'exact', head: true })
          .in('list_id', listIds)
        
        totalClicks = clicks || 0
      }
    }

    // Get total saves across all user's lists
    const { data: listsData } = await supabase
      .from('lists')
      .select('id, public_id, title, emoji, save_count')
      .eq('user_id', user.id)
      .order('save_count', { ascending: false })

    const typedLists: ListSummary[] = (listsData ?? []) as ListSummary[]
    const totalSaves = typedLists.reduce((sum, list) => sum + (list.save_count || 0), 0)

    // Get per-list stats for all lists
    const listStats: Record<string, { views: number; clicks: number }> = {}

    if (typedLists.length > 0 && hasAnalyticsTables) {
      // Get view and click counts for each list
      await Promise.all(
        typedLists.map(async (list) => {
          const listId = list.public_id || list.id

          const { count: views } = await supabase
            .from('list_views')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)

          const { count: clicks } = await supabase
            .from('link_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)

          listStats[listId] = {
            views: views || 0,
            clicks: clicks || 0
          }
        })
      )
    } else {
      // No analytics tables, set all to 0
      typedLists.forEach(list => {
        const listId = list.public_id || list.id
        listStats[listId] = { views: 0, clicks: 0 }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        totalClicks,
        totalSaves,
        listStats
      }
    })
  } catch (error) {
    console.error('Error fetching analytics stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
