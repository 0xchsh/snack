'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Settings, User, Bookmark, BarChart3 } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { NAV_CONSTANTS } from '@/lib/navigation-constants'

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
      <div className={`container mx-auto ${NAV_CONSTANTS.CONTAINER_PADDING_X} ${NAV_CONSTANTS.CONTAINER_PADDING_Y}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={NAV_CONSTANTS.LOGO_WIDTH}
              height={NAV_CONSTANTS.LOGO_HEIGHT}
              className={NAV_CONSTANTS.LOGO_SIZE}
            />
          </Link>

          {/* Right side - Tabs and Icons */}
          <div className={`flex items-center ${NAV_CONSTANTS.BUTTON_GAP}`}>
            {/* Saved Tab */}
            <Link
              href="/dashboard?tab=saved"
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 border ${NAV_CONSTANTS.BORDER_RADIUS} ${
                activeTab === 'saved'
                  ? 'text-foreground bg-secondary border-border'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
              }`}
            >
              Saved
              <Bookmark className={NAV_CONSTANTS.TAB_ICON_SIZE} />
            </Link>

            {/* Stats Tab */}
            <Link
              href="/dashboard?tab=stats"
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 border ${NAV_CONSTANTS.BORDER_RADIUS} ${
                activeTab === 'stats'
                  ? 'text-foreground bg-secondary border-border'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
              }`}
            >
              Stats
              <BarChart3 className={NAV_CONSTANTS.TAB_ICON_SIZE} />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Icon */}
            <Link
              href="/profile"
              className={`inline-flex items-center justify-center ${NAV_CONSTANTS.ICON_BUTTON_SIZE} text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${NAV_CONSTANTS.BORDER_RADIUS}`}
            >
              <Settings className={NAV_CONSTANTS.ICON_SIZE} />
            </Link>

            {/* Profile Icon */}
            <Link
              href={`/${username}`}
              className={`inline-flex items-center justify-center ${NAV_CONSTANTS.ICON_BUTTON_SIZE} text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ${NAV_CONSTANTS.BORDER_RADIUS}`}
            >
              <User className={NAV_CONSTANTS.ICON_SIZE} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
