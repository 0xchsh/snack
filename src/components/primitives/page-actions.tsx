import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ActionButton {
  icon?: LucideIcon | React.ReactNode
  label?: string
  onClick?: () => void
  href?: string
  variant?: 'default' | 'primary' | 'ghost'
  ariaLabel?: string
}

interface PageActionsProps {
  actions: ActionButton[]
  className?: string
}

/**
 * PageActions - Action buttons for page-level operations
 *
 * Supports icon buttons, labeled buttons, and different variants
 * Used for settings, theme toggle, profile menu, etc.
 */
export function PageActions({ actions, className }: PageActionsProps) {
  return (
    <div className={cn('flex items-center gap-nav', className)}>
      {actions.map((action, index) => {
        const Icon = action.icon as LucideIcon | undefined

        const buttonClasses = cn(
          'inline-flex items-center justify-center',
          'font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          action.label
            ? 'px-4 py-2 text-sm rounded-lg gap-2' // Labeled button
            : 'w-icon-button h-icon-button rounded-sm', // Icon-only button
          {
            'bg-primary text-primary-foreground hover:bg-primary/90':
              action.variant === 'primary',
            'text-muted-foreground hover:text-foreground hover:bg-accent':
              action.variant === 'ghost' || !action.variant,
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              action.variant === 'default' && action.label,
          }
        )

        const content = (
          <>
            {Icon && typeof Icon === 'function' && <Icon className="w-5 h-5" />}
            {Icon && typeof Icon !== 'function' && Icon}
            {action.label && <span>{action.label}</span>}
          </>
        )

        if (action.href) {
          return (
            <a
              key={index}
              href={action.href}
              className={buttonClasses}
              aria-label={action.ariaLabel}
            >
              {content}
            </a>
          )
        }

        return (
          <button
            key={index}
            onClick={action.onClick}
            className={buttonClasses}
            aria-label={action.ariaLabel}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
