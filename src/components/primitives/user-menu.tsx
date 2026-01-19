'use client'

import * as React from 'react'
import { UserCircleIcon, Cog6ToothIcon, SunIcon, MoonIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import type { User } from '@/types'

interface UserMenuProps {
  user: User | null
  onLogout?: () => void
  username?: string
  className?: string
}

/**
 * UserMenu - Account dropdown with settings, theme toggle, and logout
 */
export function UserMenu({ user, onLogout, className }: UserMenuProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="muted"
          size="icon"
          aria-label="Account menu"
          className={className}
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserCircleIcon className="w-4 h-4 text-muted-foreground" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} disabled={!mounted}>
          {mounted && theme === 'light' ? (
            <MoonIcon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <SunIcon className="w-4 h-4 text-muted-foreground" />
          )}
          <span>{mounted ? (theme === 'light' ? 'Dark mode' : 'Light mode') : 'Toggle theme'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive hover:text-destructive"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
