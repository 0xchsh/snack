import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  variant?: 'app' | 'marketing'
  href?: string
  className?: string
}

/**
 * BrandMark - Logo component
 *
 * - Uses 32px size (w-logo-marketing h-logo-marketing) for consistency across all pages
 * - Automatically links to appropriate destination based on variant
 */
export function BrandMark({
  variant = 'app',
  href,
  className
}: BrandMarkProps) {
  const sizeClass = 'w-logo-marketing h-logo-marketing'

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
