'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightStartOnRectangleIcon, DocumentDuplicateIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

import { Button, Spinner, Toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/loading-state'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'
import { DefaultAvatar } from '@/components/default-avatar'

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
        <LoadingState message="Loading profile…" />
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-semibold"
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
    profile_is_public: boolean
  }>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    email: user.email || '',
    profile_is_public: user.profile_is_public ?? true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Username editing state
  const [usernameInput, setUsernameInput] = useState(user.username || '')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null)

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
      profile_is_public: currentUser.profile_is_public ?? true,
    })
    setMessage(null)
  }

  // Handle username input change with debounced validation
  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsernameInput(lowercaseValue)
    setUsernameError(null)

    // Clear existing timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current)
    }

    // If same as current username, mark as idle
    if (lowercaseValue === currentUser.username) {
      setUsernameStatus('idle')
      return
    }

    // If empty or too short, mark as invalid
    if (lowercaseValue.length < 3) {
      setUsernameStatus('invalid')
      setUsernameError('Username must be at least 3 characters')
      return
    }

    // Set checking state and debounce the API call
    setUsernameStatus('checking')
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check?username=${encodeURIComponent(lowercaseValue)}`)
        const data = await response.json()

        if (data.available) {
          setUsernameStatus('available')
          setUsernameError(null)
        } else {
          setUsernameStatus(data.error?.includes('taken') ? 'taken' : 'invalid')
          setUsernameError(data.error || 'Username is not available')
        }
      } catch (error) {
        setUsernameStatus('invalid')
        setUsernameError('Failed to check username')
      }
    }, 400)
  }

  // Save username
  const handleSaveUsername = async () => {
    if (usernameStatus !== 'available' || usernameInput === currentUser.username) {
      return
    }

    setIsSavingUsername(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          username: usernameInput,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update username')
      }

      setCurrentUser(result.data)
      setFormData(prev => ({ ...prev, username: usernameInput }))
      setUsernameStatus('idle')
      setMessage({ type: 'success', text: 'Username updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update username' })
    } finally {
      setIsSavingUsername(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current)
      }
    }
  }, [])

  return (
    <div className="space-y-3">
      {/* Toast Notification */}
      <Toast
        show={!!message}
        message={message?.text || ''}
        variant={message?.type === 'success' ? 'success' : 'error'}
      />

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
                <DefaultAvatar size={80} />
              )}
            </div>
            {uploadingPicture && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Spinner size="md" className="text-white" />
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
                {uploadingPicture ? 'Uploading…' : 'Upload New Photo'}
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

      {/* Change Username Section */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Change Username</h3>
          <p className="text-sm text-muted-foreground">Choose a new username for your profile.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center h-icon-button border border-border rounded-lg overflow-hidden">
              <span className="px-3 text-sm text-muted-foreground bg-transparent border-r border-border">
                snack.xyz/
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="flex-1 px-3 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground"
                placeholder="username"
                spellCheck={false}
                autoComplete="off"
              />
              <div className="px-3 flex items-center">
                {usernameStatus === 'checking' && (
                  <Spinner size="sm" className="text-muted-foreground" />
                )}
                {usernameStatus === 'available' && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleSaveUsername}
            disabled={usernameStatus !== 'available' || isSavingUsername}
          >
            {isSavingUsername ? 'Saving…' : 'Save'}
          </Button>
        </div>

        {usernameError && (
          <p className="text-sm text-red-500 mt-2">{usernameError}</p>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-muted-foreground"
            onClick={async () => {
              await navigator.clipboard.writeText(`https://snack.xyz/${currentUser.username}`)
              setMessage({ type: 'success', text: 'Profile URL copied!' })
              setTimeout(() => setMessage(null), 2000)
            }}
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            Copy URL
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-muted-foreground"
            asChild
          >
            <Link href={`/${currentUser.username}`} target="_blank">
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              View Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <PersonalInfoForm
        formData={formData}
        setFormData={setFormData}
        currentUser={currentUser}
        isSaving={isSaving}
        onSave={handleSaveProfile}
        onDiscard={handleCancel}
      />

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
                <Spinner size="xs" />
                Signing out…
              </>
            ) : (
              <>
                <ArrowRightStartOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
                Log Out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PersonalInfoFormProps {
  formData: {
    first_name: string
    last_name: string
    username: string
    email: string
    profile_is_public: boolean
  }
  setFormData: React.Dispatch<React.SetStateAction<PersonalInfoFormProps['formData']>>
  currentUser: any
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

function PersonalInfoForm({
  formData,
  setFormData,
  currentUser,
  isSaving,
  onSave,
  onDiscard,
}: PersonalInfoFormProps) {
  // Check if form has changes compared to current user data
  const hasChanges =
    formData.first_name !== (currentUser.first_name || '') ||
    formData.last_name !== (currentUser.last_name || '') ||
    formData.email !== (currentUser.email || '')

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <div className="mb-6">
        <h3 className="font-semibold mb-1">Personal Information</h3>
        <p className="text-sm text-muted-foreground">Update your personal details here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium mb-2 text-muted-foreground">First Name</label>
          <input
            id="first_name"
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full h-icon-button px-3 bg-transparent text-foreground text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors placeholder:text-muted-foreground"
            placeholder="Enter your first name…"
            disabled={isSaving}
            autoComplete="given-name"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium mb-2 text-muted-foreground">Last Name</label>
          <input
            id="last_name"
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full h-icon-button px-3 bg-transparent text-foreground text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors placeholder:text-muted-foreground"
            placeholder="Enter your last name…"
            disabled={isSaving}
            autoComplete="family-name"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-muted-foreground">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-icon-button px-3 bg-transparent text-foreground text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors placeholder:text-muted-foreground"
            placeholder="Enter your email…"
            disabled={isSaving}
            required
            autoComplete="email"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        {hasChanges && (
          <Button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            variant="ghost"
          >
            Discard
          </Button>
        )}
        <Button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          variant="outline"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
