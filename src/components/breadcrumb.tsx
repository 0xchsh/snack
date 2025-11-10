import Link from 'next/link'
import Image from 'next/image'

interface BreadcrumbProps {
  username: string
  currentPage: string
  profilePictureUrl?: string | null
}

export function Breadcrumb({ username, currentPage, profilePictureUrl }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-base">
      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
        {profilePictureUrl ? (
          <Image
            src={profilePictureUrl}
            alt={`${username} profile picture`}
            fill
            sizes="20px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <Link
        href={`/${username}`}
        className="text-foreground hover:text-primary transition-colors"
      >
        {username}
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground">{currentPage}</span>
    </div>
  )
}
