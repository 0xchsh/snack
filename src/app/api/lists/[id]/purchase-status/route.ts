import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PurchaseManager } from '@/lib/purchases'
import { isListFree } from '@/lib/pricing'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/lists/[id]/purchase-status
 * Check if the authenticated user has purchased this list
 *
 * Returns:
 * - is_purchased: boolean
 * - is_owner: boolean (user owns this list)
 * - is_free: boolean (list is free)
 * - has_access: boolean (can view the list - computed from above)
 * - purchase_date: string | null (when purchased)
 * - amount_paid: number | null (how much they paid in cents)
 * - currency: string | null
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await checkRateLimit(request, 'api')

    const listId = params.id

    // Get authenticated user (optional - can check status without being logged in)
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get list details
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, price_cents, user_id, is_public')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      throw ApiErrors.notFound('List not found')
    }

    const isFree = isListFree(list.price_cents)
    const isOwner = user ? list.user_id === user.id : false

    // If not logged in, return basic info
    if (!user) {
      return createSuccessResponse({
        is_purchased: false,
        is_owner: false,
        is_free: isFree,
        has_access: isFree, // Can only access if free
        purchase_date: null,
        amount_paid: null,
        currency: null,
      })
    }

    // Check if user has purchased
    const purchaseStatus = await PurchaseManager.getPurchaseStatus(user.id, listId)

    // Determine if user has access
    const hasAccess = isOwner || isFree || purchaseStatus.is_purchased

    return createSuccessResponse({
      is_purchased: purchaseStatus.is_purchased,
      is_owner: isOwner,
      is_free: isFree,
      has_access: hasAccess,
      purchase_date: purchaseStatus.purchase_date,
      amount_paid: purchaseStatus.amount_paid,
      currency: purchaseStatus.currency,
    })
  } catch (error) {
    return createErrorResponse(error, '/api/lists/[id]/purchase-status')
  }
}
