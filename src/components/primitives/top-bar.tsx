import { cn } from '@/lib/utils'

interface TopBarProps {
  children: React.ReactNode
  className?: string
  variant?: 'app' | 'marketing'
}

/**
 * TopBar - Base navigation bar structure component
 *
 * Provides consistent border, background, and container structure.
 * Use with composition pattern: BrandMark, PrimaryNav, PageActions, UserMenu
 */
export function TopBar({ children, className, variant = 'app' }: TopBarProps) {
  const maxWidth = variant === 'marketing' ? 'max-w-container-marketing' : 'max-w-container-app'

  return (
    <header className="border-b border-border bg-background">
      <div className={cn(
        'container mx-auto',
        'px-nav-x py-nav-y',
        'md:px-nav-x md:py-nav-y',
        'sm:px-nav-x-mobile sm:py-nav-y-mobile',
        maxWidth,
        className
      )}>
        <div className="flex items-center justify-between">
          {children}
        </div>
      </div>
    </header>
  )
}

/**
 * TopBar.Left - Left section slot (typically for logo/branding)
 */
TopBar.Left = function TopBarLeft({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-nav', className)}>
      {children}
    </div>
  )
}

/**
 * TopBar.Center - Center section slot (typically for tabs/breadcrumbs)
 */
TopBar.Center = function TopBarCenter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-nav flex-1 justify-center', className)}>
      {children}
    </div>
  )
}

/**
 * TopBar.Right - Right section slot (typically for actions/user menu)
 */
TopBar.Right = function TopBarRight({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-nav', className)}>
      {children}
    </div>
  )
}
