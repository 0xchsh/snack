'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { User, CreditCard, Shield, Camera, Mail, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type ProfileTab = 'account' | 'billing' | 'security'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('account')
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state while mounting or checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You need to be signed in to view your profile.</p>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            style={{ fontFamily: 'Open Runde' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <h1 
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Open Runde' }}
                >
                  Snack
                </h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontFamily: 'Open Runde' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                {user?.profile_picture_url ? (
                  <Image
                    src={user.profile_picture_url}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h1 
                className="text-3xl font-bold text-foreground mb-1"
                style={{ fontFamily: 'Open Runde' }}
              >
                {user.first_name || user.last_name 
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user.username}
              </h1>
              <p className="text-muted-foreground text-lg">@{user.username}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center bg-neutral-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'account' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              <User className="w-4 h-4" />
              Account
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'billing' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'security' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'account' && <AccountTab user={user} />}
        {activeTab === 'billing' && <BillingTab user={user} />}
        {activeTab === 'security' && <SecurityTab user={user} />}
      </div>
    </div>
  )
}

function AccountTab({ user }: { user: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [currentUser, setCurrentUser] = useState(user)
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    email: user.email || '',
  })

  // Reset form when user data changes
  useEffect(() => {
    setCurrentUser(user)
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
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
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Open Runde' }}
        >
          Account Settings
        </h2>
        <p className="text-muted-foreground">
          Update your account information and profile settings.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-1" style={{ fontFamily: 'Open Runde' }}>Profile Picture</h3>
            <p className="text-sm text-muted-foreground mb-3">JPG, PNG, or GIF (max 2MB)</p>
            <div className="flex gap-3">
              <label className="px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50">
                {uploadingPicture ? 'Uploading...' : 'Upload New Photo'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingPicture}
                />
              </label>
              {currentUser.profile_picture_url && (
                <button
                  onClick={handleRemovePicture}
                  disabled={uploadingPicture}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold mb-1" style={{ fontFamily: 'Open Runde' }}>Personal Information</h3>
            <p className="text-sm text-muted-foreground">Update your personal details here.</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your first name"
                disabled={isSaving}
              />
            ) : (
              <div className="px-4 py-3 bg-neutral-50 rounded-lg text-foreground">
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your last name"
                disabled={isSaving}
              />
            ) : (
              <div className="px-4 py-3 bg-neutral-50 rounded-lg text-foreground">
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your username"
                disabled={isSaving}
                required
              />
            ) : (
              <div className="px-4 py-3 bg-neutral-50 rounded-lg text-foreground">
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Enter your email"
                disabled={isSaving}
                required
              />
            ) : (
              <div className="px-4 py-3 bg-neutral-50 rounded-lg text-foreground">
                {currentUser.email}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2 text-muted-foreground border border-border rounded-lg hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BillingTab({ user }: { user: any }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Open Runde' }}
        >
          Billing & Subscription
        </h2>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'Open Runde' }}>Current Plan</h3>
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
          <div>
            <div className="font-semibold text-lg">Free Plan</div>
            <div className="text-muted-foreground text-sm">Up to 5 lists, basic features</div>
          </div>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontFamily: 'Open Runde' }}>Payment Methods</h3>
          <button className="px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
            Add Payment Method
          </button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No payment methods added yet.
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'Open Runde' }}>Billing History</h3>
        <div className="text-center py-8 text-muted-foreground">
          No billing history available.
        </div>
      </div>
    </div>
  )
}

function SecurityTab({ user }: { user: any }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Open Runde' }}
        >
          Security Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account security and privacy settings.
        </p>
      </div>

      {/* Account Deletion */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2" style={{ fontFamily: 'Open Runde' }}>
              Delete Account
            </h3>
            <p className="text-red-700 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}