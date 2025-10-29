'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { List, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLists } from '@/hooks/useLists'
import { AppContainer } from '@/components/primitives'
import { Breadcrumb } from '@/components/breadcrumb'
import { ListWithLinks } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab') || 'your-lists'

  const { user, loading } = useAuth()
  const { lists, loading: listsLoading, createEmptyList } = useLists()
  const [mounted, setMounted] = useState(false)
  const [creatingList, setCreatingList] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number
    totalClicks: number
    listStats: Record<string, { views: number; clicks: number }>
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch analytics data when on stats tab
  useEffect(() => {
    if (tab === 'stats' && user) {
      fetch('/api/analytics/stats')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAnalyticsData(data.data)
          }
        })
        .catch(error => {
          console.error('Error fetching analytics:', error)
        })
    }
  }, [tab, user])

  const handleCreateList = async () => {
    setCreatingList(true)
    try {
      const newList = await createEmptyList()
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/sign-in')
    return null
  }

  const totalLinks = lists.reduce((acc, list) => acc + (list.links?.length || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <AppContainer variant="app">
        <div className="py-8">
        {tab === 'your-lists' || !tab ? (
          <div className="max-w-[560px] w-full mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Your Lists"
              />
            </div>

            {/* Header with count and create button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-2 rounded-md">
                <List className="w-4 h-4" />
                <span className="text-base">{lists.length} lists</span>
              </div>
              <button
                onClick={handleCreateList}
                disabled={creatingList}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground hover:bg-accent transition-colors disabled:opacity-50 rounded-md"
              >
                <span className="text-sm font-[400]">Create list</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="space-y-3">
              {lists.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-secondary flex items-center justify-center text-2xl mx-auto mb-4">
                    🥨
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first list to start curating content
                  </p>
                  <button
                    onClick={handleCreateList}
                    disabled={creatingList}
                    className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {creatingList ? 'Creating...' : 'Create Your First List'}
                  </button>
                </div>
              ) : (
                lists.map((list) => (
                  <div key={list.id}>
                    <Link
                      href={`/${user.username}/${list.public_id || list.id}`}
                      className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-transform transform hover:scale-[0.99] active:scale-[0.97] rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{list.emoji || '📋'}</span>
                        <span className="text-base text-foreground group-hover:text-primary transition-colors">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {list.links?.length || 0} links
                      </span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : tab === 'saved' ? (
          <div className="max-w-[560px] w-full mx-auto">
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Saved Lists"
              />
            </div>
            <div className="text-center py-16">
              <p className="text-muted-foreground">See your saved lists here</p>
              <p className="text-muted-foreground mt-2">Click on the bookmark icon on any list to see it here.</p>
            </div>
          </div>
        ) : tab === 'stats' ? (
          <div className="max-w-[560px] w-full mx-auto">
            <div className="mb-6">
              <Breadcrumb
                username={user.username || 'User'}
                currentPage="Your Stats"
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center border border-border rounded-md py-4">
                <div className="text-2xl font-bold text-foreground">{lists.length}</div>
                <div className="text-sm text-muted-foreground">lists</div>
              </div>
              <div className="text-center border border-border rounded-md py-4">
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? analyticsData.totalClicks.toLocaleString() : '0'}
                </div>
                <div className="text-sm text-muted-foreground">clicks</div>
              </div>
              <div className="text-center border border-border rounded-md py-4">
                <div className="text-2xl font-bold text-foreground">
                  {analyticsData ? analyticsData.totalViews.toLocaleString() : '0'}
                </div>
                <div className="text-sm text-muted-foreground">views</div>
              </div>
            </div>

            {/* Per-list stats */}
            <div className="space-y-3">
              {lists.map((list) => {
                const listId = list.public_id || list.id
                const stats = analyticsData?.listStats[listId] || { views: 0, clicks: 0 }

                return (
                  <div key={list.id}>
                    <div className="flex items-center justify-between px-3 py-3 bg-background border border-border hover:bg-accent/50 transition-transform transform hover:scale-[0.99] active:scale-[0.97] rounded-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base">{list.emoji || '📋'}</span>
                        <span className="text-base text-foreground truncate">
                          {list.title || 'Untitled List'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                        <span>🔗 {list.links?.length || 0}</span>
                        <span>👁️ {stats.views.toLocaleString()}</span>
                        <span>👥 {stats.clicks.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
        </div>
      </AppContainer>
    </div>
  )
}
