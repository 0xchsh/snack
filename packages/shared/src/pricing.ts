import type { Currency, PricingBreakdown } from './types'

/**
 * Pricing Configuration
 */

// Platform fee percentage (20%)
export const PLATFORM_FEE_PERCENTAGE = 0.20

// Minimum price in cents ($0.99)
export const MIN_PRICE_CENTS = 99

// Maximum price in cents ($999.00)
export const MAX_PRICE_CENTS = 99900

// Minimum payout amount in cents ($10.00)
export const MIN_PAYOUT_AMOUNT_CENTS = 1000

/**
 * Currency Configuration
 */
export const CURRENCIES: Record<Currency, { symbol: string; name: string; decimals: number }> = {
  usd: { symbol: '$', name: 'US Dollar', decimals: 2 },
  eur: { symbol: '\u20ac', name: 'Euro', decimals: 2 },
  gbp: { symbol: '\u00a3', name: 'British Pound', decimals: 2 },
  cad: { symbol: 'CA$', name: 'Canadian Dollar', decimals: 2 },
  aud: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  jpy: { symbol: '\u00a5', name: 'Japanese Yen', decimals: 0 },
  inr: { symbol: '\u20b9', name: 'Indian Rupee', decimals: 2 },
}

/**
 * Calculate platform fee and creator earnings
 */
export function calculatePricing(amountCents: number): PricingBreakdown {
  const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
  const creatorEarnings = amountCents - platformFee

  return {
    amount_cents: amountCents,
    platform_fee: platformFee,
    creator_earnings: creatorEarnings,
    platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
  }
}

/**
 * Validate price
 */
export interface PriceValidationResult {
  valid: boolean
  error?: string
}

export function validatePrice(priceCents: number | null): PriceValidationResult {
  // Null or 0 means free - always valid
  if (priceCents === null || priceCents === 0) {
    return { valid: true }
  }

  // Must be a number
  if (typeof priceCents !== 'number' || isNaN(priceCents)) {
    return { valid: false, error: 'Price must be a number' }
  }

  // Must be an integer (cents)
  if (!Number.isInteger(priceCents)) {
    return { valid: false, error: 'Price must be in cents (whole number)' }
  }

  // Must be positive
  if (priceCents < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }

  // Check minimum
  if (priceCents > 0 && priceCents < MIN_PRICE_CENTS) {
    return {
      valid: false,
      error: `Price must be at least ${formatCurrency(MIN_PRICE_CENTS, 'usd')}`,
    }
  }

  // Check maximum
  if (priceCents > MAX_PRICE_CENTS) {
    return {
      valid: false,
      error: `Price cannot exceed ${formatCurrency(MAX_PRICE_CENTS, 'usd')}`,
    }
  }

  return { valid: true }
}

/**
 * Validate currency
 */
export function validateCurrency(currency: string): currency is Currency {
  return currency in CURRENCIES
}

/**
 * Validate payout amount
 */
export function validatePayoutAmount(amountCents: number, availableBalance: number): PriceValidationResult {
  if (typeof amountCents !== 'number' || isNaN(amountCents)) {
    return { valid: false, error: 'Amount must be a number' }
  }

  if (!Number.isInteger(amountCents)) {
    return { valid: false, error: 'Amount must be in cents (whole number)' }
  }

  if (amountCents <= 0) {
    return { valid: false, error: 'Amount must be positive' }
  }

  if (amountCents < MIN_PAYOUT_AMOUNT_CENTS) {
    return {
      valid: false,
      error: `Minimum payout amount is ${formatCurrency(MIN_PAYOUT_AMOUNT_CENTS, 'usd')}`,
    }
  }

  if (amountCents > availableBalance) {
    return { valid: false, error: 'Amount exceeds available balance' }
  }

  return { valid: true }
}

/**
 * Format currency amount
 *
 * @param amountCents - Amount in cents
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$4.99", "\u20ac10.00", "\u00a51000")
 */
export function formatCurrency(amountCents: number, currency: Currency = 'usd'): string {
  const config = CURRENCIES[currency]
  const amount = amountCents / 100 // Convert cents to dollars

  // For currencies without decimals (like JPY), don't show decimal places
  if (config.decimals === 0) {
    return `${config.symbol}${Math.round(amount).toLocaleString()}`
  }

  return `${config.symbol}${amount.toFixed(config.decimals)}`
}

/**
 * Parse currency string to cents
 *
 * @param value - String like "$4.99" or "4.99" or "499" (cents)
 * @returns Amount in cents, or null if invalid
 */
export function parseCurrencyToCents(value: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[$\u20ac\u00a3\u00a5\u20b9\s,]/g, '')

  // If empty, return null
  if (!cleaned) return null

  // Try to parse as number
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null

  // If the number is small (< 1000), assume it's in dollars and convert to cents
  // If the number is large (>= 1000), assume it's already in cents
  if (num < 1000) {
    return Math.round(num * 100)
  }

  return Math.round(num)
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Check if list is free
 */
export function isListFree(priceCents: number | null | undefined): boolean {
  return priceCents === null || priceCents === undefined || priceCents === 0
}

/**
 * Check if list is paid
 */
export function isListPaid(priceCents: number | null | undefined): boolean {
  return !isListFree(priceCents)
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currency: Currency) {
  return CURRENCIES[currency]
}

/**
 * Format price for display
 * Shows "Free" for free lists, formatted price for paid lists
 */
export function formatListPrice(priceCents: number | null | undefined, currency: Currency = 'usd'): string {
  if (isListFree(priceCents)) {
    return 'Free'
  }
  return formatCurrency(priceCents!, currency)
}

/**
 * Calculate estimated earnings after platform fee
 */
export function calculateEstimatedEarnings(priceCents: number): string {
  const breakdown = calculatePricing(priceCents)
  return `~${formatCurrency(breakdown.creator_earnings, 'usd')} after ${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% platform fee`
}
