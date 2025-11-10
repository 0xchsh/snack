import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/lists/[id]/save - Save a list
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await context.params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if list exists and is public (or owned by user)
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, is_public, user_id')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Users cannot save their own lists
    if (list.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot save your own list' },
        { status: 400 }
      )
    }

    // Check if list is public
    if (!list.is_public) {
      return NextResponse.json(
        { error: 'Cannot save private lists' },
        { status: 403 }
      )
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('list_id', listId)
      .single()

    if (existingSave) {
      return NextResponse.json(
        { error: 'List already saved' },
        { status: 400 }
      )
    }

    // Save the list
    const { data: savedList, error: saveError } = await supabase
      .from('saved_lists')
      .insert({
        user_id: user.id,
        list_id: listId
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving list:', saveError)
      return NextResponse.json(
        { error: 'Failed to save list' },
        { status: 500 }
      )
    }

    // Wait a moment for the trigger to execute, then fetch updated save_count
    await new Promise(resolve => setTimeout(resolve, 200))

    const { data: updatedList, error: fetchError } = await supabase
      .from('lists')
      .select('save_count')
      .eq('id', listId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated save_count:', fetchError)
    }

    console.log(`[SAVE] List ${listId} - save_count after save: ${updatedList?.save_count}`)

    return NextResponse.json({
      success: true,
      data: {
        ...savedList,
        save_count: updatedList?.save_count ?? 0
      }
    })
  } catch (error) {
    console.error('Error in save list endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/lists/[id]/save - Unsave a list
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await context.params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete the save
    const { error: deleteError } = await supabase
      .from('saved_lists')
      .delete()
      .eq('user_id', user.id)
      .eq('list_id', listId)

    if (deleteError) {
      console.error('Error unsaving list:', deleteError)
      return NextResponse.json(
        { error: 'Failed to unsave list' },
        { status: 500 }
      )
    }

    // Wait a moment for the trigger to execute, then fetch updated save_count
    await new Promise(resolve => setTimeout(resolve, 100))

    const { data: updatedList } = await supabase
      .from('lists')
      .select('save_count')
      .eq('id', listId)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        save_count: updatedList?.save_count || 0
      }
    })
  } catch (error) {
    console.error('Error in unsave list endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/lists/[id]/save - Check if list is saved by current user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: listId } = await context.params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        success: true,
        data: { isSaved: false }
      })
    }

    // Check if saved
    const { data: savedList, error: checkError } = await supabase
      .from('saved_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('list_id', listId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking save status:', checkError)
      return NextResponse.json(
        { error: 'Failed to check save status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { isSaved: !!savedList }
    })
  } catch (error) {
    console.error('Error in check save status endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
