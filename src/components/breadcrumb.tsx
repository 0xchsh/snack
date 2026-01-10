import Link from 'next/link'
import Image from 'next/image'
import { DefaultAvatar } from '@/components/default-avatar'

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
          <DefaultAvatar size={20} />
        )}
      </div>
      <Link
        href={`/${username}`}
        className="text-foreground hover:text-primary transition-colors font-semibold"
      >
        {username}
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground font-medium">{currentPage}</span>
    </div>
  )
}
