import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createConnectAccount, createAccountLink } from '@/lib/stripe'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/stripe/connect/onboard
 * Create or retrieve Stripe Connect account and generate onboarding link
 *
 * This endpoint:
 * 1. Checks if user already has a Stripe Connect account
 * 2. Creates new account if needed
 * 3. Generates onboarding link for user to complete setup
 * 4. Returns URL for user to complete Stripe onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await checkRateLimit(request, 'write')

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw ApiErrors.unauthorized()
    }

    // Get user's email and existing Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, stripe_account_id, stripe_account_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw ApiErrors.databaseError('fetch user profile', profileError.message)
    }

    if (!profile.email) {
      throw ApiErrors.validationError('Email is required to create a Stripe account')
    }

    let stripeAccountId = profile.stripe_account_id

    // Create Stripe Connect account if user doesn't have one
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: profile.email,
        userId: user.id,
      })

      stripeAccountId = account.id

      // Save Stripe account ID to database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: 'pending',
          stripe_connected_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw ApiErrors.databaseError('save Stripe account ID', updateError.message)
      }
    }

    // Create account link for onboarding
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    const accountLink = await createAccountLink({
      accountId: stripeAccountId,
      refreshUrl: `${baseUrl}/dashboard/earnings?refresh=true`,
      returnUrl: `${baseUrl}/dashboard/earnings?success=true`,
    })

    return createSuccessResponse(
      {
        url: accountLink.url,
        account_id: stripeAccountId,
      },
      200,
      'Onboarding link generated successfully'
    )
  } catch (error) {
    return createErrorResponse(error, '/api/stripe/connect/onboard')
  }
}
