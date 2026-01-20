import React, { useState, useRef, useEffect } from 'react'
import type { SnackList } from '@/shared/types'
import { DEFAULT_LIST_EMOJI } from '@/shared/constants'

interface ListDropdownProps {
  lists: SnackList[]
  isLoading: boolean
  isSaving: boolean
  isAuthenticated: boolean
  onSelect: (listId: string) => void
  onCreate: (title: string, emoji: string) => void
  onSignIn: () => void
  onClose: () => void
  linkCount: number
}

// Design tokens - Cosmos-inspired dark theme
const colors = {
  bg: 'rgb(22, 24, 28)',
  bgElevated: 'rgb(32, 34, 38)',
  border: 'rgb(47, 51, 54)',
  text: 'rgb(255, 255, 255)',
  textMuted: 'rgb(113, 118, 123)',
  primary: '#e5e5e5',
  primaryForeground: '#171717',
}

// Spinner component
const Spinner = ({ size = 16, color = colors.textMuted }: { size?: number; color?: string }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `2px solid ${colors.border}`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'snack-spin 0.7s linear infinite',
    }}
  />
)

// Shared styles
const dropdownStyle: React.CSSProperties = {
  width: '300px',
  backgroundColor: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  pointerEvents: 'auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  color: colors.text,
  outline: 'none',
}

export function ListDropdown({
  lists,
  isLoading,
  isSaving,
  isAuthenticated,
  onSelect,
  onCreate,
  onSignIn,
  onClose,
  linkCount: _linkCount,
}: ListDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [newListEmoji, setNewListEmoji] = useState(DEFAULT_LIST_EMOJI)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [savingListId, setSavingListId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const newListInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated && !isLoading && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (isCreating && newListInputRef.current) {
      newListInputRef.current.focus()
    }
  }, [isCreating])

  const filteredLists = lists.filter((list) =>
    list.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedLists = [...filteredLists].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return
    onCreate(newListTitle.trim(), newListEmoji)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isCreating) {
        setIsCreating(false)
        setNewListTitle('')
      } else {
        onClose()
      }
    }
  }

  // Keyframes for spinner
  const spinnerKeyframes = `
    @keyframes snack-spin {
      to { transform: rotate(360deg); }
    }
  `

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div style={dropdownStyle}>
        <style>{spinnerKeyframes}</style>
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🥨</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: colors.text,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Save to Snack
          </h3>
          <p style={{
            fontSize: '14px',
            color: colors.textMuted,
            marginBottom: '20px',
            lineHeight: 1.5,
          }}>
            Sign in to save links to your lists
          </p>
          <button
            onClick={onSignIn}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: colors.primary,
              color: colors.primaryForeground,
              fontWeight: 500,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Sign in to Snack
          </button>
        </div>
      </div>
    )
  }

  // Creating new list
  if (isCreating) {
    return (
      <div style={dropdownStyle} onKeyDown={handleKeyDown}>
        <style>{spinnerKeyframes}</style>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={() => {
              setIsCreating(false)
              setNewListTitle('')
            }}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg style={{ width: '16px', height: '16px', color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span style={{
            fontSize: '16px',
            fontWeight: 500,
            color: colors.text,
            letterSpacing: '-0.01em',
          }}>
            New List
          </span>
        </div>

        <form onSubmit={handleCreateSubmit} style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              type="button"
              style={{
                width: '48px',
                height: '48px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgElevated,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={() => {
                const emojis = ['🎯', '📚', '💡', '🔗', '⭐', '🎨', '🚀', '💻', '📝', '🥨']
                const currentIndex = emojis.indexOf(newListEmoji)
                setNewListEmoji(emojis[(currentIndex + 1) % emojis.length])
              }}
            >
              {newListEmoji}
            </button>
            <input
              ref={newListInputRef}
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="List name"
              style={inputStyle}
              maxLength={50}
            />
          </div>

          <button
            type="submit"
            disabled={!newListTitle.trim() || isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 20px',
              backgroundColor: newListTitle.trim() && !isSaving ? colors.primary : colors.bgElevated,
              color: newListTitle.trim() && !isSaving ? colors.primaryForeground : colors.textMuted,
              fontWeight: 500,
              borderRadius: '9999px',
              border: 'none',
              cursor: newListTitle.trim() && !isSaving ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            {isSaving && <Spinner size={14} color={colors.textMuted} />}
            {isSaving ? 'Creating...' : 'Create & Save'}
          </button>
        </form>
      </div>
    )
  }

  // Main list view
  return (
    <div style={dropdownStyle} onKeyDown={handleKeyDown}>
      <style>{spinnerKeyframes}</style>
      {/* Header - Cosmos style centered title */}
      <div style={{
        padding: '20px 20px 16px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 500,
          color: colors.text,
          marginBottom: '16px',
          letterSpacing: '-0.01em',
        }}>
          Save to Snack
        </h2>

        {/* Search - always visible */}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          style={inputStyle}
        />
      </div>

      {/* Lists */}
      <div style={{
        maxHeight: '280px',
        overflowY: 'auto',
        padding: '0 8px',
      }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: `2px solid ${colors.border}`,
                borderTopColor: colors.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        ) : sortedLists.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: colors.textMuted,
          }}>
            {searchQuery ? 'No lists found' : 'No lists yet'}
          </div>
        ) : (
          sortedLists.map((list) => (
            <div
              key={list.id}
              role="button"
              tabIndex={0}
              ref={(el) => {
                if (el) {
                  el.onclick = (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!savingListId) {
                      setSavingListId(list.id)
                      onSelect(list.id)
                    }
                  }
                }
              }}
              onMouseEnter={() => setHoveredId(list.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: hoveredId === list.id ? colors.bgElevated : 'transparent',
                cursor: savingListId ? 'not-allowed' : 'pointer',
                opacity: savingListId && savingListId !== list.id ? 0.5 : 1,
                transition: 'background-color 0.15s',
              }}
            >
              {/* Emoji avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgElevated,
                borderRadius: '10px',
                fontSize: '20px',
              }}>
                {list.emoji || '🎯'}
              </div>

              {/* Title and count */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {list.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.textMuted,
                  marginTop: '2px',
                }}>
                  {list.linkCount} link{list.linkCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Add icon or spinner */}
              <div style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: savingListId === list.id ? 'none' : `1px solid ${colors.border}`,
                color: colors.textMuted,
                flexShrink: 0,
              }}>
                {savingListId === list.id ? (
                  <Spinner size={16} color={colors.textMuted} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create new list button - Cosmos style */}
      <div style={{ padding: '12px 16px 16px' }}>
        <button
          onClick={() => setIsCreating(true)}
          disabled={!!savingListId}
          onMouseEnter={() => setHoveredId('new')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 20px',
            backgroundColor: hoveredId === 'new' ? colors.bgElevated : colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '9999px',
            cursor: savingListId ? 'not-allowed' : 'pointer',
            opacity: savingListId ? 0.5 : 1,
            transition: 'background-color 0.15s',
          }}
        >
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: colors.text,
          }}>
            Create new list
          </span>
        </button>
      </div>
    </div>
  )
}
