import { Button } from '@/components/ui'
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
        const size = isIconOnly ? 'icon' : 'default'

        const variant =
          action.variant === 'primary'
            ? 'primary'
            : action.variant === 'default'
              ? 'secondary'
              : isIconOnly
                ? 'muted'
                : 'ghost'

        const classNames = cn(
          isIconOnly ? 'rounded-sm' : 'gap-2 text-sm',
          !isIconOnly && action.variant === 'ghost' && 'font-medium'
        )

        const content = (
          <>
            {Icon && typeof Icon === 'function' && <Icon className="w-5 h-5" />}
            {Icon && typeof Icon !== 'function' && Icon}
            {action.label && <span>{action.label}</span>}
          </>
        )

        const sharedProps = {
          key: index,
          variant,
          size,
          className: classNames,
          'aria-label': action.ariaLabel,
        } as const

        if (action.href) {
          return (
            <Button asChild {...sharedProps}>
              <a href={action.href} onClick={action.onClick}>
                {content}
              </a>
            </Button>
          )
        }

        return (
          <Button type="button" onClick={action.onClick} {...sharedProps}>
            {content}
          </Button>
        )
      })}
    </div>
  )
}
