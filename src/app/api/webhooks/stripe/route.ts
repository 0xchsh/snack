import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { constructWebhookEvent } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PurchaseManager } from '@/lib/purchases'
import { calculatePricing } from '@/lib/pricing'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * Important events:
 * - checkout.session.completed: User completed checkout
 * - payment_intent.succeeded: Payment was successful
 * - payment_intent.payment_failed: Payment failed
 * - account.updated: Stripe Connect account status changed
 * - charge.refunded: Payment was refunded
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      throw ApiErrors.validationError('Missing stripe-signature header')
    }

    // Verify webhook signature and construct event
    const event = constructWebhookEvent(body, signature)

    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return createSuccessResponse({ received: true }, 200)
  } catch (error) {
    console.error('Webhook error:', error)
    return createErrorResponse(error, '/api/webhooks/stripe')
  }
}

/**
 * Handle checkout.session.completed event
 * This is fired when a user completes the checkout flow
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id)

  // Extract metadata
  const listId = session.metadata?.list_id
  const buyerId = session.metadata?.buyer_id

  if (!listId || !buyerId) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  // Payment intent should be attached to the session
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  if (!paymentIntentId) {
    console.error('No payment intent in checkout session:', session.id)
    return
  }

  // We'll create the purchase record when payment_intent.succeeded fires
  // This is just a log for now
  console.log(`Checkout completed for list ${listId} by user ${buyerId}`)
}

/**
 * Handle payment_intent.succeeded event
 * This is when we actually create the purchase record
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  const supabase = await createServerSupabaseClient()

  // Extract metadata
  const listId = paymentIntent.metadata?.list_id
  const buyerId = paymentIntent.metadata?.buyer_id

  if (!listId || !buyerId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id)
    return
  }

  // Get charge details
  const chargeId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id

  // Calculate pricing breakdown
  const amountCents = paymentIntent.amount
  const pricing = calculatePricing(amountCents)

  // Check if purchase already exists (idempotency)
  const { data: existingPurchase } = await supabase
    .from('list_purchases')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle()

  if (existingPurchase) {
    console.log('Purchase already exists for payment intent:', paymentIntent.id)
    return
  }

  // Create purchase record
  const { error: purchaseError } = await PurchaseManager.createPurchase({
    user_id: buyerId,
    list_id: listId,
    amount_paid: amountCents,
    currency: paymentIntent.currency as any,
    platform_fee: pricing.platform_fee,
    creator_earnings: pricing.creator_earnings,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: chargeId || null,
    stripe_receipt_url: (paymentIntent as any).charges?.data?.[0]?.receipt_url || null,
  })

  if (purchaseError) {
    console.error('Error creating purchase record:', purchaseError)
    throw purchaseError
  }

  console.log(`Purchase created for list ${listId} by user ${buyerId}`)
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)

  // You could send an email notification to the user here
  // or log this for analytics
}

/**
 * Handle account.updated event
 * Updates the local Stripe account status
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Account updated:', account.id)

  const supabase = await createServerSupabaseClient()

  // Determine status
  const canReceivePayments =
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true

  const status = canReceivePayments ? 'active' : 'pending'

  // Update user record
  const { error } = await supabase
    .from('users')
    .update({ stripe_account_status: status })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Error updating account status:', error)
  } else {
    console.log(`Updated account ${account.id} status to ${status}`)
  }
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id)

  const supabase = await createServerSupabaseClient()

  // Find the purchase by charge ID
  const { data: purchase } = await supabase
    .from('list_purchases')
    .select('id')
    .eq('stripe_charge_id', charge.id)
    .maybeSingle()

  if (!purchase) {
    console.error('No purchase found for refunded charge:', charge.id)
    return
  }

  // Mark as refunded
  const { error } = await PurchaseManager.refundPurchase(
    purchase.id,
    'Refunded via Stripe dashboard'
  )

  if (error) {
    console.error('Error marking purchase as refunded:', error)
  } else {
    console.log(`Marked purchase ${purchase.id} as refunded`)
  }
}

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs'
