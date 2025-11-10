'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface UserMenuProps {
  user: User | null
  onLogout?: () => void
  username?: string
  className?: string
}

/**
 * UserMenu - Client island component for user authentication menu
 *
 * Shows settings button that links to profile page
 */
export function UserMenu({ user, className }: UserMenuProps) {
  if (!user) {
    return null
  }

  return (
    <Link href="/profile" className={cn(className)}>
      <Button
        type="button"
        variant="muted"
        size="icon"
        aria-label="Profile settings"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </Link>
  )
}
