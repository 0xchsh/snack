'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ExtensionAuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'authorizing' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callback')

  useEffect(() => {
    async function authorize() {
      if (!callbackUrl) {
        setStatus('error')
        setError('Missing callback URL')
        return
      }

      // Validate callback URL
      const isValidCallback =
        callbackUrl.startsWith('chrome-extension://') ||
        callbackUrl.startsWith('http://localhost') ||
        callbackUrl.startsWith('https://snack.xyz/extension/callback')

      if (!isValidCallback) {
        setStatus('error')
        setError('Invalid callback URL')
        return
      }

      setStatus('authorizing')

      try {
        // Request auth code from API
        const response = await fetch('/api/extension/auth/authorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ callback_url: callbackUrl }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))

          if (response.status === 401) {
            // Not logged in - redirect to sign-in
            const returnUrl = encodeURIComponent(window.location.href)
            router.push(`/auth/sign-in?returnUrl=${returnUrl}`)
            return
          }

          throw new Error(data.error || 'Failed to authorize')
        }

        const data = await response.json()
        const { code } = data

        // Redirect to callback URL with code
        setStatus('success')
        const redirectUrl = `${callbackUrl}?code=${encodeURIComponent(code)}`
        window.location.href = redirectUrl
      } catch (err) {
        console.error('Authorization error:', err)
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authorization failed')
      }
    }

    authorize()
  }, [callbackUrl, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🥨</div>

        {status === 'loading' && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Loading...
            </h1>
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === 'authorizing' && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Connecting to Snack Extension
            </h1>
            <p className="text-muted-foreground mb-6">
              Please wait while we authorize the extension...
            </p>
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-green-500 mb-2">
              Success!
            </h1>
            <p className="text-muted-foreground">
              Redirecting back to the extension...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Authorization Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Something went wrong'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
