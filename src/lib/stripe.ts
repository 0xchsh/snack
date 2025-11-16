import Stripe from 'stripe'
import { PLATFORM_FEE_PERCENTAGE } from './pricing'

/**
 * Server-side Stripe instance
 * Only use this in API routes and server components
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY environment variable. Please add it to your .env.local file.'
    )
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia', // Use latest API version
    typescript: true,
    appInfo: {
      name: 'Snack',
      version: '1.0.0',
      url: 'https://snack.app', // Update with your domain
    },
  })
}

/**
 * Stripe configuration
 */
export const STRIPE_CONFIG = {
  // Connect configuration
  connect: {
    // Stripe Connect account type (standard or express)
    // Standard: Full Stripe dashboard access for creators
    // Express: Simplified onboarding, limited dashboard
    accountType: 'express' as const,

    // Capabilities creators need
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },

    // Business type
    businessType: 'individual' as const,
  },

  // Checkout configuration
  checkout: {
    // Payment methods to accept
    paymentMethodTypes: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],

    // Checkout mode
    mode: 'payment' as const, // One-time payment

    // Success/cancel URLs (will be dynamic per request)
    successUrl: '/purchase/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: '/purchase/cancelled',
  },

  // Webhook configuration
  webhook: {
    // Events to listen for
    events: [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'account.updated', // Stripe Connect account changes
      'charge.refunded',
    ] as const,
  },
} as const

/**
 * Calculate Stripe application fee
 * This is the platform's cut when using Stripe Connect
 *
 * @param amountCents - Total amount in cents
 * @returns Application fee in cents
 */
export function calculateStripeFee(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
}

/**
 * Create Stripe Checkout Session for list purchase
 */
export async function createCheckoutSession(params: {
  listId: string
  listTitle: string
  amountCents: number
  currency: string
  creatorStripeAccountId: string
  buyerId: string
  successUrl: string
  cancelUrl: string
  creatorUsername?: string
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const applicationFee = calculateStripeFee(params.amountCents)

  // Generate statement descriptor suffix from creator username
  // Stripe requires: max 22 chars, only letters/numbers/spaces/dashes
  const statementDescriptorSuffix = params.creatorUsername
    ? params.creatorUsername
        .substring(0, 22)
        .toUpperCase()
        .replace(/[^A-Z0-9 -]/g, '')
        .trim()
    : undefined

  const session = await stripe.checkout.sessions.create({
    mode: STRIPE_CONFIG.checkout.mode,
    payment_method_types: STRIPE_CONFIG.checkout.paymentMethodTypes,
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: {
            name: params.listTitle,
            description: `One-time access to "${params.listTitle}"`,
            metadata: {
              list_id: params.listId,
              type: 'list_purchase',
            },
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.buyerId,
    metadata: {
      list_id: params.listId,
      buyer_id: params.buyerId,
      type: 'list_purchase',
    },
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: params.creatorStripeAccountId,
      },
      statement_descriptor: 'SNACK',
      statement_descriptor_suffix: statementDescriptorSuffix,
      metadata: {
        list_id: params.listId,
        buyer_id: params.buyerId,
        type: 'list_purchase',
      },
    },
  })

  return session
}

/**
 * Create Stripe Connect Account for creator
 */
export async function createConnectAccount(params: {
  email: string
  userId: string
}): Promise<Stripe.Account> {
  const stripe = getStripe()

  const account = await stripe.accounts.create({
    type: STRIPE_CONFIG.connect.accountType,
    email: params.email,
    capabilities: STRIPE_CONFIG.connect.capabilities,
    business_type: STRIPE_CONFIG.connect.businessType,
    metadata: {
      user_id: params.userId,
    },
  })

  return account
}

/**
 * Create Stripe Connect Account Link for onboarding
 */
export async function createAccountLink(params: {
  accountId: string
  refreshUrl: string
  returnUrl: string
}): Promise<Stripe.AccountLink> {
  const stripe = getStripe()

  const accountLink = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  })

  return accountLink
}

/**
 * Get Stripe Connect account details
 */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account> {
  const stripe = getStripe()
  return await stripe.accounts.retrieve(accountId)
}

/**
 * Check if Stripe Connect account can receive payments
 */
export async function canAccountReceivePayments(accountId: string): Promise<boolean> {
  const account = await getConnectAccount(accountId)

  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true
  )
}

/**
 * Create payout to creator
 */
export async function createPayout(params: {
  accountId: string
  amountCents: number
  currency: string
}): Promise<Stripe.Payout> {
  const stripe = getStripe()

  const payout = await stripe.payouts.create(
    {
      amount: params.amountCents,
      currency: params.currency,
    },
    {
      stripeAccount: params.accountId,
    }
  )

  return payout
}

/**
 * Retrieve checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  return await stripe.checkout.sessions.retrieve(sessionId)
}

/**
 * Retrieve payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * Construct webhook event from request
 * Verifies the webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Create refund
 */
export async function createRefund(params: {
  paymentIntentId: string
  reason?: string
}): Promise<Stripe.Refund> {
  const stripe = getStripe()

  return await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    reason: params.reason as Stripe.RefundCreateParams.Reason,
  })
}
