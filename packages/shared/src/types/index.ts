import type { Database } from './database.types'

export type { Database }

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type List = Database['public']['Tables']['lists']['Row']
export type ListInsert = Database['public']['Tables']['lists']['Insert']
export type ListUpdate = Database['public']['Tables']['lists']['Update']

export type Link = Database['public']['Tables']['links']['Row']
export type LinkInsert = Database['public']['Tables']['links']['Insert']
export type LinkUpdate = Database['public']['Tables']['links']['Update']

export type SavedList = Database['public']['Tables']['saved_lists']['Row']
export type SavedListInsert = Database['public']['Tables']['saved_lists']['Insert']
export type SavedListUpdate = Database['public']['Tables']['saved_lists']['Update']

// Paywalled lists & payments types
export type ListPurchase = Database['public']['Tables']['list_purchases']['Row']
export type ListPurchaseInsert = Database['public']['Tables']['list_purchases']['Insert']
export type ListPurchaseUpdate = Database['public']['Tables']['list_purchases']['Update']

export type CreatorPayout = Database['public']['Tables']['creator_payouts']['Row']
export type CreatorPayoutInsert = Database['public']['Tables']['creator_payouts']['Insert']
export type CreatorPayoutUpdate = Database['public']['Tables']['creator_payouts']['Update']

// Extended types with relations
export type ListWithLinks = List & {
  links: Link[]
  user: Pick<User, 'id' | 'username' | 'profile_picture_url'>
  is_saved?: boolean
  price_cents?: number | null
}

export type ListWithUser = List & {
  user: Pick<User, 'id' | 'username' | 'profile_picture_url'>
  is_saved?: boolean
  price_cents?: number | null
}

// Optimized saved lists with enhanced functionality
export type SavedListWithDetails = SavedList & {
  list: ListWithUser
}

// For saved lists feed/discovery
export type SavedListCard = {
  list_id: string
  title: string
  emoji: string | null
  save_count: number
  is_saved: boolean
  saved_at?: string
  notes?: string | null
  user: Pick<User, 'id' | 'username'>
}

// Form types
export interface CreateListForm {
  title: string
  emoji?: string
  is_public: boolean
  price_cents?: number
}

export interface CreateLinkForm {
  url: string
  title?: string
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Link metadata from URL scraping
export interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  favicon?: string
  url: string
}

export interface LinkCreatePayload {
  url: string
  title?: string | null
  description?: string | null
  image_url?: string | null
  favicon_url?: string | null
  position?: number
}

// Analytics types
export interface ListAnalytics {
  views: number
  clicks: number
  bookmarks: number
  revenue_cents: number
}

export interface LinkAnalytics {
  clicks: number
  click_rate: number
}

// ============================================================================
// Payment & Monetization Types
// ============================================================================

// Supported currencies
export type Currency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | 'inr'

// Stripe account status
export type StripeAccountStatus = 'not_connected' | 'pending' | 'active' | 'restricted'

// Payout status
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled'

// Extended User type with Stripe info
export type UserWithStripe = User & {
  stripe_account_id: string | null
  stripe_account_status: StripeAccountStatus
  stripe_customer_id: string | null
  stripe_connected_at: string | null
}

// List with purchase info
export type ListWithPurchaseInfo = List & {
  is_purchased?: boolean
  purchase_date?: string | null
  is_free: boolean // Computed: price_cents is null or 0
}

// Purchase with related data
export type PurchaseWithList = ListPurchase & {
  list: {
    id: string
    title: string
    emoji: string | null
    user_id: string
  }
}

export type PurchaseWithDetails = ListPurchase & {
  list: ListWithUser
}

// Creator earnings data
export interface CreatorEarnings {
  total_earnings: number // in cents
  total_purchases: number
  currency: Currency
}

// Creator balance for payouts
export interface CreatorBalance {
  available_balance: number // in cents, available for payout
  pending_payouts: number // in cents, in pending payouts
  total_earned: number // in cents, all-time earnings
}

// Pricing calculation result
export interface PricingBreakdown {
  amount_cents: number // Total amount charged
  platform_fee: number // Platform's cut in cents
  creator_earnings: number // Creator receives in cents
  platform_fee_percentage: number // e.g., 0.10 for 10%
}

// Stripe Checkout session data
export interface CheckoutSessionData {
  session_id: string
  url: string
  list_id: string
  amount: number
  currency: Currency
}

// Payment Intent metadata
export interface PaymentIntentMetadata {
  list_id: string
  list_title: string
  creator_id: string
  buyer_id: string
  amount_cents: number
  currency: Currency
  platform_fee: number
  creator_earnings: number
}

// Purchase status response
export interface PurchaseStatus {
  is_purchased: boolean
  purchase_date: string | null
  amount_paid: number | null
  currency: Currency | null
}

// Creator dashboard stats
export interface CreatorDashboardStats {
  total_earnings: number
  pending_payouts: number
  available_balance: number
  total_sales: number
  total_lists: number
  paid_lists: number
  currency: Currency
}

// List pricing form
export interface ListPricingForm {
  price_cents: number | null // null = free, >0 = paid
  currency: Currency
}

// Payout request form
export interface PayoutRequestForm {
  amount: number // in cents
  currency: Currency
}

// Earnings by list
export interface ListEarnings {
  list_id: string
  list_title: string
  total_purchases: number
  total_earnings: number // in cents
  total_platform_fees: number // in cents
  currency: Currency
  first_purchase: string | null
  latest_purchase: string | null
}

// ============================================================================
// Extension Types (standalone interfaces, not database-backed)
// ============================================================================

// Extension list summary (for dropdown)
export interface ExtensionListSummary {
  id: string
  publicId: string
  title: string
  emoji: string | null
  isPublic: boolean
  linkCount: number
  updatedAt: string
}

// Extension link data for saving
export interface ExtensionLinkData {
  url: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  faviconUrl?: string | null
  position?: number
}

// ============================================================================
// Mobile App Types
// ============================================================================

// Discover feed list item
export interface DiscoverListItem {
  id: string
  public_id: string
  title: string
  emoji: string | null
  is_public: boolean
  view_count: number | null
  save_count: number | null
  created_at: string | null
  user_id: string
  user: Pick<User, 'id' | 'username' | 'profile_picture_url'> | null
  links: Pick<Link, 'id' | 'url' | 'title'>[]
}

// Pagination response
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    hasMore: boolean
    total: number
  }
}

// Public profile data
export interface PublicProfile {
  id: string
  username: string
  profile_picture_url: string | null
  bio: string | null
  first_name: string | null
  last_name: string | null
  lists: ListWithLinks[]
  stats: {
    total_lists: number
    total_saves: number
  }
}
