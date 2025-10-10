import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavTab {
  label: string
  href: string
  icon?: React.ReactNode
  isActive?: boolean
  count?: number
}

interface PrimaryNavProps {
  tabs: NavTab[]
  className?: string
}

/**
 * PrimaryNav - Tab navigation component
 *
 * Used for primary navigation patterns like dashboard tabs (Saved/Stats)
 * Supports icons, counts, and active states
 */
export function PrimaryNav({ tabs, className }: PrimaryNavProps) {
  return (
    <nav className={cn('flex items-center gap-nav', className)} role="navigation">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors',
            'flex items-center gap-2 border rounded-sm',
            tab.isActive
              ? 'text-foreground bg-secondary border-border'
              : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
          )}
          aria-current={tab.isActive ? 'page' : undefined}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-xs opacity-70">({tab.count})</span>
          )}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Breadcrumb - Breadcrumb navigation component
 *
 * Used for hierarchical navigation
 */
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="text-muted-foreground">/</span>
          )}
        </div>
      ))}
    </nav>
  )
}
