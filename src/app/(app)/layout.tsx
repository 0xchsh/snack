'use client'

import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * App Layout
 *
 * Used for authenticated app pages: dashboard, profile, lists
 * Requires authentication and shows user menu
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm"
      >
        Skip to content
      </a>

      <TopBar variant="app">
        <TopBar.Left>
          <BrandMark variant="app" href="/dashboard" />
        </TopBar.Left>

        <TopBar.Right>
          <ThemeToggle />
          <button
            className="w-icon-button h-icon-button rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors inline-flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            username={user.user_metadata?.username}
          />
        </TopBar.Right>
      </TopBar>

      <main id="main-content">
        {children}
      </main>
    </>
  )
}
