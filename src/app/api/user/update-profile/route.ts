import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username must be 15 characters or less')
    .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
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
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if username is being changed and if it's available
    if (username && username !== currentUser.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('username', username)
        .neq('clerk_id', userId)
        .single();
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
    if (firstName !== undefined) dbUpdates.first_name = firstName;
    if (lastName !== undefined) dbUpdates.last_name = lastName;

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
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('clerk_id', userId)
        .select()
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message || 'Failed to update user' }, { status: 500 });
      }
      updatedUser = updated;
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
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name
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