'use client'

import Link from 'next/link'
import { Bookmark, BarChart3 } from 'lucide-react'
import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

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
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <>
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
          <Link
            href="/dashboard?tab=saved"
            className={`w-icon-button h-icon-button rounded-md inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeTab === 'saved'
                ? 'bg-secondary text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/90'
            }`}
            aria-label="Saved lists"
          >
            <Bookmark className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard?tab=stats"
            className={`w-icon-button h-icon-button rounded-md inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeTab === 'stats'
                ? 'bg-secondary text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/90'
            }`}
            aria-label="Stats"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            username={user.user_metadata?.username}
          />
          <ThemeToggle />
        </TopBar.Right>
      </TopBar>

      <main id="main-content">
        {children}
      </main>
    </>
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
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}
