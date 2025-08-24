import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchOGData } from '@/lib/og'

// POST /api/lists/[id]/links - Add a link to a list
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const listId = params.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user owns the list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single()
    
    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    if (list.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const body = await request.json()
    
    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }
    
    // Fetch OpenGraph data for the URL
    let ogData = null
    try {
      ogData = await fetchOGData(body.url)
    } catch (error) {
      console.error('Error fetching OG data:', error)
      // Continue without OG data
    }
    
    // Get the current max position
    const { data: maxPositionData } = await supabase
      .from('links')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    
    const nextPosition = body.position !== undefined 
      ? body.position 
      : (maxPositionData?.position ?? -1) + 1
    
    // If inserting at a specific position, shift other links
    if (body.position !== undefined) {
      await supabase
        .from('links')
        .update({ position: supabase.raw('position + 1') })
        .eq('list_id', listId)
        .gte('position', body.position)
    }
    
    // Create the link
    const { data: link, error: linkError } = await supabase
      .from('links')
      .insert({
        list_id: listId,
        url: body.url,
        title: body.title || ogData?.title || new URL(body.url).hostname,
        description: body.description || ogData?.description,
        image_url: body.image_url || ogData?.image_url,
        favicon_url: body.favicon_url || ogData?.favicon_url,
        position: nextPosition
      })
      .select()
      .single()
    
    if (linkError) {
      console.error('Error creating link:', linkError)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }
    
    return NextResponse.json({ data: link })
  } catch (error) {
    console.error('Error in POST /api/lists/[id]/links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/lists/[id]/links/reorder - Reorder links in a list
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const listId = params.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user owns the list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single()
    
    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    if (list.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { linkIds } = await request.json()
    
    if (!Array.isArray(linkIds)) {
      return NextResponse.json({ error: 'linkIds must be an array' }, { status: 400 })
    }
    
    // Update positions for all links
    const updates = linkIds.map((linkId, index) => 
      supabase
        .from('links')
        .update({ position: index })
        .eq('id', linkId)
        .eq('list_id', listId)
    )
    
    await Promise.all(updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/lists/[id]/links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}