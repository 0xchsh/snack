'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Edit, Loader2, Trash2, User } from 'lucide-react'

import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/loading-state'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state while mounting or checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You need to be signed in to view your profile.</p>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppContainer variant="app">
        <div className="py-8">
          <div className="max-w-[560px] w-full mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Profile"
                profilePictureUrl={user.profile_picture_url}
              />
            </div>

            <AccountTab user={user} signOut={signOut} />
          </div>
        </div>
      </AppContainer>
    </div>
  )
}

function AccountTab({ user, signOut }: { user: any; signOut: () => Promise<void> }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [currentUser, setCurrentUser] = useState(user)
  const [formData, setFormData] = useState<{
    first_name: string
    last_name: string
    username: string
    email: string
    bio: string
    profile_is_public: boolean
  }>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    email: user.email || '',
    bio: user.bio || '',
    profile_is_public: user.profile_is_public ?? true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setMessage(null)

      // Use the auth context signOut method
      await signOut()

      // The signOut method in useAuth already handles redirect to '/'
      // No need to manually redirect here
    } catch (error) {
      console.error('Error logging out:', error)
      setMessage({ type: 'error', text: 'Failed to sign out. Please try again.' })
      setIsLoggingOut(false)
    }
  }

  // Reset form when user data changes
  useEffect(() => {
    setCurrentUser(user)
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      profile_is_public: user.profile_is_public ?? true,
    })
  }, [user])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPicture(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setCurrentUser(result.data.user)
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
      
      // Refresh the page to update all user contexts
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading picture:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to upload picture' })
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleRemovePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return
    }

    setUploadingPicture(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Remove failed')
      }

      setCurrentUser(result.data.user)
      setMessage({ type: 'success', text: 'Profile picture removed successfully!' })
      
      // Refresh the page to update all user contexts
      window.location.reload()
    } catch (error: any) {
      console.error('Error removing picture:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to remove picture' })
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!formData.username || !formData.email) {
      setMessage({ type: 'error', text: 'Username and email are required' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Update failed')
      }

      setCurrentUser(result.data)
      setIsEditing(false)
      setMessage({ type: 'success', text: result.warning || 'Profile updated successfully!' })
      
      // Refresh the page to update all user contexts
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      username: currentUser.username || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      profile_is_public: currentUser.profile_is_public ?? true,
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="space-y-3">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {currentUser.profile_picture_url ? (
                <Image
                  src={currentUser.profile_picture_url}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            {uploadingPicture && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-1">Profile Picture</h3>
            <p className="text-sm text-muted-foreground mb-3">JPG, PNG, or GIF (max 2MB)</p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingPicture}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingPicture ? 'Uploading...' : 'Upload New Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingPicture}
              />
              {currentUser.profile_picture_url && (
                <Button
                  type="button"
                  onClick={handleRemovePicture}
                  disabled={uploadingPicture}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground">Update your personal details here.</p>
          </div>
          <Button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your first name"
                disabled={isSaving}
              />
            ) : (
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                {currentUser.first_name || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your last name"
                disabled={isSaving}
              />
            ) : (
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                {currentUser.last_name || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your username"
                disabled={isSaving}
                required
              />
            ) : (
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                @{currentUser.username}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your email"
                disabled={isSaving}
                required
              />
            ) : (
              <div className="px-4 py-3 bg-muted rounded-lg text-foreground">
                {currentUser.email}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              variant="ghost"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Logout Section */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Log Out</h3>
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
          </div>
          <Button
            type="button"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Log Out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

