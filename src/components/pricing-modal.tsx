'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, GlobeAltIcon, LockClosedIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { StripeConnectButton } from './stripe-connect-button'
import { formatCurrency, parseCurrencyToCents, validatePrice, isListFree, PLATFORM_FEE_PERCENTAGE } from '@/lib/pricing'
import type { Currency } from '@/types'

const PRICE_PRESETS = [
  { label: '$1', cents: 100 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
] as const

type Visibility = 'public' | 'private'

interface PricingModalProps {
  listId: string
  initialPriceCents: number | null
  initialCurrency: Currency
  initialIsPublic: boolean
  isOpen: boolean
  onClose: () => void
  onUpdate?: (updates: { priceCents?: number | null; currency?: Currency; isPublic?: boolean }) => void
}

export function PricingModal({
  listId,
  initialPriceCents,
  initialCurrency,
  initialIsPublic,
  isOpen,
  onClose,
  onUpdate,
}: PricingModalProps) {
  const [visibility, setVisibility] = useState<Visibility>(initialIsPublic ? 'public' : 'private')
  const [isPaid, setIsPaid] = useState(!isListFree(initialPriceCents))
  const [priceInput, setPriceInput] = useState(
    initialPriceCents ? formatCurrency(initialPriceCents, initialCurrency).replace('$', '') : ''
  )
  const [isCustom, setIsCustom] = useState(false)
  const [currency] = useState<Currency>(initialCurrency)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Derived
  const initialIsPaid = !isListFree(initialPriceCents)
  const currentCents = isPaid ? parseCurrencyToCents(priceInput) : null
  const visibilityChanged = (visibility === 'public') !== initialIsPublic
  const pricingChanged = isPaid !== initialIsPaid || (isPaid && currentCents !== initialPriceCents)
  const hasChanges = visibilityChanged || pricingChanged

  // Check if current price matches a preset
  const activePreset = PRICE_PRESETS.find(p => p.cents === currentCents)

  useEffect(() => {
    if (isOpen) {
      setVisibility(initialIsPublic ? 'public' : 'private')
      const paid = !isListFree(initialPriceCents)
      setIsPaid(paid)
      const priceStr = initialPriceCents
        ? formatCurrency(initialPriceCents, initialCurrency).replace('$', '')
        : ''
      setPriceInput(priceStr)
      const matchesPreset = PRICE_PRESETS.some(p => p.cents === initialPriceCents)
      setIsCustom(paid && !matchesPreset && initialPriceCents !== null)
      setError('')
      setSaved(false)
    }
  }, [isOpen, initialPriceCents, initialCurrency, initialIsPublic])

  if (!isOpen) return null

  const handleModeChange = (paid: boolean) => {
    setIsPaid(paid)
    if (paid && !priceInput) {
      selectPreset(PRICE_PRESETS[0].cents)
    }
    setError('')
    setSaved(false)
  }

  const selectPreset = (cents: number) => {
    setIsCustom(false)
    setPriceInput(formatCurrency(cents, currency).replace('$', ''))
    setError('')
    setSaved(false)
  }

  const enableCustom = () => {
    setIsCustom(true)
    if (!currentCents || PRICE_PRESETS.some(p => p.cents === currentCents)) {
      setPriceInput('')
    }
    setError('')
    setSaved(false)
  }

  const handlePriceChange = (value: string) => {
    setPriceInput(value)
    setError('')
    setSaved(false)
  }

  const handleVisibilityChange = (v: Visibility) => {
    setVisibility(v)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      let priceCents: number | null = null

      if (isPaid) {
        priceCents = parseCurrencyToCents(priceInput)

        if (priceCents === null) {
          setError('Please enter a valid price')
          setSaving(false)
          return
        }

        const validation = validatePrice(priceCents)
        if (!validation.valid) {
          setError(validation.error || 'Invalid price')
          setSaving(false)
          return
        }
      }

      const body: Record<string, any> = {}
      if (pricingChanged) {
        body.price_cents = priceCents
        body.currency = currency
      }
      if (visibilityChanged) {
        body.is_public = visibility === 'public'
      }

      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save changes')
      }

      onUpdate?.({
        ...(pricingChanged && { priceCents, currency }),
        ...(visibilityChanged && { isPublic: visibility === 'public' }),
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Compute fee breakdown
  const computedPriceCents = currentCents
  const platformFee = computedPriceCents ? Math.round(computedPriceCents * PLATFORM_FEE_PERCENTAGE) : null
  const creatorEarnings = computedPriceCents && platformFee !== null ? computedPriceCents - platformFee : null

  const VISIBILITY_OPTIONS = [
    { value: 'public' as Visibility, label: 'Public', icon: GlobeAltIcon, desc: 'Anyone with the link can view' },
    { value: 'private' as Visibility, label: 'Private', icon: LockClosedIcon, desc: 'Only you can view' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-background border border-border rounded-xl w-full max-w-[400px] shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h2 className="text-base font-semibold">List Options</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-5 space-y-5">
          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Visibility
            </label>
            <div className="flex flex-col gap-2">
              {VISIBILITY_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isActive = visibility === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleVisibilityChange(opt.value)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'border border-border text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{opt.label}</p>
                      <p className={`text-xs leading-tight mt-0.5 ${isActive ? 'opacity-70' : 'text-muted-foreground'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Pricing
            </label>
            <div className="flex rounded-lg bg-secondary p-0.5">
              <button
                onClick={() => handleModeChange(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                  !isPaid
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => handleModeChange(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                  isPaid
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Paid content */}
          <AnimatePresence initial={false}>
            {isPaid && (
              <motion.div
                key="paid-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Price presets */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Price
                    </label>
                    <div className="flex gap-2">
                      {PRICE_PRESETS.map((preset) => (
                        <button
                          key={preset.cents}
                          onClick={() => selectPreset(preset.cents)}
                          className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-150 ${
                            !isCustom && activePreset?.cents === preset.cents
                              ? 'bg-foreground text-background'
                              : 'border border-border text-foreground hover:bg-secondary'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        onClick={enableCustom}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-150 ${
                          isCustom
                            ? 'bg-foreground text-background'
                            : 'border border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {/* Custom price input */}
                  {isCustom && (
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={priceInput}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="4.99"
                          autoFocus
                          className="w-full pl-7 pr-14 h-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background text-sm tabular-nums"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                          USD
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Must be between $1 and $1,000
                      </p>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  {/* Fee breakdown */}
                  {computedPriceCents && creatorEarnings !== null && platformFee !== null && (
                    <div className="rounded-lg border border-border divide-y divide-border text-sm">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">Price</span>
                        <span className="tabular-nums">{formatCurrency(computedPriceCents, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">Snack fee (20%)</span>
                        <span className="tabular-nums text-muted-foreground">-{formatCurrency(platformFee, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="font-medium">You earn</span>
                        <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full text-sm">
                          {formatCurrency(creatorEarnings, currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stripe Connect */}
                  <div className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Payouts</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Receive payments via Stripe
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <StripeConnectButton size="sm" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save */}
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
              className="w-full"
            >
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
