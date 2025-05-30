import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emoji, title, description, viewMode } = await request.json();

    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*, user:users(clerk_id)')
      .eq('public_id', publicId)
      .single();

    console.log('Fetched list:', list);
    console.log('Fetched list.user:', list?.user);

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    let userObj = null;
    if (Array.isArray(list.user)) {
      userObj = list.user[0] ?? null;
    } else {
      userObj = list.user ?? null;
    }
    if (!userObj || userObj.clerk_id !== user.id) {
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