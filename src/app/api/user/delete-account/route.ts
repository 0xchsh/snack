import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
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
    const validatedData = deleteAccountSchema.parse(body);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        lists: {
          include: {
            items: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count what will be deleted for logging
    const listCount = user.lists.length;
    const itemCount = user.lists.reduce((sum, list) => sum + list.items.length, 0);

    console.log(`Deleting user ${userId}: ${listCount} lists, ${itemCount} items`);

    // Delete user from database (cascade will handle lists and items)
    await prisma.user.delete({
      where: { clerkId: userId }
    });

    // Delete user from Clerk
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (clerkError) {
      console.error('Clerk deletion error:', clerkError);
      // Continue even if Clerk deletion fails - database cleanup is more important
    }

    console.log(`Successfully deleted user ${userId} and ${listCount} lists with ${itemCount} items`);

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