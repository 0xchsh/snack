'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Lock, Unlock } from 'lucide-react'
import { Button } from './ui/button'
import { formatCurrency, parseCurrencyToCents, validatePrice, isListFree } from '@/lib/pricing'
import type { Currency } from '@/types'

interface ListPricingSettingsProps {
  listId: string
  initialPriceCents: number | null
  initialCurrency: Currency
  onPriceUpdate?: (priceCents: number | null, currency: Currency) => void
}

export function ListPricingSettings({
  listId,
  initialPriceCents,
  initialCurrency,
  onPriceUpdate,
}: ListPricingSettingsProps) {
  const [isPaid, setIsPaid] = useState(!isListFree(initialPriceCents))
  const [priceInput, setPriceInput] = useState(
    initialPriceCents ? formatCurrency(initialPriceCents, initialCurrency).replace('$', '') : '4.99'
  )
  const [currency] = useState<Currency>(initialCurrency)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleTogglePaid = () => {
    setIsPaid(!isPaid)
    setError('')
  }

  const handlePriceChange = (value: string) => {
    setPriceInput(value)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      let priceCents: number | null = null

      if (isPaid) {
        // Parse the price
        priceCents = parseCurrencyToCents(priceInput)

        if (priceCents === null) {
          setError('Please enter a valid price')
          setSaving(false)
          return
        }

        // Validate the price
        const validation = validatePrice(priceCents)
        if (!validation.valid) {
          setError(validation.error || 'Invalid price')
          setSaving(false)
          return
        }
      }

      // Update the list
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_cents: priceCents,
          currency: currency,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update pricing')
      }

      // Notify parent component
      if (onPriceUpdate) {
        onPriceUpdate(priceCents, currency)
      }
    } catch (err: any) {
      console.error('Error saving price:', err)
      setError(err.message || 'Failed to save price')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base mb-1">List Pricing</h3>
          <p className="text-sm text-muted-foreground">
            {isPaid ? 'Users must purchase to access this list' : 'This list is free to view'}
          </p>
        </div>
        <Button
          variant={isPaid ? 'primary' : 'outline'}
          size="sm"
          onClick={handleTogglePaid}
          className="flex items-center gap-2"
        >
          {isPaid ? (
            <>
              <Lock className="w-4 h-4" />
              Paid
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              Free
            </>
          )}
        </Button>
      </div>

      {isPaid && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Price <span className="text-muted-foreground">(USD)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={priceInput}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="4.99"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              Minimum: $0.99 • Maximum: $999.00
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Pricing'}
          </Button>

          <div className="bg-accent/50 rounded-md p-3 text-sm">
            <p className="font-medium mb-1">You'll earn:</p>
            <p className="text-muted-foreground">
              {priceInput && parseCurrencyToCents(priceInput) ? (
                <>
                  {formatCurrency(
                    Math.round(parseCurrencyToCents(priceInput)! * 0.8),
                    currency
                  )}{' '}
                  per purchase
                </>
              ) : (
                'Enter a price to see earnings'
              )}
            </p>
          </div>
        </div>
      )}

      {!isPaid && (
        <div className="bg-accent/50 rounded-md p-3 text-sm text-center text-muted-foreground">
          This list is free. Anyone can view all links.
        </div>
      )}
    </div>
  )
}
