import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset shapes for common use cases */
  variant?: 'text' | 'circular' | 'rectangular'
  /** Width - can be Tailwind class (w-32) or CSS value (128px) */
  width?: string
  /** Height - can be Tailwind class (h-4) or CSS value (16px) */
  height?: string
}

/**
 * A flexible skeleton loading primitive.
 *
 * @example
 * // Basic text line
 * <Skeleton className="h-4 w-3/4" />
 *
 * // Circular avatar
 * <Skeleton variant="circular" className="w-10 h-10" />
 *
 * // Aspect ratio image placeholder
 * <Skeleton className="aspect-video w-full" />
 *
 * // With explicit dimensions
 * <Skeleton width="w-32" height="h-4" />
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-accent',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rectangular' && 'rounded-md',
        width,
        height,
        className
      )}
      {...props}
    />
  )
}

/**
 * Pre-built skeleton for link cards that matches LinkItem dimensions exactly.
 * Use this in list-editor.tsx and public-list-view.tsx loading states.
 */
export function LinkCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* OG Image - aspect-video matches actual card */}
      <Skeleton className="aspect-video w-full" />

      {/* Site Info - matches actual card structure exactly */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Favicon */}
          <Skeleton className="w-4 h-4 rounded-sm flex-shrink-0" />
          {/* Title - text-base is ~16px, with line-height ~24px, truncated */}
          <Skeleton className="h-5 flex-1 max-w-[70%]" />
        </div>
        {/* Domain text */}
        <Skeleton className="h-4 w-20 flex-shrink-0" />
      </div>
    </div>
  )
}

/**
 * Pre-built skeleton for list rows (dashboard list items).
 * Matches the exact structure: emoji + title + link count
 */
export function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-3 bg-background border border-border rounded-md',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Emoji - text-base has 24px line-height */}
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
        {/* Title - text-base font-medium, variable width */}
        <Skeleton className="h-5 w-36" />
      </div>
      {/* Link count - text-sm has 20px line-height */}
      <Skeleton className="h-4 w-14 flex-shrink-0 ml-3" />
    </div>
  )
}
