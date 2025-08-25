import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile from our users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      // If user doesn't exist in users table, create a basic profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          first_name: null,
          last_name: null,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user profile:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      return NextResponse.json({ data: newProfile })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { first_name, last_name, username, email, bio, profile_is_public } = body

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { error: 'Username and email are required' }, 
        { status: 400 }
      )
    }

    // Check if username is already taken (by another user)
    if (username) {
      const { data: existingUser, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single()

      if (usernameError && usernameError.code !== 'PGRST116') {
        console.error('Error checking username:', usernameError)
        return NextResponse.json({ error: 'Failed to validate username' }, { status: 500 })
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' }, 
          { status: 400 }
        )
      }
    }

    // Update user profile in our users table
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        username,
        email,
        bio: bio || null,
        profile_is_public: profile_is_public ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // If email changed, update it in Supabase Auth as well
    if (email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email
      })

      if (emailUpdateError) {
        console.error('Error updating email in auth:', emailUpdateError)
        // Note: Profile was updated but email sync failed
        return NextResponse.json({
          data: updatedProfile,
          warning: 'Profile updated but email sync failed. Please verify your new email.'
        })
      }
    }

    return NextResponse.json({ data: updatedProfile })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}