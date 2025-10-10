'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Settings, User, Bookmark, BarChart3 } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { User as UserType } from '@/types'

interface AppHeaderProps {
  user?: UserType | null
  children?: React.ReactNode
}

export function AppHeader({ user, children }: AppHeaderProps) {
  // Logo link destination based on auth status
  const logoLink = user ? '/dashboard' : '/'

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={logoLink} className="flex items-center">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </Link>

          {/* Right side content - passed as children or default icons */}
          {children || (
            user && (
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Settings Icon */}
                <Link
                  href="/profile"
                  className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
                >
                  <Settings className="w-5 h-5" />
                </Link>

                {/* Profile Icon */}
                <Link
                  href={`/${user.username}`}
                  className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
                >
                  <User className="w-5 h-5" />
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// Specialized header components for specific pages
export function DashboardHeader({
  activeTab,
  username,
}: {
  activeTab: 'saved' | 'stats'
  username?: string
}) {
  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </Link>

          {/* Right side - Tabs and Icons */}
          <div className="flex items-center gap-3">
            {/* Saved Tab */}
            <Link
              href="/dashboard?tab=saved"
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 border rounded-sm ${
                activeTab === 'saved'
                  ? 'text-foreground bg-secondary border-border'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
              }`}
            >
              Saved
              <Bookmark className="w-3.5 h-3.5" />
            </Link>

            {/* Stats Tab */}
            <Link
              href="/dashboard?tab=stats"
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 border rounded-sm ${
                activeTab === 'stats'
                  ? 'text-foreground bg-secondary border-border'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
              }`}
            >
              Stats
              <BarChart3 className="w-3.5 h-3.5" />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Icon */}
            <Link
              href="/profile"
              className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Profile Icon */}
            <Link
              href={`/${username}`}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
