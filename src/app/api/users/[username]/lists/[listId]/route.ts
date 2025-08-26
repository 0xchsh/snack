import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateUsername } from '@/lib/username-utils'
import { getEmoji3D, getDefaultEmoji3D } from '@/lib/emoji'

// GET /api/users/[username]/lists/[listId] - Get a specific list by username and listId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; listId: string }> }
) {
  try {
    const supabase = createClient()
    const { username, listId } = await params

    if (!username || !listId) {
      return NextResponse.json({ error: 'Username and listId are required' }, { status: 400 })
    }

    // Validate username format
    const validation = validateUsername(username)
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
    }

    // First, find the user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current user to check permissions
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwner = currentUser?.id === user.id

    // Fetch the list with links, checking ownership and visibility
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select(`
        id,
        user_id,
        title,
        description,
        emoji,
        emoji_3d,
        view_mode,
        is_public,
        save_count,
        created_at,
        updated_at,
        links (
          id,
          url,
          title,
          description,
          image_url,
          favicon_url,
          position,
          created_at,
          updated_at
        )
      `)
      .eq('id', listId)
      .eq('user_id', user.id) // Ensure the list belongs to the specified user
      .single()

    if (listError) {
      console.error('Error fetching list:', listError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Check if user has permission to view this list
    if (!list.is_public && !isOwner) {
      return NextResponse.json({ error: 'This list is private' }, { status: 403 })
    }

    // Process emoji_3d data
    let emoji3d = null
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

    // Sort links by position
    const sortedLinks = list.links ? 
      [...list.links].sort((a, b) => a.position - b.position) : []

    const processedList = {
      ...list,
      emoji_3d: emoji3d,
      links: sortedLinks,
      user: {
        username: user.username
      }
    }

    return NextResponse.json({
      data: processedList
    })
  } catch (error) {
    console.error('User list GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}