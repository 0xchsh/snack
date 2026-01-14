'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircleIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { useAuth } from '@/hooks/useAuth'

function PurchaseSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [purchaseData, setPurchaseData] = useState<{
    listTitle: string
    listId: string
    username: string
    amount: string
  } | null>(null)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }

    const verifyPurchase = async () => {
      try {
        // In a real implementation, you'd verify the session
        // For now, we'll just show success
        // You could add an API endpoint to fetch purchase details by session ID
        setLoading(false)
      } catch (error) {
        console.error('Error verifying purchase:', error)
        setLoading(false)
      }
    }

    verifyPurchase()
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        logoHref={user ? '/dashboard' : '/'}
        username={user?.username || ''}
        buttons={
          user
            ? [
                {
                  type: 'custom',
                  label: 'Dashboard',
                  onClick: () => router.push('/dashboard'),
                  className:
                    'px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors',
                },
              ]
            : [
                {
                  type: 'custom',
                  label: 'Sign In',
                  onClick: () => router.push('/auth/sign-in'),
                  className:
                    'px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors',
                },
              ]
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-500" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold mb-3">Purchase Successful!</h1>
          <p className="text-muted-foreground text-lg mb-8">
            You now have lifetime access to this list
          </p>

          {/* Details */}
          <div className="bg-accent/50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">What's next?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 text-green-600" />
                <span>You can access all links in this list anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 text-green-600" />
                <span>Your purchase is saved to your account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 text-green-600" />
                <span>A receipt has been sent to your email</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
              size="lg"
            >
              Go to Dashboard
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
            <Button onClick={() => router.back()} variant="outline" size="lg">
              View List
            </Button>
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help?{' '}
          <a href="mailto:support@snack.app" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  )
}
