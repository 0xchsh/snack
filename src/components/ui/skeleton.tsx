import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

/** Pre-built skeleton for link cards */
function LinkCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Skeleton className="aspect-video w-full" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Skeleton className="w-4 h-4 rounded-sm flex-shrink-0" />
          <Skeleton className="h-5 flex-1 max-w-[70%]" />
        </div>
        <Skeleton className="h-4 w-20 flex-shrink-0" />
      </div>
    </div>
  )
}

/** Pre-built skeleton for list rows */
function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-3 bg-background border border-border rounded-md',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
        <Skeleton className="h-5 w-36" />
      </div>
      <Skeleton className="h-4 w-14 flex-shrink-0 ml-3" />
    </div>
  )
}

export { Skeleton, LinkCardSkeleton, ListRowSkeleton }
