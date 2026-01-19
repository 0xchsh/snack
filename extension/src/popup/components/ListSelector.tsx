import React, { useState } from 'react'
import type { ExtensionUser, SnackList } from '@/shared/types'
import { truncate } from '@/shared/utils'

interface ListSelectorProps {
  user: ExtensionUser
  lists: SnackList[]
  isLoading: boolean
  onOpenSettings: () => void
  onRefresh: () => void
}

export function ListSelector({
  user,
  lists,
  isLoading,
  onOpenSettings,
  onRefresh,
}: ListSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort lists
  const filteredLists = lists
    .filter((list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

  const openList = (list: SnackList) => {
    const url = `https://snack.xyz/${user.username}/${list.publicId}`
    chrome.tabs.create({ url })
  }

  return (
    <div className="popup-container flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-snack-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥨</span>
          <span className="font-semibold text-white">Snack</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 hover:bg-snack-bg-elevated rounded-lg transition-colors"
            title="Refresh lists"
          >
            <svg
              className={`w-4 h-4 text-snack-text-muted ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-snack-bg-elevated rounded-lg transition-colors"
            title="Settings"
          >
            <svg
              className="w-4 h-4 text-snack-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search (if many lists) */}
      {lists.length > 5 && (
        <div className="p-3 border-b border-snack-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lists..."
            className="w-full px-3 py-2 bg-snack-bg-elevated border border-snack-border rounded-lg text-sm text-white placeholder-snack-text-muted focus:outline-none focus:ring-2 focus:ring-snack-primary focus:border-transparent"
          />
        </div>
      )}

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-snack-border border-t-snack-primary rounded-full animate-spin" />
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="p-4 text-center text-sm text-snack-text-muted">
            {searchQuery ? 'No lists found' : 'No lists yet. Create one on snack.xyz'}
          </div>
        ) : (
          <div className="py-1">
            {filteredLists.map((list) => (
              <button
                key={list.id}
                onClick={() => openList(list)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-snack-bg-elevated transition-colors text-left"
              >
                <span className="text-lg flex-shrink-0">{list.emoji || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {truncate(list.title, 30)}
                  </div>
                  <div className="text-xs text-snack-text-muted">
                    {list.linkCount} link{list.linkCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-snack-text-muted flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-snack-border">
        <a
          href="https://snack.xyz/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-snack-primary hover:text-snack-primary-hover transition-colors"
        >
          <span>Open Snack Dashboard</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
