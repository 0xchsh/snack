import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

type LoadingStateSize = 'sm' | 'md' | 'lg'

interface LoadingStateProps {
  message?: string
  size?: LoadingStateSize
  className?: string
  spinnerClassName?: string
}

const sizeMap: Record<LoadingStateSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

export function LoadingState({
  message = 'Loading…',
  size = 'md',
  className,
  spinnerClassName,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center space-y-4', className)}>
      <Spinner size={sizeMap[size]} className={spinnerClassName} />
      {message ? (
        <p className="text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  )
}
