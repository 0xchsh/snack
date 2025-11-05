import Link from 'next/link'
import { User } from 'lucide-react'

interface BreadcrumbProps {
  username: string
  currentPage: string
}

export function Breadcrumb({ username, currentPage }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-base">
      <User className="w-4 h-4 text-muted-foreground" />
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
