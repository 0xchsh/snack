import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; listId: string }> }
) {
  try {
    const { username, listId } = await params;
    
    // 1. Fetch user from Clerk by username
    const client = await clerkClient();
    const response = await client.users.getUserList({ limit: 200 });
    const clerkUser = response.data.find((u: { publicMetadata: { username?: string } }) => 
      u.publicMetadata?.username === username
    );
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get the database user record
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Fetch list data, ensuring it belongs to the correct user
    const { data: list, error } = await supabase
      .from('lists')
      .select('*')
      .eq('public_id', listId)
      .eq('user_id', dbUser.id)
      .single();

    if (error || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: list.id,
      publicId: list.public_id,
      title: list.title,
      userId: clerkUser.id,
    });
  } catch (error) {
    console.error('Failed to fetch list data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}