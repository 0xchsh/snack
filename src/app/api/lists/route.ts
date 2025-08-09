import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/utils/supabase/server';
import { createServerAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
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
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, emoji } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const newId = nanoid();
    const now = new Date().toISOString();
    
    // With Supabase auth, user.id is the primary key in users table
    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        id: newId,
        public_id: nanoid(),
        title,
        description,
        emoji,
        user_id: user.id, // Direct auth user ID
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