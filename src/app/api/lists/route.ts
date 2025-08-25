import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CreateListForm } from '@/types'

// GET /api/lists - Get all lists for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch user's lists with links
    const { data: lists, error } = await supabase
      .from('lists')
      .select(`
        *,
        links (
          *
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching lists:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Sort links by position for each list
    const listsWithSortedLinks = lists?.map(list => ({
      ...list,
      links: list.links?.sort((a: any, b: any) => a.position - b.position) || []
    }))
    
    return NextResponse.json({ data: listsWithSortedLinks })
  } catch (error) {
    console.error('Error in GET /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body: CreateListForm = await request.json()
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    // Create the list
    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        title: body.title,
        emoji: body.emoji || '🎯',
        emoji_3d: body.emoji_3d || null,
        is_public: body.is_public !== undefined ? body.is_public : true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating list:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Return the created list with empty links array
    return NextResponse.json({ 
      data: {
        ...list,
        links: []
      }
    })
  } catch (error) {
    console.error('Error in POST /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}