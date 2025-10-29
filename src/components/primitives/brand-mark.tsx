import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  variant?: 'app' | 'marketing'
  href?: string
  className?: string
}

/**
 * BrandMark - Logo component with responsive sizing
 *
 * - App variant: 32px (w-logo-app h-logo-app)
 * - Marketing variant: 32px (w-logo-app h-logo-app)
 * - Automatically links to appropriate destination based on variant
 */
export function BrandMark({
  variant = 'app',
  href,
  className
}: BrandMarkProps) {
  const sizeClass = 'w-logo-app h-logo-app'

  const defaultHref = variant === 'marketing' ? '/' : '/dashboard'
  const destination = href ?? defaultHref

  return (
    <Link
      href={destination}
      className={cn('flex items-center', className)}
      aria-label="Snack Home"
    >
      <img
        src="/images/logo.svg"
        alt="Snack"
        className={cn(sizeClass, 'transition-opacity hover:opacity-80')}
      />
    </Link>
  )
}
