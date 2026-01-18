'use client'

import Link from 'next/link'
import { StarIcon, ChartBarIcon, ListBulletIcon } from '@heroicons/react/24/solid'
import { useEffect, Suspense, useState } from 'react'

import { Button } from '@/components/ui'
import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { LoadingState } from '@/components/loading-state'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/**
 * App Layout
 *
 * Used for authenticated app pages: dashboard, profile, lists
 * Requires authentication and shows user menu
 */
function AppLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const activeTab = searchParams?.get('tab')
  const isOnDashboard = pathname === '/dashboard'

  // Ensure component is mounted on client before rendering tab-specific UI
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading state while checking auth or before client mount (prevents hydration mismatch)
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Redirecting..." />
      </div>
    )
  }

  return (
    <div>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <TopBar variant="app">
        <TopBar.Left>
          <BrandMark variant="app" href="/dashboard" />
          <Button asChild variant="outline" className="ml-2">
            <Link href="/discover">
              Discover
            </Link>
          </Button>
        </TopBar.Left>

        <TopBar.Right>
          <Button
            asChild
            variant={isOnDashboard && !activeTab ? 'secondary' : 'muted'}
            size="icon"
            className={isOnDashboard && !activeTab ? 'text-foreground' : undefined}
            aria-label="Your lists"
          >
            <Link href="/dashboard">
              <ListBulletIcon className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant={isOnDashboard && activeTab === 'saved' ? 'secondary' : 'muted'}
            size="icon"
            className={isOnDashboard && activeTab === 'saved' ? 'text-foreground' : undefined}
            aria-label="Saved lists"
          >
            <Link href="/dashboard?tab=saved">
              <StarIcon className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant={isOnDashboard && activeTab === 'stats' ? 'secondary' : 'muted'}
            size="icon"
            className={isOnDashboard && activeTab === 'stats' ? 'text-foreground' : undefined}
            aria-label="Stats"
          >
            <Link href="/dashboard?tab=stats">
              <ChartBarIcon className="w-4 h-4" />
            </Link>
          </Button>
          <UserMenu
            user={user}
            onLogout={handleLogout}
          />
        </TopBar.Right>
      </TopBar>

      <main id="main-content">
        {children}
      </main>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    }>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}
