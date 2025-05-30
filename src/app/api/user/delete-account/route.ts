import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    deleteAccountSchema.parse(body);

    // Fetch lists for stats (optional)
    const { data: lists, error: listErr } = await supabase
      .from('lists')
      .select('id')
      .eq('user_id', userId);

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
      .eq('clerk_id', userId);

    if (deleteErr) throw deleteErr;

    // Delete user from Clerk
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (clerkError) {
      console.error('Clerk deletion error:', clerkError);
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