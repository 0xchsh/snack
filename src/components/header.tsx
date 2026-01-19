'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, ReactNode } from 'react'
import { ChartBarIcon, StarIcon, DocumentDuplicateIcon, ArrowTopRightOnSquareIcon, EllipsisVerticalIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/solid'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { NAV_CONSTANTS } from '@/lib/navigation-constants'
import { ThemeToggle } from './theme-toggle'

export interface HeaderButton {
  type: 'view' | 'copy' | 'saved' | 'stats' | 'settings' | 'profile' | 'menu' | 'custom'
  label?: string
  icon?: ReactNode
  href?: string
  onClick?: () => void | Promise<void>
  isActive?: boolean
  className?: string
  menuItems?: Array<{
    label: string
    onClick: () => void
    type?: 'toggle' | 'action'
    checked?: boolean
  }>
}

interface HeaderProps {
  logoHref?: string
  buttons?: HeaderButton[]
  username?: string | undefined
}

function MenuButton({ menuItems }: { menuItems: Array<{ label: string; onClick: () => void; type?: 'toggle' | 'action'; checked?: boolean }> }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }

    return undefined
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="muted"
        size="icon"
        aria-label="More options"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon className={NAV_CONSTANTS.ICON_SIZE} aria-hidden="true" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-32px)] bg-background border border-border rounded-md shadow-lg py-2 z-50">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              className="w-full justify-between px-4 py-2 text-sm text-foreground hover:bg-accent"
              onClick={() => {
                item.onClick()
                if (item.type !== 'toggle') {
                  setIsOpen(false)
                }
              }}
            >
              <span>{item.label}</span>
              {item.type === 'toggle' && (
                <div className={`w-10 h-5 rounded-full transition-colors ${item.checked ? 'bg-primary' : 'bg-muted'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${item.checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header({
  logoHref = '/dashboard',
  buttons = [],
  username
}: HeaderProps) {

  const renderButton = (button: HeaderButton, index: number) => {
    switch (button.type) {
      case 'view':
        return (
          <Button
            key={index}
            type="button"
            onClick={button.onClick}
            variant="muted"
            className={cn('gap-2 font-medium', button.className)}
          >
            {button.label || 'View'}
            <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        )

      case 'copy':
        return (
          <Button
            key={index}
            type="button"
            onClick={button.onClick}
            variant="muted"
            className={cn('gap-2 font-medium', button.className)}
          >
            {button.label || 'Copy'}
            <DocumentDuplicateIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        )

      case 'saved':
        return (
          <Button
            key={index}
            asChild
            variant={button.isActive ? 'secondary' : 'muted'}
            className={cn(
              'gap-2 font-medium',
              button.className,
              button.isActive && 'text-foreground'
            )}
          >
            <Link href={button.href || '/dashboard?tab=saved'}>
              {button.label || 'Saved'}
              <StarIcon className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Button>
        )

      case 'stats':
        return (
          <Button
            key={index}
            asChild
            variant={button.isActive ? 'secondary' : 'muted'}
            className={cn(
              'gap-2 font-medium',
              button.className,
              button.isActive && 'text-foreground'
            )}
          >
            <Link href={button.href || '/dashboard?tab=stats'}>
              {button.label || 'Stats'}
              <ChartBarIcon className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Button>
        )

      case 'settings':
        return (
          <Button
            key={index}
            asChild
            variant="muted"
            size="icon"
            className={button.className}
            aria-label="Settings"
          >
            <Link href={button.href || '/profile'}>
              <Cog6ToothIcon className={NAV_CONSTANTS.ICON_SIZE} aria-hidden="true" />
            </Link>
          </Button>
        )

      case 'profile':
        return (
          <Button
            key={index}
            asChild
            variant="muted"
            size="icon"
            className={button.className}
            aria-label="View profile"
          >
            <Link href={button.href || `/${username}`}>
              <UserIcon className={NAV_CONSTANTS.ICON_SIZE} aria-hidden="true" />
            </Link>
          </Button>
        )

      case 'menu':
        return <MenuButton key={index} menuItems={button.menuItems || []} />

      case 'custom':
        if (button.href) {
          return (
            <Button
              key={index}
              asChild
              variant="muted"
              className={cn('gap-2 font-medium', button.className)}
            >
              <Link href={button.href}>
                {button.label}
                {button.icon}
              </Link>
            </Button>
          )
        }
        return (
          <Button
            key={index}
            type="button"
            onClick={button.onClick}
            variant="muted"
            className={cn('gap-2 font-medium', button.className)}
          >
            {button.label}
            {button.icon}
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-background">
      <div className="w-full px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={logoHref} className="flex items-center">
            <Image
              src="/images/logo.svg"
              alt="Snack"
              width={NAV_CONSTANTS.LOGO_WIDTH}
              height={NAV_CONSTANTS.LOGO_HEIGHT}
              className={NAV_CONSTANTS.LOGO_SIZE}
            />
          </Link>

          {/* Right side - Configured buttons */}
          <div className="flex items-center gap-nav">
            {buttons.map((button, index) => renderButton(button, index))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
