import { User } from 'lucide-react'

interface BreadcrumbProps {
  username: string
  currentPage: string
}

export function Breadcrumb({ username, currentPage }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-base">
      <User className="w-4 h-4 text-muted-foreground" />
      <span className="text-foreground">{username}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground">{currentPage}</span>
    </div>
  )
}
