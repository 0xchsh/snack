import React from 'react'

interface LoginScreenProps {
  onSignIn: () => void
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  return (
    <div className="popup-container flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🥨</div>
      <h1 className="text-xl font-bold text-white mb-2">Snack</h1>
      <p className="text-sm text-snack-text-muted mb-6">
        Save links from Twitter to your curated lists
      </p>

      <button
        onClick={onSignIn}
        className="w-full py-3 px-4 bg-snack-primary hover:bg-snack-primary-hover text-snack-primary-foreground font-semibold rounded-xl transition-colors"
      >
        Sign in to Snack
      </button>

      <p className="text-xs text-snack-text-muted mt-4">
        Don't have an account?{' '}
        <a
          href="https://snack.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-snack-text hover:underline"
        >
          Create one
        </a>
      </p>
    </div>
  )
}
