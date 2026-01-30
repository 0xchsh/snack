'use client'

import Link from 'next/link'
import Image from 'next/image'
import { StarIcon, ChartBarIcon, ListBulletIcon } from '@heroicons/react/24/solid'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui'
import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { useAuth } from '@/hooks/useAuth'

function MarketingLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const isHomepage = pathname === '/'

  const handleLogout = async () => {
    await signOut()
  }

  // When logged in and not on homepage, show app-style nav
  if (user && !isHomepage) {
    return (
      <div>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to content
        </a>

        <TopBar>
          <TopBar.Left>
            <BrandMark variant="app" href="/dashboard" />
          </TopBar.Left>

          <TopBar.Right>
            <Button
              asChild
              variant="muted"
              size="icon"
              aria-label="Your lists"
            >
              <Link href="/dashboard">
                <ListBulletIcon className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="muted"
              size="icon"
              aria-label="Saved lists"
            >
              <Link href="/dashboard?tab=saved">
                <StarIcon className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="muted"
              size="icon"
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

  return (
    <div className={isHomepage ? 'light' : ''} style={isHomepage ? { colorScheme: 'light' } : undefined}>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <header style={isHomepage ? { backgroundColor: '#ffffff' } : undefined} className={isHomepage ? '' : 'bg-background'}>
        <div className="w-full px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="Snack"
                width={32}
                height={32}
                className={isHomepage ? '' : 'dark:invert'}
                style={isHomepage ? { filter: 'none' } : undefined}
              />
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isHomepage ? (
                <Button asChild variant="primary">
                  <Link href="/auth/sign-in">Get Started</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary">
                    <Link href="/auth/sign-in">Get Started</Link>
                  </Button>
                  <ThemeToggle />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        {children}
      </main>
    </div>
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
