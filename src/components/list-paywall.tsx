'use client'

import { useState } from 'react'
import { LockClosedIcon, LinkIcon, ShieldCheckIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/pricing'
import type { Currency } from '@/types'
import { Button, Spinner } from './ui'
import { useToast } from './toast/toast-provider'

interface ListPaywallProps {
  listId: string
  title: string
  emoji: string | null
  priceCents: number
  currency: Currency
  creatorName: string
  linkCount?: number
}

export function ListPaywall({
  listId,
  title,
  emoji,
  priceCents,
  currency,
  creatorName,
  linkCount,
}: ListPaywallProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

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

        if (response.status === 401) {
          router.push('/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
          return
        }

        toast.error(errorData.error || 'Failed to create checkout session. Please try again.')
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No checkout URL in response:', data)
        toast.error('Failed to create checkout session. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const price = formatCurrency(priceCents, currency)

  return (
    <div className="flex flex-col items-center py-12 px-4">
      <div className="max-w-sm w-full">
        {/* Card */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-5 shadow-lg">
          {/* Lock + info */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <LockClosedIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                This is a paid list
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Purchase to unlock{linkCount ? ` all ${linkCount} links` : ' all links'}
              </p>
            </div>
          </div>

          {/* Price row */}
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight">{price}</span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-full">one-time</span>
          </div>

          {/* Purchase button */}
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Redirecting to checkout...
              </>
            ) : (
              `Purchase for ${price}`
            )}
          </Button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Secure checkout via Stripe</span>
          </div>
        </div>
      </div>
    </div>
  )
}
