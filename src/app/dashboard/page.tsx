'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Bookmark, Eye, Link as LinkIcon, Users, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLists } from '@/hooks/useLists'
import { ListWithLinks } from '@/types'

type DashboardTab = 'my-lists' | 'saved-lists' | 'analytics'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, signOut, refreshSession } = useAuth()
  const { lists, loading: listsLoading, createEmptyList, deleteList, error: listsError } = useLists()
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-lists')
  const [mounted, setMounted] = useState(false)
  const [creatingList, setCreatingList] = useState(false)

  // Handle creating a new list
  const handleCreateList = async () => {
    setCreatingList(true)
    try {
      const newList = await createEmptyList()
      // Navigate to the new list using the username and public_id
      if (user?.username) {
        router.push(`/${user.username}/${newList.public_id || newList.id}`)
      } else {
        router.push(`/list/${newList.public_id || newList.id}`)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    } finally {
      setCreatingList(false)
    }
  }

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug auth state only on client
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      console.log('Dashboard: useAuth returned:', { 
        user: user ? { id: user.id, email: user.email } : null, 
        loading, 
        userExists: !!user,
        localStorageRaw: localStorage.getItem('mock-auth-user')
      })
    }
  }, [user, loading, mounted])

  // Show loading state while mounting or checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
          <p className="text-xs text-muted-foreground">
            Checking authentication...
          </p>
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
          <p className="text-muted-foreground">You need to be signed in to view your dashboard.</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/auth/sign-in')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              style={{ fontFamily: 'Open Runde' }}
            >
              Sign In
            </button>
            <button
              onClick={refreshSession}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold ml-2"
              style={{ fontFamily: 'Open Runde' }}
            >
              Refresh Session
            </button>
            <div className="text-xs text-muted-foreground mt-2">
              Debug: Loading={loading ? 'true' : 'false'}, User={user ? 'exists' : 'null'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Same as demo page */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/${user?.username || user?.id}`}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                style={{ fontFamily: 'Open Runde' }}
              >
                Profile
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                style={{ fontFamily: 'Open Runde' }}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                style={{ fontFamily: 'Open Runde' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Title */}
      <div className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-[624px] mx-auto">
            <div className="flex items-center justify-between">
              <h1 
                className="text-3xl font-bold text-foreground"
                style={{ fontFamily: 'Open Runde' }}
              >
                Your Snacks
              </h1>
              <button
                onClick={handleCreateList}
                disabled={creatingList}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Open Runde' }}
              >
                {creatingList ? 'Creating...' : 'Create list +'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Clean Tabs with pill background */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center bg-neutral-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('my-lists')}
              className={`px-6 py-2 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'my-lists' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              Created
            </button>
            <button
              onClick={() => setActiveTab('saved-lists')}
              className={`px-6 py-2 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'saved-lists' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              Saved
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 font-semibold text-sm transition-colors rounded-full ${
                activeTab === 'analytics' 
                  ? 'text-foreground bg-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'Open Runde' }}
            >
              Stats
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-lists' && (
          <MyListsTab 
            lists={lists} 
            onCreateList={handleCreateList}
            onDeleteList={deleteList}
            creatingList={creatingList}
          />
        )}
        
        {activeTab === 'saved-lists' && (
          <SavedListsTab lists={[]} />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}
      </div>
    </div>
  )
}

function MyListsTab({ 
  lists, 
  onCreateList, 
  onDeleteList,
  creatingList 
}: { 
  lists: ListWithLinks[]
  onCreateList: () => void
  onDeleteList: (listId: string) => Promise<boolean>
  creatingList: boolean
}) {
  return (
    <div>
      {lists.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-neutral-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
            🥨
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Open Runde' }}>
            No snacks yet
          </h3>
          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            Create your first list to start curating amazing content and sharing it with the world.
          </p>
          <button
            onClick={onCreateList}
            disabled={creatingList}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{ fontFamily: 'Open Runde' }}
          >
            {creatingList ? 'Creating...' : 'Create Your First Snack'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showActions onDelete={onDeleteList} />
          ))}
        </div>
      )}
    </div>
  )
}

function SavedListsTab({ lists }: { lists: ListWithLinks[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl font-bold"
          style={{ fontFamily: 'Open Runde' }}
        >
          Saved Lists
        </h2>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            🔖
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Open Runde' }}>
            No saved lists yet
          </h3>
          <p className="text-muted-foreground">
            Save interesting lists from other creators to access them later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showActions={false} />
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div>
      <h2 
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'Open Runde' }}
      >
        Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Views"
          value="2,847"
          change="+12.5%"
          trend="up"
        />
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="Link Clicks"
          value="1,203"
          change="+8.2%"
          trend="up"
        />
        <StatCard
          icon={<Bookmark className="w-5 h-5" />}
          label="Saves"
          value="156"
          change="+24.1%"
          trend="up"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Followers"
          value="89"
          change="+5.3%"
          trend="up"
        />
      </div>

      <div className="bg-neutral-50 rounded-xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Open Runde' }}>
          Detailed Analytics Coming Soon
        </h3>
        <p className="text-muted-foreground">
          We're building comprehensive analytics to help you understand your audience and optimize your content.
        </p>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
}

function StatCard({ icon, label, value, change, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-neutral-100 rounded-lg text-muted-foreground">
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'Open Runde' }}>
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold" style={{ fontFamily: 'Open Runde' }}>
          {value}
        </span>
        <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
    </div>
  )
}

interface ListCardProps {
  list: ListWithLinks
  showActions?: boolean
  onDelete?: (listId: string) => Promise<boolean>
}

function ListCard({ list, showActions = true, onDelete }: ListCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Stop event bubbling
    
    if (!onDelete || !confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      await onDelete(list.id)
    } catch (error) {
      console.error('Error deleting list:', error)
      alert('Failed to delete list. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation from Link
    e.stopPropagation() // Stop event bubbling
    router.push(`/${list.user?.username || 'list'}/${list.id}?view=public`)
  }

  return (
    <div className="relative bg-white rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 group border border-gray-100">
      {/* Action Buttons */}
      {showActions && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
          {/* View Button */}
          <button
            onClick={handleView}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
            title="View public list"
          >
            <Eye className="w-4 h-4" />
          </button>
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Delete list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Clickable area for navigation */}
      <Link 
        href={`/${list.user?.username || 'list'}/${list.public_id || list.id}`}
        className="block cursor-pointer"
      >
        {/* Large Emoji */}
        <div className="flex items-center justify-center mb-6 pt-4">
          <div className="w-32 h-32 flex items-center justify-center">
            {list.emoji_3d?.url ? (
              <Image
                src={list.emoji_3d.url}
                alt={list.emoji_3d.name || 'emoji'}
                width={120}
                height={120}
                className="w-28 h-28 object-contain group-hover:scale-105 transition-transform duration-200"
                unoptimized
                onError={(e) => {
                  // Hide the failed image and show fallback emoji
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = 'block'
                  }
                }}
              />
            ) : null}
            <span 
              className="text-7xl"
              style={{ display: list.emoji_3d?.url ? 'none' : 'block' }}
            >
              {list.emoji || '🥨'}
            </span>
          </div>
        </div>

        {/* List Info */}
        <div className="text-center pb-2">
          <h3 
            className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors"
            style={{ fontFamily: 'Open Runde' }}
          >
            {list.title}
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>{list.links?.length || 0} links</span>
            <span>•</span>
            <span>72K views</span>
          </div>
        </div>
      </Link>
    </div>
  )
}