import { NextRequest, NextResponse } from 'next/server';
import { createServerAuth } from "@/lib/auth-server"
import { createServerSupabaseClient } from "@/lib/auth-server"
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username must be 15 characters or less')
    .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
    .optional(),
  first_name: z.string().max(50, 'First name must be 50 characters or less').optional(),
  last_name: z.string().max(50, 'Last name must be 50 characters or less').optional(),
  email: z.string().email('Invalid email format').optional()
});

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    const { username, first_name, last_name, email } = validatedData;

    const supabase = createServerSupabaseClient();
    
    // Get current user from database
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
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
        .neq('id', user.id)
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
    if (first_name !== undefined) dbUpdates.first_name = first_name;
    if (last_name !== undefined) dbUpdates.last_name = last_name;
    if (email !== undefined) dbUpdates.email = email;

    // Update auth user metadata if needed
    if (first_name !== undefined || last_name !== undefined || username !== undefined) {
      const metadataUpdates: any = {};
      if (first_name !== undefined) metadataUpdates.first_name = first_name;
      if (last_name !== undefined) metadataUpdates.last_name = last_name;
      if (username !== undefined) metadataUpdates.username = username;
      
      try {
        await serverAuth.updateUserMetadata(user.id, metadataUpdates);
      } catch (authError) {
        console.error('Auth metadata update error:', authError);
        // Don't fail the request for metadata errors
      }
    }

    // Update database if needed
    let updatedUser = currentUser;
    if (Object.keys(dbUpdates).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message || 'Failed to update user' }, { status: 500 });
      }
      updatedUser = updated;
    }

    return NextResponse.json({
      success: true,
      user: {
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name
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