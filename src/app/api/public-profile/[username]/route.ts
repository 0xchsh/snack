import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getEmoji3D, getDefaultEmoji3D } from '@/lib/emoji'

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
        title,
        description,
        emoji,
        emoji_3d,
        save_count,
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

    // Parse emoji_3d JSON strings and calculate total saves
    const processedLists = lists?.map(list => {
      let emoji3d = null
      
      // Try to parse emoji_3d if it's a string
      if (list.emoji_3d) {
        try {
          emoji3d = typeof list.emoji_3d === 'string' ? JSON.parse(list.emoji_3d) : list.emoji_3d
        } catch (e) {
          console.error('Failed to parse emoji_3d:', e)
        }
      }
      
      // If no valid emoji_3d, try to get 3D version of the emoji
      if (!emoji3d && list.emoji) {
        emoji3d = getEmoji3D(list.emoji)
      }
      
      // If still no emoji_3d, use default
      if (!emoji3d) {
        emoji3d = getDefaultEmoji3D()
      }
      
      return {
        ...list,
        emoji_3d: emoji3d,
        links: list.links
      }
    }) || []

    const totalSavesReceived = processedLists.reduce((sum, list) => sum + (list.save_count || 0), 0)

    return NextResponse.json({
      data: {
        user: profile,
        lists: processedLists,
        stats: {
          total_public_lists: processedLists.length,
          total_saves_received: totalSavesReceived
        }
      }
    })
  } catch (error) {
    console.error('Public profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}