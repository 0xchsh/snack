import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validateUsername } from '@/lib/username-utils'

// GET /api/username/check?username=foo - Check if username is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // First validate the format
    const validation = validateUsername(username)
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: validation.error
      })
    }

    const supabase = await createServerSupabaseClient()

    // Get current user (optional - to exclude their own username)
    const { data: { user } } = await supabase.auth.getUser()

    // Check if username is taken
    let query = supabase
      .from('users')
      .select('id')
      .ilike('username', username)

    // If user is logged in, exclude their own username
    if (user) {
      query = query.neq('id', user.id)
    }

    const { data: existingUser, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which means username is available
      console.error('Error checking username:', error)
      return NextResponse.json(
        { error: 'Failed to check username' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      available: !existingUser,
      error: existingUser ? 'Username is already taken' : null
    })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
