import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET /api/public-profile/[username] - Get public profile data for a username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = createClient()
    const { username } = await params

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Fetch user profile from users table (public data only)
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        profile_picture_url,
        profile_is_public,
        bio,
        created_at
      `)
      .eq('username', username)
      .single()

    if (error) {
      console.error('Error fetching public profile:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch user's public lists with basic stats and link count
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select(`
        id,
        public_id,
        title,
        description,
        emoji,
        save_count,
        view_count,
        created_at,
        updated_at,
        links(count)
      `)
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (listsError) {
      console.error('Error fetching public lists:', listsError)
      // Return profile without lists if there's an error
      return NextResponse.json({
        data: {
          user: profile,
          lists: [],
          stats: {
            total_public_lists: 0,
            total_saves_received: 0
          }
        }
      })
    }

    // Process lists
    const processedLists = lists?.map(list => ({
      ...list,
      links: list.links
    })) || []

    const totalSavesReceived = processedLists.reduce((sum, list) => sum + (list.save_count || 0), 0)
    const totalLinks = processedLists.reduce((sum, list) => sum + (list.links?.[0]?.count || 0), 0)
    const totalViews = processedLists.reduce((sum, list) => sum + (list.view_count || 0), 0)

    return NextResponse.json({
      data: {
        user: profile,
        lists: processedLists,
        stats: {
          total_public_lists: processedLists.length,
          total_saves_received: totalSavesReceived,
          total_links: totalLinks,
          total_views: totalViews
        }
      }
    })
  } catch (error) {
    console.error('Public profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}