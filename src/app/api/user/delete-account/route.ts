import { NextRequest, NextResponse } from 'next/server';
import { createServerAuth } from "@/lib/auth-server"
import { createClient } from '@/utils/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmationText: z.string().refine(
    (val) => val === 'DELETE MY ACCOUNT',
    'You must type "DELETE MY ACCOUNT" to confirm deletion'
  )
});

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    deleteAccountSchema.parse(body);

    const supabase = await createClient();
    const adminSupabase = createAdminSupabaseClient();
    
    // Fetch lists for stats (optional)
    const { data: lists, error: listErr } = await supabase
      .from('lists')
      .select('id')
      .eq('user_id', user.id);

    if (listErr) throw listErr;

    const listIds = lists?.map((l) => l.id) || [];
    const listCount = listIds.length;

    let itemCount = 0;
    if (listCount > 0) {
      const { count, error: itemErr } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .in('list_id', listIds);
      if (itemErr) throw itemErr;
      itemCount = count ?? 0;
    }

    // Delete user (cascade removes lists/items)
    const { error: deleteErr } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteErr) throw deleteErr;

    // Delete user from Supabase Auth using admin client
    try {
      const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
      if (authDeleteError) {
        console.error('Supabase auth deletion error:', authDeleteError);
      }
    } catch (authError) {
      console.error('Auth deletion error:', authError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletedData: {
        lists: listCount,
        items: itemCount
      }
    });

  } catch (error: unknown) {
    console.error('Account deletion error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid confirmation text',
          details: error.errors[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 