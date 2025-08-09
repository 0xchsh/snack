import { NextResponse } from 'next/server';
import { createServerAuth } from '@/lib/auth-server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get the database user record
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch list data, ensuring it belongs to the current user
    const { data: list, error } = await supabase
      .from('lists')
      .select('*')
      .eq('public_id', publicId)
      .eq('user_id', user.id)
      .single();

    if (error || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: list.id,
      publicId: list.public_id,
      title: list.title,
      userId: user.id,
      username: dbUser.username,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard list data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}