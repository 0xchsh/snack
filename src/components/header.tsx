'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Settings, User, Bookmark, BarChart3, Copy, ExternalLink, MoreVertical } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { NAV_CONSTANTS } from '@/lib/navigation-constants'

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
  username?: string
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
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center ${NAV_CONSTANTS.ICON_BUTTON_SIZE} ${NAV_CONSTANTS.BORDER_RADIUS} bg-secondary text-muted-foreground hover:text-foreground transition-colors`}
      >
        <MoreVertical className={NAV_CONSTANTS.ICON_SIZE} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg py-2 z-50">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                if (item.type !== 'toggle') {
                  setIsOpen(false)
                }
              }}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center justify-between"
            >
              <span>{item.label}</span>
              {item.type === 'toggle' && (
                <div className={`w-10 h-5 rounded-full transition-colors ${item.checked ? 'bg-primary' : 'bg-muted'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${item.checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              )}
            </button>
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
    const baseClasses = "flex items-center gap-2 px-4 py-2 text-base font-medium transition-colors rounded-md"

    switch (button.type) {
      case 'view':
        return (
          <button
            key={index}
            onClick={button.onClick}
            className={`${baseClasses} bg-secondary text-muted-foreground hover:text-foreground`}
          >
            {button.label || 'View'}
            <ExternalLink className="w-4 h-4" />
          </button>
        )

      case 'copy':
        return (
          <button
            key={index}
            onClick={button.onClick}
            className={`${baseClasses} bg-secondary text-muted-foreground hover:text-foreground`}
          >
            {button.label || 'Copy'}
            <Copy className="w-4 h-4" />
          </button>
        )

      case 'saved':
        return (
          <Link
            key={index}
            href={button.href || '/dashboard?tab=saved'}
            className={`flex items-center gap-2 px-4 py-2 text-base font-medium transition-colors rounded-md ${
              button.isActive
                ? 'text-foreground bg-secondary'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {button.label || 'Saved'}
            <Bookmark className="w-4 h-4" />
          </Link>
        )

      case 'stats':
        return (
          <Link
            key={index}
            href={button.href || '/dashboard?tab=stats'}
            className={`flex items-center gap-2 px-4 py-2 text-base font-medium transition-colors rounded-md ${
              button.isActive
                ? 'text-foreground bg-secondary'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {button.label || 'Stats'}
            <BarChart3 className="w-4 h-4" />
          </Link>
        )

      case 'settings':
        return (
          <Link
            key={index}
            href={button.href || '/profile'}
            className={`inline-flex items-center justify-center ${NAV_CONSTANTS.ICON_BUTTON_SIZE} ${NAV_CONSTANTS.BORDER_RADIUS} bg-secondary text-muted-foreground hover:text-foreground transition-colors`}
          >
            <Settings className={NAV_CONSTANTS.ICON_SIZE} />
          </Link>
        )

      case 'profile':
        return (
          <Link
            key={index}
            href={button.href || `/${username}`}
            className={`inline-flex items-center justify-center ${NAV_CONSTANTS.ICON_BUTTON_SIZE} ${NAV_CONSTANTS.BORDER_RADIUS} bg-secondary text-muted-foreground hover:text-foreground transition-colors`}
          >
            <User className={NAV_CONSTANTS.ICON_SIZE} />
          </Link>
        )

      case 'menu':
        return <MenuButton key={index} menuItems={button.menuItems || []} />

      case 'custom':
        if (button.href) {
          return (
            <Link
              key={index}
              href={button.href}
              className={button.className || `${baseClasses} bg-secondary text-muted-foreground hover:text-foreground`}
            >
              {button.label}
              {button.icon}
            </Link>
          )
        }
        return (
          <button
            key={index}
            onClick={button.onClick}
            className={button.className || `${baseClasses} bg-secondary text-muted-foreground hover:text-foreground`}
          >
            {button.label}
            {button.icon}
          </button>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-background">
      <div className={`mx-auto w-full max-w-container-app ${NAV_CONSTANTS.CONTAINER_PADDING_X} ${NAV_CONSTANTS.CONTAINER_PADDING_Y}`}>
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
          <div className={`flex items-center ${NAV_CONSTANTS.BUTTON_GAP}`}>
            {buttons.map((button, index) => renderButton(button, index))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
