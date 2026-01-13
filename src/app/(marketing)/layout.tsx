'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserIcon } from '@heroicons/react/24/solid'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

function MarketingLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const pathname = usePathname()
  const isHomepage = pathname === '/'

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
        <div className="mx-auto w-full px-4 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="Snack"
                width={40}
                height={40}
                className={isHomepage ? '' : 'dark:invert'}
                style={isHomepage ? { filter: 'none' } : undefined}
              />
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button asChild variant={isHomepage ? undefined : 'muted'} className={isHomepage ? 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100' : undefined}>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  {user.username && (
                    <Button asChild variant={isHomepage ? undefined : 'muted'} size="icon" className={isHomepage ? 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100' : undefined}>
                      <Link href={`/${user.username}`}>
                        <UserIcon className="w-5 h-5" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <Button asChild className={isHomepage ? 'bg-neutral-900 text-white hover:bg-neutral-800' : undefined}>
                  <Link href="/auth/sign-in">Get Started</Link>
                </Button>
              )}
              {!isHomepage && <ThemeToggle />}
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
