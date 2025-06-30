import { NextResponse } from 'next/server';
import { createServerAuth, createServerSupabaseClient } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{
    publicId: string;
    itemId: string;
  }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { publicId, itemId } = await params;
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  
  try {
    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*, user:users(id)')
      .eq('public_id', publicId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (list.user.id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the item and verify it belongs to this list
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, list_id')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.list_id !== list.id) {
      return NextResponse.json({ error: 'Item does not belong to this list' }, { status: 403 });
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
} 