import { cn } from '@/lib/utils'

interface DefaultAvatarProps {
  className?: string
  size?: number
}

/**
 * Default avatar component that adapts to light/dark theme.
 * Uses currentColor to inherit the text color from parent.
 * Wrap in a container with the desired text color class.
 */
export function DefaultAvatar({ className, size = 40 }: DefaultAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-muted-foreground', className)}
      aria-hidden="true"
    >
      <g clipPath="url(#defaultAvatarClip)">
        <rect
          opacity="0.5"
          x="250"
          y="250"
          width="500"
          height="500"
          rx="250"
          fill="currentColor"
        />
        <rect
          opacity="0.5"
          y="800"
          width="1000"
          height="1000"
          rx="500"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="defaultAvatarClip">
          <rect width="1000" height="1000" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
