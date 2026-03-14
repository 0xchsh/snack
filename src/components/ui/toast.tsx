'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CheckCircle, Info, Warning, XCircle, SpinnerGap } from '@phosphor-icons/react'

function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  const resolvedTheme = (theme ?? 'system') as 'light' | 'dark' | 'system'

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" weight="bold" />,
        info: <Info className="size-4" weight="bold" />,
        warning: <Warning className="size-4" weight="bold" />,
        error: <XCircle className="size-4" weight="bold" />,
        loading: <SpinnerGap className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
