import { ArrowPathIcon } from '@heroicons/react/24/solid'

import { cn } from '@/lib/utils'

type LoadingStateSize = 'sm' | 'md' | 'lg'

interface LoadingStateProps {
  message?: string
  size?: LoadingStateSize
  className?: string
  spinnerClassName?: string
}

const sizeClasses: Record<LoadingStateSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingState({
  message = 'Loading…',
  size = 'md',
  className,
  spinnerClassName,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center space-y-4', className)}>
      <ArrowPathIcon
        className={cn('animate-spin text-primary', sizeClasses[size], spinnerClassName)}
        aria-hidden="true"
      />
      {message ? (
        <p className="text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  )
}
