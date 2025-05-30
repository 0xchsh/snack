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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, emoji } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        public_id: nanoid(),
        title,
        description,
        emoji,
        user_id: user.id,
        view_mode: 'LIST',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
} 