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

    // Helper to fetch by id or public_id
    const fetchListByColumn = async (column: 'id' | 'public_id') => {
      return supabase
        .from('lists')
        .select(`
          id, public_id, title, emoji, is_public, price_cents, currency, view_mode, user_id, created_at, updated_at,
          links (
            id, list_id, title, url, description, image_url, position, created_at, updated_at
          )
        `)
        .eq(column, listId)
        .maybeSingle()
    }

    // Attempt to resolve public lists first (most URLs use public_id now)
    const { data: listByPublicId, error: publicIdError } = await fetchListByColumn('public_id')
    let list = listByPublicId
    let fetchError = publicIdError

    if (!list) {
      const { data: listById, error: idError } = await fetchListByColumn('id')
      list = listById
      fetchError = idError
    }

    if (!list) {
      if (fetchError) {
        console.error('Error fetching list:', fetchError)
      }
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Check if user has permission to view the list
    if (!list.is_public && list.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch user data separately
    const { data: userData } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', list.user_id)
      .single()

    // Sort links by position and format response
    const listWithSortedLinks = {
      ...list,
      links: list.links?.sort((a: any, b: any) => a.position - b.position) || [],
      user: userData ? {
        id: userData.id,
        username: userData.username
      } : null
    }

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
    if (body.is_public !== undefined) updateData.is_public = body.is_public
    if (body.view_mode !== undefined) updateData.view_mode = body.view_mode

    // Update the list
    const { error: updateError } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', listId)
    
    if (updateError) {
      console.error('Error updating list:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Fetch the updated list with links
    const { data: updatedList, error: refetchError } = await supabase
      .from('lists')
      .select(`
        id, public_id, title, emoji, is_public, price_cents, currency, view_mode, user_id, created_at, updated_at,
        links (
          id, list_id, title, url, description, image_url, position, created_at, updated_at
        )
      `)
      .eq('id', listId)
      .single()

    if (refetchError || !updatedList) {
      console.error('Error fetching updated list:', refetchError)
      // If refetch fails, at least return success since the update worked
      // The frontend can refetch the list if needed
      return NextResponse.json({
        success: true,
        message: 'List updated successfully but failed to return updated data'
      })
    }

    // Fetch user data separately
    const { data: userData } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', updatedList.user_id)
      .single()

    // Sort links by position and format response
    const listWithSortedLinks = {
      ...updatedList,
      links: updatedList.links?.sort((a: any, b: any) => a.position - b.position) || [],
      user: userData ? {
        id: userData.id,
        username: userData.username
      } : null
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
