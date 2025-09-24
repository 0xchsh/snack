import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    const { data: viewsData, error: viewsError, count: viewCount } = await supabase
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

    const totalSaves = listsData?.reduce((sum, list) => sum + (list.save_count || 0), 0) || 0

    // Get top 5 lists with analytics if available
    let topLists = []
    if (listsData && listsData.length > 0) {
      if (hasAnalyticsTables) {
        // Get view and click counts for each list
        const listsWithAnalytics = await Promise.all(
          listsData.slice(0, 5).map(async (list) => {
            const { count: views } = await supabase
              .from('list_views')
              .select('*', { count: 'exact', head: true })
              .eq('list_id', list.id)

            const { count: clicks } = await supabase
              .from('link_clicks')
              .select('*', { count: 'exact', head: true })
              .eq('list_id', list.id)

            return {
              ...list,
              view_count: views || 0,
              click_count: clicks || 0
            }
          })
        )
        
        // Sort by views, then by saves
        topLists = listsWithAnalytics
          .sort((a, b) => {
            if (b.view_count !== a.view_count) {
              return b.view_count - a.view_count
            }
            return b.save_count - a.save_count
          })
      } else {
        // No analytics tables, just use save_count for sorting
        topLists = listsData.slice(0, 5).map(list => ({
          ...list,
          view_count: 0,
          click_count: 0
        }))
      }
    }

    return NextResponse.json({
      totalViews,
      totalClicks,
      totalSaves,
      topLists
    })
  } catch (error) {
    console.error('Error fetching analytics stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}