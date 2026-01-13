'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/solid'
import { Button } from './ui/button'

interface StripeConnectButtonProps {
  variant?: 'primary' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function StripeConnectButton({
  variant = 'primary',
  size = 'default',
  className,
}: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [status, setStatus] = useState<{
    connected: boolean
    onboarding_complete: boolean
  }>({
    connected: false,
    onboarding_complete: false,
  })

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()

      if (data.success && data.data) {
        setStatus({
          connected: data.data.connected,
          onboarding_complete: data.data.onboarding_complete,
        })
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Onboarding error:', errorData)
        alert(errorData.error || 'Failed to start onboarding. Please try again.')
        setLoading(false)
        return
      }

      const data = await response.json()

      // Redirect to Stripe Connect onboarding
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No onboarding URL in response:', data)
        alert('Failed to start onboarding. Please try again.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
        Checking status...
      </Button>
    )
  }

  if (status.onboarding_complete) {
    return (
      <Button variant="outline" size={size} className={className} disabled>
        <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
        Stripe Connected
      </Button>
    )
  }

  if (status.connected && !status.onboarding_complete) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={className}
        onClick={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <>
            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-orange-600" />
            Complete Stripe Setup
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? (
        <>
          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCardIcon className="w-4 h-4 mr-2" />
          Connect Stripe
        </>
      )}
    </Button>
  )
}
