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

// Shared styles
const dropdownStyle: React.CSSProperties = {
  width: '280px',
  backgroundColor: 'rgb(22, 24, 28)',
  border: '1px solid rgb(47, 51, 54)',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const buttonBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'rgb(47, 51, 54)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'white',
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
  linkCount,
}: ListDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [newListEmoji, setNewListEmoji] = useState(DEFAULT_LIST_EMOJI)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
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

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div style={dropdownStyle}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🥨</div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
            Save to Snack
          </h3>
          <p style={{ fontSize: '13px', color: 'rgb(113, 118, 123)', marginBottom: '16px' }}>
            Sign in to save links to your lists
          </p>
          <button
            onClick={onSignIn}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#e5e5e5',
              color: '#171717',
              fontWeight: 600,
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
        <div style={{ padding: '12px', borderBottom: '1px solid rgb(47, 51, 54)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewListTitle('')
              }}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: 'rgb(113, 118, 123)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>New List</span>
          </div>
        </div>

        <form onSubmit={handleCreateSubmit} style={{ padding: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgb(47, 51, 54)',
                borderRadius: '8px',
                border: 'none',
                fontSize: '20px',
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
              width: '100%',
              padding: '10px 16px',
              backgroundColor: newListTitle.trim() && !isSaving ? '#e5e5e5' : 'rgb(47, 51, 54)',
              color: newListTitle.trim() && !isSaving ? '#171717' : 'rgb(113, 118, 123)',
              fontWeight: 600,
              borderRadius: '9999px',
              border: 'none',
              cursor: newListTitle.trim() && !isSaving ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            {isSaving ? 'Creating...' : `Create & Save ${linkCount} link${linkCount > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    )
  }

  // Main list view
  return (
    <div style={dropdownStyle} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgb(47, 51, 54)' }}>
        <div style={{ fontSize: '13px', color: 'rgb(113, 118, 123)', marginBottom: '8px' }}>
          Save {linkCount} link{linkCount > 1 ? 's' : ''} to...
        </div>
        {lists.length > 5 && (
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lists"
            style={{ ...inputStyle, width: '100%' }}
          />
        )}
      </div>

      {/* Lists */}
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgb(47, 51, 54)',
                borderTopColor: '#e5e5e5',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        ) : sortedLists.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'rgb(113, 118, 123)' }}>
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
                    console.log('[Snack] List clicked (native):', list.id, list.title)
                    if (!isSaving) {
                      onSelect(list.id)
                    }
                  }
                }
              }}
              onMouseEnter={() => setHoveredId(list.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...buttonBaseStyle,
                backgroundColor: hoveredId === list.id ? 'rgb(47, 51, 54)' : 'transparent',
                opacity: isSaving ? 0.5 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{list.emoji || '🎯'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {list.title}
                </div>
                <div style={{ fontSize: '12px', color: 'rgb(113, 118, 123)' }}>
                  {list.linkCount} link{list.linkCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create new list */}
      <div style={{ padding: '8px', borderTop: '1px solid rgb(47, 51, 54)' }}>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isSaving}
          onMouseEnter={() => setHoveredId('new')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            ...buttonBaseStyle,
            borderRadius: '8px',
            backgroundColor: hoveredId === 'new' ? 'rgb(47, 51, 54)' : 'transparent',
            opacity: isSaving ? 0.5 : 1,
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          <span
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e5e5e5',
              borderRadius: '50%',
              color: '#171717',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            +
          </span>
          <span style={{ fontSize: '14px', color: '#e5e5e5', fontWeight: 500 }}>New List</span>
        </button>
      </div>
    </div>
  )
}
