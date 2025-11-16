import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getConnectAccount, canAccountReceivePayments } from '@/lib/stripe'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/stripe/connect/status
 * Check Stripe Connect account status for authenticated user
 *
 * Returns:
 * - connected: boolean (has Stripe account)
 * - onboarding_complete: boolean (can receive payments)
 * - account_id: string | null
 * - charges_enabled: boolean
 * - payouts_enabled: boolean
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await checkRateLimit(request, 'api')

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw ApiErrors.unauthorized()
    }

    // Get user's Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw ApiErrors.databaseError('fetch user profile', profileError.message)
    }

    // If no Stripe account, return not connected status
    if (!profile.stripe_account_id) {
      return createSuccessResponse({
        connected: false,
        onboarding_complete: false,
        account_id: null,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      })
    }

    // Get account details from Stripe
    const account = await getConnectAccount(profile.stripe_account_id)
    const canReceivePayments = await canAccountReceivePayments(profile.stripe_account_id)

    // Update local status if different
    const newStatus = canReceivePayments ? 'active' : 'pending'
    if (newStatus !== profile.stripe_account_status) {
      await supabase
        .from('users')
        .update({ stripe_account_status: newStatus })
        .eq('id', user.id)
    }

    return createSuccessResponse({
      connected: true,
      onboarding_complete: canReceivePayments,
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    })
  } catch (error) {
    return createErrorResponse(error, '/api/stripe/connect/status')
  }
}
