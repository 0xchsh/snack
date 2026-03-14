'use client'

import * as React from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { Button } from '@/components/ui'

import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Wait until mounted to render the correct icon
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Prevent hydration mismatch by not rendering icon until mounted
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="muted"
        size="icon"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={toggleTheme}
      variant="muted"
      size="icon"
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Sun className="size-4" weight="bold" />
      ) : (
        <Moon className="size-4" weight="bold" />
      )}
    </Button>
  )
}
