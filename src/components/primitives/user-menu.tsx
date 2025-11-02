'use client'

import { User as UserIcon, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

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
 * Shows user profile button with dropdown menu
 * Handles logout action and profile navigation
 */
export function UserMenu({ user, onLogout, username, className }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) {
    return null
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="muted"
        size="icon"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <UserIcon className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              {username || user.username || user.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {user.email || 'No email'}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>

            {onLogout && (
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
