'use client'

import Link from 'next/link'
import { Star, ChartBar, ListBullets } from '@phosphor-icons/react'
import { useEffect, Suspense, useState } from 'react'
import { Skeleton } from 'boneyard-js/react'

import { Button } from '@/components/ui'
import { TopBar, BrandMark, UserMenu } from '@/components/primitives'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

function AppLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border" />
      <div className="max-w-[560px] mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}

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

  const isLoading = loading || !mounted

  if (isLoading || !user) {
    return <AppLayoutSkeleton />
  }

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
            variant={isOnDashboard && !activeTab ? 'secondary' : 'muted'}
            size="icon"
            className={isOnDashboard && !activeTab ? 'text-foreground' : undefined}
            aria-label="Your lists"
          >
            <Link href="/dashboard">
              <ListBullets weight="bold" className="size-4" />
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
              <Star weight="bold" className="size-4" />
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
              <ChartBar weight="bold" className="size-4" />
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
    <Suspense fallback={<AppLayoutSkeleton />}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}
