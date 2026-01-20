import React, { useState, useRef, useEffect } from 'react'
import type { ExtractedLink, SnackList, AuthState } from '@/shared/types'
import { ListDropdown } from './ListDropdown'

interface SnackButtonProps {
  links: ExtractedLink[]
  onSave: (listId: string) => Promise<void>
  onCreateList: (title: string, emoji: string) => Promise<SnackList>
  onSignIn: () => void
  authState: AuthState
  lists: SnackList[]
  isLoadingLists: boolean
}

export function SnackButton({
  links,
  onSave,
  onCreateList,
  onSignIn,
  authState,
  lists,
  isLoadingLists,
}: SnackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside (use 'click' not 'mousedown' to allow list clicks to complete)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Use composedPath for Shadow DOM compatibility
      const path = event.composedPath()
      const clickedInDropdown = dropdownRef.current && path.includes(dropdownRef.current)
      const clickedOnButton = buttonRef.current && path.includes(buttonRef.current)

      if (!clickedInDropdown && !clickedOnButton) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Use setTimeout to avoid catching the opening click
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true)
      }, 0)
      return () => document.removeEventListener('click', handleClickOutside, true)
    }
  }, [isOpen])

  const handleSave = async (listId: string) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      await onSave(listId)
      setIsOpen(false)
    } catch (error) {
      console.error('[Snack] Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateAndSave = async (title: string, emoji: string) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const newList = await onCreateList(title, emoji)
      await onSave(newList.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create and save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34.75px',
    height: '34.75px',
    borderRadius: '9999px',
    border: 'none',
    background: isOpen || isHovered ? 'rgba(113, 118, 123, 0.15)' : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    padding: 0,
  }

  const iconStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    color: isHovered ? 'rgb(231, 233, 234)' : 'rgb(113, 118, 123)',
    transition: 'all 0.2s',
    transform: isOpen || isHovered ? 'scale(1.05)' : 'scale(1)',
  }

  // Stop event propagation to prevent Twitter from navigating
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Also stop native event propagation
    e.nativeEvent.stopImmediatePropagation()
    setIsOpen(!isOpen)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
      onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
      onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
    >
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isSaving}
        style={buttonStyle}
        title={`Save ${links.length} link${links.length > 1 ? 's' : ''} to Snack`}
        aria-label="Save to Snack"
      >
        <svg
          style={iconStyle}
          viewBox="0 0 72 72"
          fill="none"
        >
          {/* Rounded rectangle border */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M54 0C63.9411 0 72 8.059 72 18V54C72 63.941 63.9411 72 54 72H18C8.059 72 0 63.941 0 54V18C0 8.059 8.059 0 18 0H54ZM18 6C11.373 6 6 11.373 6 18V54C6 60.627 11.373 66 18 66H54C60.627 66 66 60.627 66 54V18C66 11.373 60.627 6 54 6H18Z"
            fill="currentColor"
          />
          {/* Pretzel icon */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M37.79 17.558C42.746 14.468 48.035 13.877 52.977 17.463C58.33 21.35 59.754 27.144 59.058 33.342C58.389 39.3 55.83 44.504 51.295 48.652C50.673 49.221 50.249 50.633 50.498 51.411C51.208 53.64 51.798 55.553 48.937 56.675C45.884 57.873 45.314 55.489 44.346 53.625C44.247 53.437 44.092 53.276 43.88 52.986C39.142 52.986 28.239 53.022 28.171 53.023C28.159 53.042 27.584 54.002 27.121 54.778C26.067 56.544 25.018 57.66 22.811 56.567C20.835 55.591 20.088 54.232 21.223 52.23C22.17 50.557 21.692 49.534 20.322 48.227C14.059 42.249 11.581 34.68 13.323 26.366C15.29 16.982 24.104 12.036 33.588 17.151C34.969 17.897 36.011 18.667 37.79 17.558ZM30.579 46.352H41.392C39.527 41.837 37.887 37.864 35.955 33.188C34 37.975 32.409 41.872 30.579 46.352ZM51.875 27.11C50.449 21.762 44.554 20.084 40.488 23.832C40.043 24.242 39.66 25.249 39.854 25.735C42.134 31.427 44.53 37.072 47.111 43.248C51.774 38.336 53.489 33.161 51.875 27.11ZM31.431 23.862C28.944 20.884 23.721 21.275 21.521 24.5C17.813 29.937 19.292 37.755 24.718 43.009C24.925 42.952 29.694 31.71 31.892 26.221C32.148 25.58 31.891 24.415 31.431 23.862Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            zIndex: 10000,
          }}
        >
          <ListDropdown
            lists={lists}
            isLoading={isLoadingLists}
            isSaving={isSaving}
            isAuthenticated={authState.isAuthenticated}
            onSelect={handleSave}
            onCreate={handleCreateAndSave}
            onSignIn={onSignIn}
            onClose={() => setIsOpen(false)}
            linkCount={links.length}
          />
        </div>
      )}
    </div>
  )
}
