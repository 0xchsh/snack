import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/saved-lists - Get saved lists for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch saved lists with list details
    const { data: savedLists, error: savedListsError } = await supabase
      .from('saved_lists')
      .select(`
        id,
        saved_at,
        list_id,
        lists (
          id,
          public_id,
          title,
          emoji,
          description,
          is_public,
          view_count,
          save_count,
          created_at,
          user_id
        )
      `)
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (savedListsError) {
      console.error('Error fetching saved lists:', savedListsError)
      return NextResponse.json(
        { error: 'Failed to fetch saved lists' },
        { status: 500 }
      )
    }

    // Get unique user IDs from the lists
    const userIds = [...new Set(
      savedLists
        .filter(saved => saved.lists)
        .map(saved => saved.lists.user_id)
        .filter(Boolean)
    )]

    // Fetch user data separately
    const { data: users } = await supabase
      .from('users')
      .select('id, username, profile_picture_url')
      .in('id', userIds)

    // Create a map of user data
    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // Transform the data to match the expected format
    const transformedLists = savedLists
      .filter(saved => saved.lists) // Filter out any null lists
      .map(saved => ({
        ...saved.lists,
        saved_at: saved.saved_at,
        user: userMap.get(saved.lists.user_id) || null
      }))

    return NextResponse.json({
      success: true,
      data: transformedLists
    })
  } catch (error) {
    console.error('Error in saved lists endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
