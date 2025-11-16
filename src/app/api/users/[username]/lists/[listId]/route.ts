import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateUsername } from '@/lib/username-utils'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    const selectFields = `
      id,
      public_id,
      user_id,
      title,
      description,
      emoji,
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
    `

    const fetchListByIdentifier = async (column: 'public_id' | 'id', value: string) => {
      return supabase
        .from('lists')
        .select(selectFields)
        .eq(column, value)
        .eq('user_id', user.id) // Ensure the list belongs to the specified user
        .maybeSingle()
    }

    // Try resolving via public_id first, then fall back to the internal id.
    const { data: listByPublicId, error: publicIdError } = await fetchListByIdentifier('public_id', listId)

    let list = listByPublicId
    let listError = publicIdError

    if (!list) {
      const { data: listById, error: idError } = await fetchListByIdentifier('id', listId)
      list = listById
      listError = idError
    }

    if (!list) {
      if (listError) {
        console.error('Error fetching list:', listError)
      }
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Check if user has permission to view this list
    if (!list.is_public && !isOwner) {
      return NextResponse.json({ error: 'This list is private' }, { status: 403 })
    }

    // Sort links by position
    const sortedLinks = list.links ?
      [...list.links].sort((a, b) => a.position - b.position) : []

    const processedList = {
      ...list,
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
