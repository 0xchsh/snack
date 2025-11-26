import { cn } from '@/lib/utils'

interface AppContainerProps {
  children: React.ReactNode
  variant?: 'app' | 'marketing' | 'full'
  className?: string
}

/**
 * AppContainer - Max-width container for page content
 *
 * Variants:
 * - app: 1024px max-width (w-container-app) - for authenticated app pages
 * - marketing: 1280px max-width (w-container-marketing) - for landing/marketing pages
 * - full: No max-width constraint
 */
export function AppContainer({
  children,
  variant = 'app',
  className
}: AppContainerProps) {
  const maxWidthClass = {
    app: 'max-w-container-app',
    marketing: 'max-w-container-marketing',
    full: 'max-w-full'
  }[variant]

  return (
    <div className={cn(
      'container mx-auto',
      'px-nav-x-mobile',
      'sm:px-nav-x',
      maxWidthClass,
      className
    )}>
      {children}
    </div>
  )
}
