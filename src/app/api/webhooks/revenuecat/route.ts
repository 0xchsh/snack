import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PurchaseManager } from '@/lib/purchases'
import { calculatePricing } from '@/lib/pricing'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'

// RevenueCat webhook event types
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'

interface RevenueCatWebhookEvent {
  api_version: string
  event: {
    type: RevenueCatEventType
    id: string
    app_user_id: string
    product_id: string
    entitlement_ids?: string[]
    original_app_user_id: string
    presented_offering_id?: string
    period_type?: string
    purchased_at_ms: number
    expiration_at_ms?: number
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL'
    environment: 'PRODUCTION' | 'SANDBOX'
    is_family_share?: boolean
    country_code?: string
    currency?: string
    price?: number
    price_in_purchased_currency?: number
    subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>
    transaction_id?: string
    original_transaction_id?: string
    takehome_percentage?: number
  }
}

// RevenueCat webhook authorization token (set in RevenueCat dashboard)
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET

/**
 * POST /api/webhooks/revenuecat
 * Handle RevenueCat webhook events for mobile IAP
 *
 * Important events:
 * - INITIAL_PURCHASE: User made first purchase (one-time or subscription)
 * - NON_RENEWING_PURCHASE: User made a consumable purchase (our use case)
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: User cancelled subscription
 * - EXPIRATION: Subscription expired
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (REVENUECAT_WEBHOOK_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
        console.error('RevenueCat webhook: Invalid authorization')
        throw ApiErrors.unauthorized('Invalid webhook authorization')
      }
    }

    // Parse the webhook payload
    const payload: RevenueCatWebhookEvent = await request.json()
    const event = payload.event

    console.log(`RevenueCat webhook received: ${event.type}`, {
      eventId: event.id,
      userId: event.app_user_id,
      productId: event.product_id,
      store: event.store,
      environment: event.environment,
    })

    // Only process production events (or sandbox in development)
    if (event.environment !== 'PRODUCTION' && process.env.NODE_ENV === 'production') {
      console.log('Skipping sandbox event in production')
      return createSuccessResponse({ received: true, skipped: 'sandbox' }, 200)
    }

    // Handle the event based on type
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
        await handlePurchase(event)
        break

      case 'RENEWAL':
        // For subscription renewals - not used for one-time list purchases
        console.log('Subscription renewal:', event.id)
        break

      case 'CANCELLATION':
        // User cancelled - for subscriptions only
        console.log('Subscription cancelled:', event.id)
        break

      case 'EXPIRATION':
        // Subscription expired - not applicable for one-time purchases
        console.log('Subscription expired:', event.id)
        break

      case 'BILLING_ISSUE':
        console.error('Billing issue:', event.id, event.app_user_id)
        break

      default:
        console.log(`Unhandled RevenueCat event type: ${event.type}`)
    }

    return createSuccessResponse({ received: true }, 200)
  } catch (error) {
    console.error('RevenueCat webhook error:', error)
    return createErrorResponse(error, '/api/webhooks/revenuecat')
  }
}

/**
 * Handle INITIAL_PURCHASE or NON_RENEWING_PURCHASE event
 * Creates a purchase record in the database
 */
async function handlePurchase(event: RevenueCatWebhookEvent['event']) {
  console.log('Processing purchase:', {
    eventId: event.id,
    userId: event.app_user_id,
    productId: event.product_id,
    transactionId: event.transaction_id,
  })

  const supabase = await createServerSupabaseClient()

  // Extract list ID from subscriber attributes or product ID
  // Convention: list_id is stored in subscriber attributes when purchase is initiated
  const listId = event.subscriber_attributes?.list_id?.value

  if (!listId) {
    console.error('No list_id in subscriber attributes:', event.id)
    // Try to extract from product metadata or entitlements
    // For now, log and skip
    return
  }

  const userId = event.app_user_id

  // Verify the user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (userError || !user) {
    console.error('User not found for purchase:', userId, userError)
    return
  }

  // Check if purchase already exists (idempotency using transaction_id)
  const transactionId = event.transaction_id || event.id

  const { data: existingPurchase } = await supabase
    .from('list_purchases')
    .select('id')
    .eq('stripe_payment_intent_id', `rc_${transactionId}`)
    .maybeSingle()

  if (existingPurchase) {
    console.log('Purchase already exists for transaction:', transactionId)
    return
  }

  // Calculate amount and pricing
  // RevenueCat provides price in cents/smallest currency unit
  const amountCents = event.price_in_purchased_currency
    ? Math.round(event.price_in_purchased_currency * 100)
    : event.price
    ? Math.round(event.price * 100)
    : 0

  if (amountCents === 0) {
    console.error('No price information in event:', event.id)
    return
  }

  // Calculate pricing breakdown (20% platform fee)
  const pricing = calculatePricing(amountCents)

  // Adjust for Apple/Google's take - RevenueCat provides takehome_percentage
  // If Apple takes 30%, creator only gets 70% of their usual share
  const takehomePercentage = event.takehome_percentage ?? 0.7 // Default 70% (after 30% store fee)
  const adjustedCreatorEarnings = Math.round(pricing.creator_earnings * takehomePercentage)
  const adjustedPlatformFee = amountCents - adjustedCreatorEarnings

  // Create purchase record
  const { error: purchaseError } = await PurchaseManager.createPurchase({
    user_id: userId,
    list_id: listId,
    amount_paid: amountCents,
    currency: (event.currency?.toLowerCase() || 'usd') as any,
    platform_fee: adjustedPlatformFee,
    creator_earnings: adjustedCreatorEarnings,
    stripe_payment_intent_id: `rc_${transactionId}`, // Prefix to distinguish from Stripe
    stripe_charge_id: event.original_transaction_id || null,
    stripe_receipt_url: null, // RevenueCat doesn't provide receipt URLs
  })

  if (purchaseError) {
    console.error('Error creating purchase record:', purchaseError)
    throw purchaseError
  }

  console.log(`RevenueCat purchase created for list ${listId} by user ${userId}`, {
    amountCents,
    creatorEarnings: adjustedCreatorEarnings,
    platformFee: adjustedPlatformFee,
    takehomePercentage,
  })
}

// Ensure raw body parsing is available
export const runtime = 'nodejs'
