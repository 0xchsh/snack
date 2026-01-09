'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/toast'
import { AppContainer } from '@/components/primitives'
import { useAuth } from '@/hooks/useAuth'

/**
 * Test page for Phase 1 features:
 * 1. Toast notifications
 * 2. Error boundary (trigger error)
 * 3. Logout functionality
 */
export default function TestFeaturesPage() {
  const toast = useToast()
  const { user, signOut, loading } = useAuth()
  const [shouldError, setShouldError] = useState(false)

  // Trigger error for error boundary test
  if (shouldError) {
    throw new Error('Test error for ErrorBoundary - This is intentional!')
  }

  const handleTestToasts = () => {
    toast.success('Success toast!', 'This is a success message')

    setTimeout(() => {
      toast.error('Error toast!', 'This is an error message')
    }, 500)

    setTimeout(() => {
      toast.warning('Warning toast!', 'This is a warning message')
    }, 1000)

    setTimeout(() => {
      toast.info('Info toast!', 'This is an info message')
    }, 1500)
  }

  const handleTestLogout = async () => {
    if (!user) {
      toast.error('Not logged in', 'Please log in first to test logout')
      return
    }

    try {
      toast.info('Logging out...', 'Testing logout functionality')
      await signOut()
    } catch (error) {
      toast.error('Logout failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppContainer variant="app">
        <div className="py-8">
          <div className="max-w-[560px] w-full mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Phase 1 Feature Tests
              </h1>
              <p className="text-muted-foreground">
                Test the technical debt fixes we implemented
              </p>
            </div>

            {/* User Info */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Auth Status</h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : user ? (
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Logged in as:</span>{' '}
                    <span className="font-medium">{user.username}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{user.email}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not logged in</p>
              )}
            </div>

            {/* Test 1: Toast Notifications */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">1. Toast Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Test the new centralized toast system with all 4 types
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleTestToasts}
                  variant="primary"
                  size="sm"
                >
                  Test All Toasts
                </Button>

                <Button
                  onClick={() => toast.success('Success!', 'Operation completed')}
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  Success
                </Button>

                <Button
                  onClick={() => toast.error('Error!', 'Something went wrong')}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Error
                </Button>

                <Button
                  onClick={() => toast.warning('Warning!', 'Please be careful')}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                >
                  Warning
                </Button>

                <Button
                  onClick={() => toast.info('Info!', 'Here is some information')}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                >
                  Info
                </Button>
              </div>

              <div className="bg-muted rounded p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Expected:</strong> Toasts appear at top center with animations, auto-dismiss after 3s, can be manually closed
                </p>
              </div>
            </div>

            {/* Test 2: Error Boundary */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">2. Error Boundary</h2>
                <p className="text-sm text-muted-foreground">
                  Trigger a runtime error to test the global error boundary
                </p>
              </div>

              <Button
                onClick={() => setShouldError(true)}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Trigger Error
              </Button>

              <div className="bg-muted rounded p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Expected:</strong> App catches error gracefully, shows error UI with reload/go back buttons, displays error details in dev mode
                </p>
              </div>
            </div>

            {/* Test 3: Logout Functionality */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">3. Improved Logout</h2>
                <p className="text-sm text-muted-foreground">
                  Test the enhanced logout with proper session clearing
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestLogout}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  disabled={!user || loading}
                >
                  Test Logout
                </Button>

                {!user && (
                  <Button
                    onClick={() => window.location.href = '/auth/sign-in'}
                    variant="primary"
                    size="sm"
                  >
                    Go to Sign In
                  </Button>
                )}
              </div>

              <div className="bg-muted rounded p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Expected:</strong> Clears all cookies, clears auth state, redirects to home page, shows loading state during logout
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                size="sm"
              >
                Back to Dashboard
              </Button>

              <Button
                onClick={() => window.location.href = '/profile'}
                variant="outline"
                size="sm"
              >
                Go to Profile
              </Button>
            </div>
          </div>
        </div>
      </AppContainer>
    </div>
  )
}
