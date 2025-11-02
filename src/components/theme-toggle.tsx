'use client'

import * as React from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui'

import { useTheme } from './theme-provider'

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
        <div className="w-5 h-5" />
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
        <Sun className="w-5 h-5" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5" strokeWidth={2} />
      )}
    </Button>
  )
}
