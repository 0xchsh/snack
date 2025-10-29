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
        const isIconOnly = !action.label

        const buttonClasses = cn(
          'inline-flex items-center justify-center',
          'font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isIconOnly
            ? 'w-icon-button h-icon-button rounded-sm'
            : 'px-4 py-2 text-sm rounded-lg gap-2',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90':
              action.variant === 'primary',
            'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/90':
              (action.variant === 'ghost' || !action.variant) && isIconOnly,
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              action.variant === 'default',
            'text-muted-foreground hover:text-foreground hover:bg-secondary/80':
              (action.variant === 'ghost' || !action.variant) && !isIconOnly,
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
