import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/profile/picture - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image under 2MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with user folder structure
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExtension}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars') // You'll need to create this bucket in Supabase
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user profile with new picture URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile picture URL:', updateError)
      
      // Clean up uploaded file if profile update fails
      await supabase.storage
        .from('avatars')
        .remove([filePath])

      return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        profile_picture_url: publicUrl,
        user: updatedProfile
      }
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/profile/picture - Remove profile picture
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile to find existing picture URL
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Extract file path from URL and delete from storage
    if (profile.profile_picture_url) {
      try {
        // Extract path from URL (assuming URL format: ...storage/v1/object/public/avatars/profile-pictures/...)
        const urlParts = profile.profile_picture_url.split('/avatars/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage
            .from('avatars')
            .remove([filePath])
        }
      } catch (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
        // Continue with profile update even if file deletion fails
      }
    }

    // Update user profile to remove picture URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error removing profile picture URL:', updateError)
      return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        profile_picture_url: null,
        user: updatedProfile
      }
    })
  } catch (error) {
    console.error('Profile picture deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}