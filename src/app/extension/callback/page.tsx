'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ExtensionCallbackPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')

  useEffect(() => {
    if (error) {
      setStatus('error')
      return
    }

    if (code) {
      // The extension's background script will detect this page and extract the code
      // We just need to show a success message
      setStatus('success')

      // Try to close the tab after a delay (works in some browsers)
      setTimeout(() => {
        window.close()
      }, 2000)
    }
  }, [code, error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🥨</div>

        {status === 'processing' && (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Processing...
            </h1>
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-green-500 mb-2">
              Successfully Connected!
            </h1>
            <p className="text-muted-foreground mb-4">
              You can now close this tab and return to Twitter.
            </p>
            <p className="text-sm text-muted-foreground">
              This tab will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Connection Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Something went wrong'}
            </p>
            <button
              onClick={() => window.close()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
