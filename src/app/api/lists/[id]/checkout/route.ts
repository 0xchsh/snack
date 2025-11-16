import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createCheckoutSession } from '@/lib/stripe'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { PurchaseManager } from '@/lib/purchases'
import { isListFree } from '@/lib/pricing'

/**
 * POST /api/lists/[id]/checkout
 * Create Stripe Checkout session for purchasing a list
 *
 * Body (optional):
 * - success_url: string (custom success URL)
 * - cancel_url: string (custom cancel URL)
 *
 * Returns:
 * - session_id: Stripe Checkout session ID
 * - url: Stripe Checkout URL to redirect user to
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await checkRateLimit(request, 'write')

    const listId = params.id

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw ApiErrors.unauthorized('You must be logged in to purchase a list')
    }

    // Get list details with creator info
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, title, price_cents, currency, user_id, is_public, users!inner(stripe_account_id, username)')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      throw ApiErrors.notFound('List not found')
    }

    // Check if list is public
    if (!list.is_public) {
      throw ApiErrors.forbidden('This list is not available for purchase')
    }

    // Check if list is free
    if (isListFree(list.price_cents)) {
      throw ApiErrors.validationError('This list is free and does not require purchase')
    }

    // Check if user already purchased this list
    const hasPurchased = await PurchaseManager.hasPurchased(user.id, listId)
    if (hasPurchased) {
      throw ApiErrors.validationError('You have already purchased this list')
    }

    // Check if user is trying to buy their own list
    if (list.user_id === user.id) {
      throw ApiErrors.validationError('You cannot purchase your own list')
    }

    // Get creator's Stripe account and username
    const creatorStripeAccountId = (list.users as any).stripe_account_id
    const creatorUsername = (list.users as any).username

    if (!creatorStripeAccountId) {
      throw ApiErrors.validationError(
        'This creator has not set up payments yet. Please contact the creator.'
      )
    }

    // Parse request body for custom URLs (optional)
    const body = await request.json().catch(() => ({}))
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    const successUrl = body.success_url || `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = body.cancel_url || `${baseUrl}/${list.user_id}/${listId}?purchase=cancelled`

    // Create Stripe Checkout session
    const session = await createCheckoutSession({
      listId: list.id,
      listTitle: list.title,
      amountCents: list.price_cents!,
      currency: list.currency || 'usd',
      creatorStripeAccountId,
      buyerId: user.id,
      successUrl,
      cancelUrl,
      creatorUsername,
    })

    return createSuccessResponse(
      {
        session_id: session.id,
        url: session.url,
      },
      200,
      'Checkout session created successfully'
    )
  } catch (error) {
    return createErrorResponse(error, '/api/lists/[id]/checkout')
  }
}
