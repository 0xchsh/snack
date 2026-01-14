import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
}

export function Spinner({ size = 'sm', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin border-muted-foreground/30 border-t-muted-foreground',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  )
}
