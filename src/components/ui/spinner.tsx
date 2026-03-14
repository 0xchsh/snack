import { cn } from '@/lib/utils'
import { SpinnerGap } from '@phosphor-icons/react'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string | undefined
}

const sizeClasses = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

function Spinner({ size = 'sm', className }: SpinnerProps) {
  return (
    <SpinnerGap
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', sizeClasses[size], className)}
    />
  )
}

export { Spinner }
