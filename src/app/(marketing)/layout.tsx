'use client'

import Link from 'next/link'
import { User } from 'lucide-react'

import { TopBar, BrandMark } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

/**
 * Marketing Layout
 *
 * Used for public-facing pages: home, auth pages
 * Features larger branding and auth CTAs
 */
function MarketingLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <TopBar variant="marketing">
        <TopBar.Left>
          <BrandMark variant="marketing" href="/" />
        </TopBar.Left>

        <TopBar.Right>
          {user ? (
            <>
              <Button asChild variant="muted">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {user.username && (
                <Button asChild variant="muted" size="icon">
                  <Link href={`/${user.username}`}>
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Button asChild>
              <Link href="/auth/sign-in">Get Started</Link>
            </Button>
          )}
          <ThemeToggle />
        </TopBar.Right>
      </TopBar>

      <main id="main-content">
        {children}
      </main>
    </>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MarketingLayoutContent>{children}</MarketingLayoutContent>
  )
}
