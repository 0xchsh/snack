'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, CreditCard, Edit, Eye, EyeOff, ExternalLink, Mail, Shield, Trash2, User } from 'lucide-react'

import { Button } from '@/components/ui'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center bg-muted rounded-full p-1">
            <Button
              type="button"
              onClick={() => setActiveTab('account')}
              variant={activeTab === 'account' ? 'secondary' : 'ghost'}
              size="sm"
              className={`gap-2 px-6 py-3 rounded-full font-semibold text-sm ${
                activeTab === 'account'
                  ? 'text-foreground bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab('billing')}
              variant={activeTab === 'billing' ? 'secondary' : 'ghost'}
              size="sm"
              className={`gap-2 px-6 py-3 rounded-full font-semibold text-sm ${
                activeTab === 'billing'
                  ? 'text-foreground bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <Eye className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab('security')}
              variant={activeTab === 'security' ? 'secondary' : 'ghost'}
              size="sm"
              className={`gap-2 px-6 py-3 rounded-full font-semibold text-sm ${
                activeTab === 'security'
                  ? 'text-foreground bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </Button>
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 
          className="text-2xl font-bold mb-2"
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
                className="text-primary border-primary hover:bg-primary/5"
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
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
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
            variant="outline"
            size="sm"
            className="gap-2 border-primary text-primary hover:bg-primary/5"
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
              variant="outline"
              className="px-6 text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

type AnalyticsSummary = {
  totalViews: number
  totalClicks: number
  totalSaves: number
  topLists: Array<{
    id: string
    public_id: string | null
    title: string | null
    emoji: string | null
    view_count: number
    click_count: number
    save_count: number
  }>
}

function BillingTab({ user }: { user: any }) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/stats')
        if (response.ok) {
          const data = await response.json() as AnalyticsSummary
          setAnalytics({
            totalViews: data.totalViews ?? 0,
            totalClicks: data.totalClicks ?? 0,
            totalSaves: data.totalSaves ?? 0,
            topLists: Array.isArray(data.topLists) ? data.topLists : [],
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 
          className="text-2xl font-bold mb-2"
        >
          Analytics & Insights
        </h2>
        <p className="text-muted-foreground">
          Track your list performance and engagement metrics.
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-muted-foreground">Total Views</h3>
            <Eye className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              analytics?.totalViews.toLocaleString() || '0'
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-muted-foreground">Link Clicks</h3>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              analytics?.totalClicks.toLocaleString() || '0'
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-muted-foreground">Total Saves</h3>
            <Bookmark className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            ) : (
              analytics?.totalSaves.toLocaleString() || '0'
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Most Popular Lists */}
      <div className="bg-background border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-6">
          Your Top 5 Most Popular Lists
        </h3>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent rounded"></div>
                  <div className="h-4 w-32 bg-accent rounded"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-accent rounded"></div>
                  <div className="h-4 w-16 bg-accent rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : analytics?.topLists && analytics.topLists.length > 0 ? (
          <div className="space-y-3">
            {analytics.topLists.map((list, index) => (
              <div key={list.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{list.emoji}</span>
                    <Link 
                      href={`/${user?.username}/${list.public_id || list.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {list.title}
                    </Link>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{list.view_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    <span>{list.click_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bookmark className="w-4 h-4" />
                    <span>{list.save_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No list data available yet. Share your lists to start tracking analytics!
          </div>
        )}
      </div>

      {/* Current Plan */}
      <div className="bg-background border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Current Plan</h3>
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <div className="font-semibold text-lg">Free Plan</div>
            <div className="text-muted-foreground text-sm">Unlimited lists with analytics tracking</div>
          </div>
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
        >
          Security Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account security and privacy settings.
        </p>
      </div>

      {/* Account Deletion */}
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Delete Account
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="px-6 py-2"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
