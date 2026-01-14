'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CurrencyDollarIcon, ShoppingCartIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { StripeConnectButton } from '@/components/stripe-connect-button'
import { formatCurrency } from '@/lib/pricing'
import type { Currency } from '@/types'

interface EarningsData {
  total_earnings: number
  total_purchases: number
  currency: Currency
}

interface ListEarning {
  list_id: string
  list_title: string
  total_purchases: number
  total_earnings: number
  currency: Currency
}

export default function EarningsDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [listEarnings, setListEarnings] = useState<ListEarning[]>([])
  const [stripeConnected, setStripeConnected] = useState(false)
  const [checkingStripe, setCheckingStripe] = useState(true)

  // Check for success/refresh params from Stripe onboarding
  const onboardingSuccess = searchParams.get('success') === 'true'
  const onboardingRefresh = searchParams.get('refresh') === 'true'

  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }

    checkStripeStatus()
    fetchEarnings()
  }, [user, router])

  const checkStripeStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()

      if (data.success && data.data) {
        setStripeConnected(data.data.onboarding_complete)
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
    } finally {
      setCheckingStripe(false)
    }
  }

  const fetchEarnings = async () => {
    try {
      setLoading(true)

      // Fetch total earnings
      // Note: You'd need to create these API endpoints
      // For now, we'll use placeholder data
      setEarningsData({
        total_earnings: 0,
        total_purchases: 0,
        currency: 'usd',
      })

      setListEarnings([])
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || checkingStripe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earnings</h1>
          <p className="text-muted-foreground">Track your sales and manage payouts</p>
        </div>

        {/* Stripe Connection Banner */}
        {!stripeConnected && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  Connect Stripe to receive payments
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                  You need to connect your Stripe account before you can sell lists and receive payments.
                </p>
                <StripeConnectButton />
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Success Message */}
        {onboardingSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
            <p className="text-green-800 dark:text-green-200">
              ✓ Stripe account connected successfully! You can now start selling lists.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <CurrencyDollarIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(earningsData?.total_earnings || 0, earningsData?.currency || 'usd')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
              <ShoppingCartIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{earningsData?.total_purchases || 0}</p>
          </div>
        </div>

        {/* Earnings by List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Earnings by List</h2>
          </div>

          {listEarnings.length > 0 ? (
            <div className="divide-y divide-border">
              {listEarnings.map((item) => (
                <div key={item.list_id} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.list_title}</h3>
                      <p className="text-sm text-muted-foreground">{item.total_purchases} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(item.total_earnings, item.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <CreditCardIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No sales yet</p>
              <p className="text-sm">
                {stripeConnected
                  ? 'Create paid lists to start earning'
                  : 'Connect Stripe to start selling lists'}
              </p>
            </div>
          )}
        </div>

        {/* Payout Info */}
        {stripeConnected && (
          <div className="mt-8 bg-accent/50 rounded-lg p-6">
            <h3 className="font-semibold mb-2">About Payouts</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Payments are automatically transferred to your Stripe account</li>
              <li>• Stripe handles payouts to your bank account on a rolling basis</li>
              <li>• You can manage payout settings in your Stripe Dashboard</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
