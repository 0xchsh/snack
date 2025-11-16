import { createServerSupabaseClient } from './supabase-server'
import type {
  ListPurchase,
  ListPurchaseInsert,
  PurchaseWithList,
  PurchaseWithDetails,
  PurchaseStatus,
  CreatorEarnings,
  CreatorBalance,
  ListEarnings,
  Currency,
} from '@/types'
import { calculatePricing } from './pricing'

/**
 * Purchase Manager
 * Handles all database operations related to list purchases
 */
export class PurchaseManager {
  /**
   * Check if a user has purchased a specific list
   */
  static async hasPurchased(userId: string, listId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('user_has_purchased_list', {
      p_user_id: userId,
      p_list_id: listId,
    })

    if (error) {
      console.error('Error checking purchase status:', error)
      return false
    }

    return data === true
  }

  /**
   * Get purchase status for a list
   */
  static async getPurchaseStatus(userId: string, listId: string): Promise<PurchaseStatus> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select('purchased_at, amount_paid, currency')
      .eq('user_id', userId)
      .eq('list_id', listId)
      .is('refunded_at', null)
      .maybeSingle()

    if (error) {
      console.error('Error fetching purchase status:', error)
      return {
        is_purchased: false,
        purchase_date: null,
        amount_paid: null,
        currency: null,
      }
    }

    if (!data) {
      return {
        is_purchased: false,
        purchase_date: null,
        amount_paid: null,
        currency: null,
      }
    }

    return {
      is_purchased: true,
      purchase_date: data.purchased_at,
      amount_paid: data.amount_paid,
      currency: data.currency as Currency,
    }
  }

  /**
   * Create a new purchase record
   */
  static async createPurchase(
    data: Omit<ListPurchaseInsert, 'id' | 'purchased_at'>
  ): Promise<{ data: ListPurchase | null; error: Error | null }> {
    const supabase = await createServerSupabaseClient()

    const { data: purchase, error } = await supabase
      .from('list_purchases')
      .insert(data)
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: purchase, error: null }
  }

  /**
   * Get all purchases for a user
   */
  static async getUserPurchases(userId: string): Promise<PurchaseWithList[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select(
        `
        *,
        list:lists(
          id,
          title,
          emoji,
          user_id
        )
      `
      )
      .eq('user_id', userId)
      .is('refunded_at', null)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching user purchases:', error)
      return []
    }

    return (data as any[]) || []
  }

  /**
   * Get all purchases with full list details
   */
  static async getUserPurchasesWithDetails(userId: string): Promise<PurchaseWithDetails[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select(
        `
        *,
        list:lists(
          *,
          user:users(
            id,
            username,
            profile_picture_url
          )
        )
      `
      )
      .eq('user_id', userId)
      .is('refunded_at', null)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching user purchases with details:', error)
      return []
    }

    return (data as any[]) || []
  }

  /**
   * Get purchases of a creator's lists
   */
  static async getCreatorSales(creatorId: string): Promise<PurchaseWithList[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select(
        `
        *,
        list:lists!inner(
          id,
          title,
          emoji,
          user_id
        )
      `
      )
      .eq('list.user_id', creatorId)
      .is('refunded_at', null)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching creator sales:', error)
      return []
    }

    return (data as any[]) || []
  }

  /**
   * Get total earnings for a creator
   */
  static async getCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('get_creator_total_earnings', {
      p_user_id: creatorId,
    })

    if (error) {
      console.error('Error fetching creator earnings:', error)
      return {
        total_earnings: 0,
        total_purchases: 0,
        currency: 'usd',
      }
    }

    // RPC returns array with single row
    const result = Array.isArray(data) ? data[0] : data

    return {
      total_earnings: Number(result?.total_earnings || 0),
      total_purchases: Number(result?.total_purchases || 0),
      currency: (result?.currency || 'usd') as Currency,
    }
  }

  /**
   * Get available balance for creator payouts
   */
  static async getCreatorBalance(creatorId: string): Promise<CreatorBalance> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('get_creator_available_balance', {
      p_user_id: creatorId,
    })

    if (error) {
      console.error('Error fetching creator balance:', error)
      return {
        available_balance: 0,
        pending_payouts: 0,
        total_earned: 0,
      }
    }

    // RPC returns array with single row
    const result = Array.isArray(data) ? data[0] : data

    return {
      available_balance: Number(result?.available_balance || 0),
      pending_payouts: Number(result?.pending_payouts || 0),
      total_earned: Number(result?.total_earned || 0),
    }
  }

  /**
   * Get earnings breakdown by list
   */
  static async getEarningsByList(creatorId: string): Promise<ListEarnings[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('creator_earnings_summary')
      .select('*')
      .eq('creator_id', creatorId)
      .order('total_earnings', { ascending: false })

    if (error) {
      console.error('Error fetching earnings by list:', error)
      return []
    }

    return (
      data?.map((row) => ({
        list_id: row.list_id,
        list_title: row.list_title,
        total_purchases: row.total_purchases,
        total_earnings: row.total_earnings,
        total_platform_fees: row.total_platform_fees,
        currency: row.currency as Currency,
        first_purchase: row.first_purchase,
        latest_purchase: row.latest_purchase,
      })) || []
    )
  }

  /**
   * Get purchases for a specific list
   */
  static async getListPurchases(listId: string): Promise<ListPurchase[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select('*')
      .eq('list_id', listId)
      .is('refunded_at', null)
      .order('purchased_at', { ascending: false })

    if (error) {
      console.error('Error fetching list purchases:', error)
      return []
    }

    return data || []
  }

  /**
   * Get purchase count for a list
   */
  static async getListPurchaseCount(listId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()

    const { count, error } = await supabase
      .from('list_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .is('refunded_at', null)

    if (error) {
      console.error('Error fetching list purchase count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Refund a purchase
   */
  static async refundPurchase(
    purchaseId: string,
    reason: string
  ): Promise<{ success: boolean; error: Error | null }> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('list_purchases')
      .update({
        refunded_at: new Date().toISOString(),
        refund_reason: reason,
      })
      .eq('id', purchaseId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  }

  /**
   * Helper: Calculate pricing breakdown for a purchase
   */
  static calculatePurchasePricing(amountCents: number) {
    return calculatePricing(amountCents)
  }

  /**
   * Check multiple lists for purchase status (bulk operation)
   */
  static async checkMultiplePurchases(
    userId: string,
    listIds: string[]
  ): Promise<Record<string, boolean>> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('list_purchases')
      .select('list_id')
      .eq('user_id', userId)
      .in('list_id', listIds)
      .is('refunded_at', null)

    if (error) {
      console.error('Error checking multiple purchases:', error)
      return {}
    }

    // Create a map of list_id -> true for purchased lists
    const purchasedMap: Record<string, boolean> = {}
    listIds.forEach((id) => {
      purchasedMap[id] = false
    })

    data?.forEach((purchase) => {
      purchasedMap[purchase.list_id] = true
    })

    return purchasedMap
  }
}
