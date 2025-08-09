import { NextRequest, NextResponse } from 'next/server';
import { createServerAuth } from "@/lib/auth-server"
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    if (!user) {
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

    const supabase = await createClient();
    
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    // Update user avatar URL in database
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update profile picture URL' },
        { status: 500 }
      );
    }

    // Update auth user metadata
    try {
      await serverAuth.updateUserMetadata(user.id, { avatar_url: publicUrl });
    } catch (authError) {
      console.error('Auth metadata update error:', authError);
      // Don't fail the request for metadata errors
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      avatar_url: publicUrl
    });

  } catch (error: unknown) {
    console.error('Profile picture update error:', error);

    return NextResponse.json(
      { error: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
} 