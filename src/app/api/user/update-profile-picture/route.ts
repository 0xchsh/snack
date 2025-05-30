import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB' }, { status: 400 });
    }

    // Update profile image using Clerk
    const client = await clerkClient();
    
    // Use Clerk's profile image update method
    await client.users.updateUserProfileImage(userId, {
      file: file
    });

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully'
    });

  } catch (error: unknown) {
    console.error('Profile picture update error:', error);

    return NextResponse.json(
      { error: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
} 