import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// DELETE /api/lists/[id]/links/[linkId] - Delete a link from a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const listId = params.id
    const linkId = params.linkId
    
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
    
    // Get the link's position before deleting
    const { data: linkToDelete } = await supabase
      .from('links')
      .select('position')
      .eq('id', linkId)
      .eq('list_id', listId)
      .single()
    
    // Delete the link
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId)
      .eq('list_id', listId)
    
    if (deleteError) {
      console.error('Error deleting link:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    // Update positions of remaining links
    if (linkToDelete) {
      await supabase
        .from('links')
        .update({ position: supabase.raw('position - 1') })
        .eq('list_id', listId)
        .gt('position', linkToDelete.position)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]/links/[linkId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/lists/[id]/links/[linkId] - Update a link
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const listId = params.id
    const linkId = params.linkId
    
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
    
    // Update the link
    const { data: updatedLink, error: updateError } = await supabase
      .from('links')
      .update({
        title: body.title,
        description: body.description,
        image_url: body.image_url,
        favicon_url: body.favicon_url,
        url: body.url
      })
      .eq('id', linkId)
      .eq('list_id', listId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating link:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json({ data: updatedLink })
  } catch (error) {
    console.error('Error in PATCH /api/lists/[id]/links/[linkId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}