import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// GET /api/saved-lists - fetch all saved lists for current user
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get the user's DB id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  if (userError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch saved lists (join with lists table for details)
  const { data: saved, error: savedError } = await supabase
    .from('saved_lists')
    .select('list_id, created_at, lists(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (savedError) return NextResponse.json({ error: savedError.message }, { status: 500 });

  return NextResponse.json(saved);
}

// POST /api/saved-lists - save a list for current user
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { listId } = await request.json();
  if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 });

  // Get the user's DB id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  if (userError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent saving own list (optional, can be removed if not needed)
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', listId)
    .single();
  if (listError || !list) return NextResponse.json({ error: 'List not found' }, { status: 404 });
  if (list.user_id === user.id) return NextResponse.json({ error: 'Cannot save your own list' }, { status: 400 });

  // Insert into saved_lists
  const { error: insertError } = await supabase
    .from('saved_lists')
    .insert({ user_id: user.id, list_id: listId });
  if (insertError && insertError.code !== '23505') { // 23505 = unique violation
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/saved-lists - unsave a list for current user
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { listId } = await request.json();
  if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 });

  // Get the user's DB id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  if (userError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Delete from saved_lists
  const { error: deleteError } = await supabase
    .from('saved_lists')
    .delete()
    .eq('user_id', user.id)
    .eq('list_id', listId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
} 