'use client'

import { useRouter } from 'next/navigation'
import { XCircleIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { useAuth } from '@/hooks/useAuth'

export default function PurchaseCancelledPage() {
  const router = useRouter()
  const { user } = useAuth()

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
                    'px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors',
                },
              ]
            : [
                {
                  type: 'custom',
                  label: 'Sign In',
                  onClick: () => router.push('/auth/sign-in'),
                  className:
                    'px-4 py-2 text-base font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors',
                },
              ]
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          {/* Cancelled Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <XCircleIcon className="w-12 h-12 text-orange-600 dark:text-orange-500" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold mb-3">Purchase Cancelled</h1>
          <p className="text-muted-foreground text-lg mb-8">
            No worries! You can try again anytime.
          </p>

          {/* Details */}
          <div className="bg-accent/50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-3">What happened?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your payment was cancelled and you were not charged. The list remains locked until
              you complete a purchase.
            </p>
            <h2 className="font-semibold mb-3">Want to try again?</h2>
            <p className="text-sm text-muted-foreground">
              You can return to the list and click the purchase button to try again. Your payment
              information is secure with Stripe.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.back()} className="flex items-center gap-2" size="lg">
              <ArrowPathIcon className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              variant="outline"
              size="lg"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Having issues?{' '}
          <a href="mailto:support@snack.app" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
