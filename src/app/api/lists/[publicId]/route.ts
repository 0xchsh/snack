import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerAuth } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emoji, title, description, viewMode } = await request.json();
    const supabase = createServerSupabaseClient();

    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('public_id', publicId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Simple ownership check with Supabase auth
    if (list.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (emoji !== undefined) {
      updateData.emoji = emoji;
    }
    
    if (title !== undefined) {
      // Use "Untitled List" as fallback for empty titles
      updateData.title = title && title.trim() ? title.trim() : "Untitled List";
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (viewMode !== undefined && (viewMode === 'LIST' || viewMode === 'GALLERY')) {
      updateData.view_mode = viewMode;
    }

    // Update the list
    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update(updateData)
      .eq('public_id', publicId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
    }

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Failed to update list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
} 

export async function DELETE(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    
    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('public_id', publicId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Simple ownership check with Supabase auth
    if (list.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the list (cascades to items if FK is set up)
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('public_id', publicId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
} 