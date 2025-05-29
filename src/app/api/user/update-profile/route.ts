import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(16, 'Username must be 16 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .regex(/^[a-zA-Z0-9]/, 'Username must start with a letter or number')
    .regex(/[a-zA-Z0-9]$/, 'Username must end with a letter or number')
    .optional(),
  firstName: z.string().max(50, 'First name must be 50 characters or less').optional(),
  lastName: z.string().max(50, 'Last name must be 50 characters or less').optional(),
  email: z.string().email('Invalid email format').optional()
});

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    const { username, firstName, lastName, email } = validatedData;

    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if username is being changed and if it's available
    if (username && username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive'
          },
          NOT: {
            clerkId: userId
          }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Prepare updates for database
    const dbUpdates: any = {};
    if (username !== undefined) dbUpdates.username = username;
    if (firstName !== undefined) dbUpdates.firstName = firstName;
    if (lastName !== undefined) dbUpdates.lastName = lastName;

    // Prepare updates for Clerk
    const clerkUpdates: any = {};
    if (firstName !== undefined) clerkUpdates.firstName = firstName;
    if (lastName !== undefined) clerkUpdates.lastName = lastName;
    if (email !== undefined) clerkUpdates.emailAddresses = [{ emailAddress: email }];

    // Update Clerk user if needed
    if (Object.keys(clerkUpdates).length > 0) {
      try {
        const client = await clerkClient();
        await client.users.updateUser(userId, clerkUpdates);
      } catch (clerkError) {
        console.error('Clerk update error:', clerkError);
        return NextResponse.json(
          { error: 'Failed to update email/name. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Update database if needed
    let updatedUser = currentUser;
    if (Object.keys(dbUpdates).length > 0) {
      updatedUser = await prisma.user.update({
        where: { clerkId: userId },
        data: dbUpdates
      });
    }

    // Sync username to Clerk metadata for future reference
    if (username && username !== currentUser.username) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            username: username
          }
        });
      } catch (metadataError) {
        console.error('Clerk metadata update error:', metadataError);
        // Don't fail the request for metadata errors
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      },
      message: 'Profile updated successfully'
    });

  } catch (error: unknown) {
    console.error('Profile update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
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