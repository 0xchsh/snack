'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/pricing'
import type { Currency } from '@/types'
import { Button } from './ui/button'

interface ListPaywallProps {
  listId: string
  title: string
  emoji: string | null
  priceCents: number
  currency: Currency
  creatorName: string
}

export function ListPaywall({
  listId,
  title,
  emoji,
  priceCents,
  currency,
  creatorName,
}: ListPaywallProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePurchase = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/lists/${listId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Checkout error:', errorData)

        // Handle specific error cases
        if (response.status === 401) {
          // Not logged in - redirect to sign in
          router.push('/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
          return
        }

        alert(errorData.error || 'Failed to create checkout session. Please try again.')
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No checkout URL in response:', data)
        alert('Failed to create checkout session. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-3 flex items-center justify-center gap-2">
            {emoji && <span className="text-3xl">{emoji}</span>}
            <span>Unlock {title}</span>
          </h2>
          <p className="text-muted-foreground text-base mb-6">
            Purchase this list from {creatorName} to access all links
          </p>

          {/* Price */}
          <div className="bg-accent/50 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold mb-2">
              {formatCurrency(priceCents, currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              One-time payment • Lifetime access
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading checkout...
            </>
          ) : (
            <>
              Purchase for {formatCurrency(priceCents, currency)}
            </>
          )}
        </Button>

        {/* Trust Signals */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure payment powered by Stripe</p>
          <p className="mt-2">Cancel anytime before completing payment</p>
        </div>
      </div>
    </div>
  )
}
