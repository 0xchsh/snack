import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: lists, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser();

  console.log('🔍 Clerk user object:', user);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, emoji } = body;
    console.log('📝 Received request body:', body);

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Look up the internal user ID by Clerk ID
    const { data: userRow, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();

    if (userLookupError || !userRow) {
      console.error('User lookup error:', userLookupError);
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const newId = nanoid();
    const now = new Date().toISOString();
    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        id: newId,
        public_id: nanoid(),
        title,
        description,
        emoji,
        user_id: userRow.id, // use internal ID
        view_mode: 'LIST',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : JSON.stringify(error) }, { status: 500 });
  }
} 