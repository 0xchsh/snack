'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Skeleton } from 'boneyard-js/react'

function ExtensionCallbackContent() {
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
      setStatus('success')
      setTimeout(() => {
        window.close()
      }, 2000)
    }
  }, [code, error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🥨</div>

        <Skeleton
          name="extension-callback"
          loading={status === 'processing'}
          animate="pulse"
          fallback={
            <div className="space-y-3">
              <div className="h-7 w-40 bg-muted animate-pulse rounded-md mx-auto" />
              <div className="h-5 w-48 bg-muted animate-pulse rounded-md mx-auto" />
            </div>
          }
        >
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
        </Skeleton>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🥨</div>
        <div className="space-y-3">
          <div className="h-7 w-40 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-5 w-48 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>
    </div>
  )
}

export default function ExtensionCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExtensionCallbackContent />
    </Suspense>
  )
}
