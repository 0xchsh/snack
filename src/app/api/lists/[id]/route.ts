import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/lists/[id] - Get a specific list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await params
    
    // Get current user (optional for public lists)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch the list with links and user information
    const { data: list, error } = await supabase
      .from('lists')
      .select(`
        *,
        links (
          *
        ),
        users!lists_user_id_fkey (
          id,
          username
        )
      `)
      .eq('id', listId)
      .single()
    
    if (error || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    // Check if user has permission to view the list
    if (!list.is_public && list.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Sort links by position and format response
    const listWithSortedLinks = {
      ...list,
      links: list.links?.sort((a: any, b: any) => a.position - b.position) || [],
      user: list.users ? {
        id: list.users.id,
        username: list.users.username
      } : null
    }
    
    // Remove the nested users object from the response
    delete (listWithSortedLinks as any).users
    
    return NextResponse.json({ data: listWithSortedLinks })
  } catch (error) {
    console.error('Error in GET /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/lists/[id] - Update a list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Check if user owns the list
    const { data: existingList, error: fetchError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single()
    
    if (fetchError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    if (existingList.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update the list - only update provided fields
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.emoji !== undefined) updateData.emoji = body.emoji
    if (body.emoji_3d !== undefined) updateData.emoji_3d = body.emoji_3d
    if (body.is_public !== undefined) updateData.is_public = body.is_public
    if (body.view_mode !== undefined) updateData.view_mode = body.view_mode

    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', listId)
      .select(`
        *,
        links (
          *
        )
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating list:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Sort links by position
    const listWithSortedLinks = {
      ...updatedList,
      links: updatedList.links?.sort((a: any, b: any) => a.position - b.position) || []
    }
    
    return NextResponse.json({ data: listWithSortedLinks })
  } catch (error) {
    console.error('Error in PATCH /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user owns the list
    const { data: existingList, error: fetchError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single()
    
    if (fetchError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    if (existingList.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete the list (links will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
    
    if (deleteError) {
      console.error('Error deleting list:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}