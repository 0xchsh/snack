'use client'

import Link from 'next/link'
import { Star, BarChart3 } from 'lucide-react'
import { useEffect, Suspense } from 'react'

import { Button } from '@/components/ui'
import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoadingState } from '@/components/loading-state'
import { useAuth } from '@/hooks/useAuth'
import { ListsProvider } from '@/hooks/useLists'
import { useRouter, useSearchParams } from 'next/navigation'

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
  const searchParams = useSearchParams()
  const activeTab = searchParams?.get('tab')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading state while checking auth
  if (loading) {
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
        </TopBar.Left>

        <TopBar.Right>
          <Button
            asChild
            variant={activeTab === 'saved' ? 'secondary' : 'muted'}
            size="icon"
            className={activeTab === 'saved' ? 'text-foreground' : undefined}
            aria-label="Saved lists"
          >
            <Link href="/dashboard?tab=saved">
              <Star className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant={activeTab === 'stats' ? 'secondary' : 'muted'}
            size="icon"
            className={activeTab === 'stats' ? 'text-foreground' : undefined}
            aria-label="Stats"
          >
            <Link href="/dashboard?tab=stats">
              <BarChart3 className="w-4 h-4" />
            </Link>
          </Button>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            username={user.username}
          />
          <ThemeToggle />
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
    <ListsProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingState message="Loading..." />
        </div>
      }>
        <AppLayoutContent>{children}</AppLayoutContent>
      </Suspense>
    </ListsProvider>
  )
}
