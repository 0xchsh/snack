'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Settings, User } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

interface DashboardHeaderProps {
  activeTab: 'saved' | 'stats'
  savedCount?: number
  statsCount?: number
  onLogout?: () => void
  username?: string
}

export function DashboardHeader({
  activeTab,
  savedCount = 0,
  statsCount = 0,
  username
}: DashboardHeaderProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
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
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'saved'
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved
              {savedCount > 0 && (
                <span className="text-xs text-muted-foreground">📑</span>
              )}
            </Link>

            {/* Stats Tab */}
            <Link
              href="/dashboard?tab=stats"
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Stats
              {statsCount > 0 && (
                <span className="text-xs text-muted-foreground">📊</span>
              )}
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Icon */}
            <Link
              href="/profile"
              className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Profile Icon */}
            <Link
              href={`/${username}`}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
