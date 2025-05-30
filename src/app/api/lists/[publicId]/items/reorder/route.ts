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
  console.log('🔄 Reorder API called for publicId:', publicId);
  
  const user = await currentUser();

  if (!user) {
    console.log('❌ Unauthorized: No user found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('✅ User authenticated:', user.id);

  try {
    const { itemIds } = await request.json();
    console.log('📝 Received itemIds:', itemIds);

    if (!Array.isArray(itemIds)) {
      console.log('❌ itemIds is not an array:', typeof itemIds);
      return NextResponse.json({ error: 'itemIds must be an array' }, { status: 400 });
    }

    console.log('🔍 Finding list with publicId:', publicId);
    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, user:users(clerk_id), items:items(id)')
      .eq('public_id', publicId)
      .single();

    if (listError || !list) {
      console.log('❌ List not found for publicId:', publicId);
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    console.log('✅ List found:', list.id, 'with', list.items.length, 'items');

    let userObj: { clerk_id: string } | null = null;
    if (Array.isArray(list.user)) {
      userObj = list.user[0] ?? null;
    } else {
      userObj = list.user ?? null;
    }
    if (!userObj || userObj.clerk_id !== user.id) {
      console.log('❌ Forbidden: User', user.id, 'does not own list owned by', userObj?.clerk_id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ User owns the list');

    // Verify all item IDs belong to this list
    const listItemIds = list.items.map((item: any) => item.id);
    console.log('📋 List item IDs:', listItemIds);
    
    const invalidIds = itemIds.filter((id: string) => !listItemIds.includes(id));
    
    if (invalidIds.length > 0) {
      console.log('❌ Invalid item IDs found:', invalidIds);
      return NextResponse.json({ error: 'Invalid item IDs' }, { status: 400 });
    }

    console.log('✅ All item IDs are valid');

    // Update the order of each item
    // Higher order numbers will appear first (newest on top)
    console.log('🔄 Starting database updates...');
    const updatePromises = itemIds.map((itemId: string, index: number) => {
      const newOrder = itemIds.length - index;
      console.log(`📝 Updating item ${itemId} to order ${newOrder}`);
      return supabase
        .from('items')
        .update({ order: newOrder })
        .eq('id', itemId);
    });

    console.log('⏳ Executing', updatePromises.length, 'update operations...');
    await Promise.all(updatePromises);
    console.log('✅ All updates completed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Failed to reorder items - Full error:', error);
    console.error('💥 Error name:', (error as Error)?.name);
    console.error('💥 Error message:', (error as Error)?.message);
    console.error('💥 Error stack:', (error as Error)?.stack);
    return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 });
  }
} 