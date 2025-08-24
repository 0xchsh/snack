import { User, UserUpdate } from '@/types'
import { createClient } from '@/lib/supabase'

// Supabase profile management service
export class SupabaseProfileService {
  private supabase = createClient()
  
  constructor() {
    if (!this.supabase) {
      throw new Error('Supabase client failed to initialize. Check your environment variables.')
    }
    console.log('SupabaseProfileService initialized')
  }

  // Get current user profile
  async getCurrentProfile(): Promise<User | null> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('No active session:', sessionError)
        return null
      }

      // Fetch user profile from users table
      const { data: profile, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Failed to get current profile:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<UserUpdate>): Promise<{ data?: User, error?: string }> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { error: 'You must be signed in to update your profile' }
      }

      // Validate username uniqueness if username is being updated
      if (updates.username) {
        const { data: existingUser, error: usernameError } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', updates.username)
          .neq('id', session.user.id)
          .single()

        if (usernameError && usernameError.code !== 'PGRST116') {
          console.error('Error checking username:', usernameError)
          return { error: 'Failed to validate username' }
        }

        if (existingUser) {
          return { error: 'Username is already taken' }
        }
      }

      // Update profile in users table
      const { data: updatedProfile, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return { error: 'Failed to update profile' }
      }

      // If email is being updated, update it in Supabase Auth as well
      if (updates.email && updates.email !== session.user.email) {
        const { error: emailUpdateError } = await this.supabase.auth.updateUser({
          email: updates.email
        })

        if (emailUpdateError) {
          console.error('Error updating email in auth:', emailUpdateError)
          // Profile was updated but email sync failed - this is a warning, not a failure
        }
      }

      return { data: updatedProfile }
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { error: 'Internal error occurred while updating profile' }
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ data?: { url: string, user: User }, error?: string }> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { error: 'You must be signed in to upload a profile picture' }
      }

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return { error: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.' }
      }

      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        return { error: 'File too large. Please upload an image under 2MB.' }
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`
      const filePath = `profile-pictures/${fileName}`

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        return { error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Update profile with new picture URL
      const { data: updatedProfile, error: updateError } = await this.supabase
        .from('users')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile picture URL:', updateError)
        
        // Clean up uploaded file
        await this.supabase.storage
          .from('avatars')
          .remove([filePath])

        return { error: 'Failed to update profile picture' }
      }

      return { data: { url: publicUrl, user: updatedProfile } }
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      return { error: 'Internal error occurred while uploading image' }
    }
  }

  // Remove profile picture
  async removeProfilePicture(): Promise<{ data?: User, error?: string }> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { error: 'You must be signed in to remove your profile picture' }
      }

      // Get current profile to find existing picture URL
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return { error: 'Failed to fetch profile' }
      }

      // Delete file from storage if it exists
      if (profile.profile_picture_url) {
        try {
          const urlParts = profile.profile_picture_url.split('/avatars/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await this.supabase.storage
              .from('avatars')
              .remove([filePath])
          }
        } catch (deleteError) {
          console.error('Error deleting file from storage:', deleteError)
          // Continue with profile update even if file deletion fails
        }
      }

      // Update profile to remove picture URL
      const { data: updatedProfile, error: updateError } = await this.supabase
        .from('users')
        .update({
          profile_picture_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error removing profile picture URL:', updateError)
        return { error: 'Failed to remove profile picture' }
      }

      return { data: updatedProfile }
    } catch (error) {
      console.error('Failed to remove profile picture:', error)
      return { error: 'Internal error occurred while removing image' }
    }
  }

  // Delete user account (cascade delete)
  async deleteAccount(): Promise<{ success?: boolean, error?: string }> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { error: 'You must be signed in to delete your account' }
      }

      // Delete user from auth.users (this will cascade to our users table)
      const { error: deleteError } = await this.supabase.auth.admin.deleteUser(
        session.user.id
      )

      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return { error: 'Failed to delete account. Please try again.' }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to delete account:', error)
      return { error: 'Internal error occurred while deleting account' }
    }
  }
}

// Export singleton instance
export const supabaseProfileService = new SupabaseProfileService()