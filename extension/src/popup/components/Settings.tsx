import React from 'react'
import type { ExtensionUser } from '@/shared/types'

interface SettingsProps {
  user: ExtensionUser
  onBack: () => void
  onSignOut: () => void
}

export function Settings({ user, onBack, onSignOut }: SettingsProps) {
  return (
    <div className="popup-container flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-snack-border">
        <button
          onClick={onBack}
          className="p-1 hover:bg-snack-bg-elevated rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-snack-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="font-semibold text-white">Settings</span>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-snack-border">
        <div className="flex items-center gap-3">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.username || 'Profile'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-snack-bg-elevated rounded-full flex items-center justify-center text-lg">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user.username || 'User'}
            </div>
            <div className="text-xs text-snack-text-muted truncate">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Settings options */}
      <div className="flex-1 p-2">
        <a
          href="https://snack.xyz/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-snack-bg-elevated rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-snack-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-sm text-white">Account Settings</span>
          <svg
            className="w-4 h-4 text-snack-text-muted ml-auto"
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
        </a>

        <a
          href="https://github.com/anthropics/claude-code/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-snack-bg-elevated rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-snack-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-white">Help & Feedback</span>
          <svg
            className="w-4 h-4 text-snack-text-muted ml-auto"
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
        </a>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-snack-border">
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Version */}
      <div className="p-2 text-center">
        <span className="text-xs text-snack-text-muted">Snack v1.0.0</span>
      </div>
    </div>
  )
}
