import type { Database } from './database'

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

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type PaymentMethodInsert = Database['public']['Tables']['payment_methods']['Insert']
export type PaymentMethodUpdate = Database['public']['Tables']['payment_methods']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// Extended types with relations
export type ListWithLinks = List & {
  links: Link[]
  user: Pick<User, 'id' | 'username'>
  emoji_3d?: Emoji3D
  is_saved?: boolean // If current user has saved this list
}

export type ListWithUser = List & {
  user: Pick<User, 'id' | 'username'>
  is_saved?: boolean
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

// 3D Emoji data structure
export interface Emoji3D {
  unicode: string
  url?: string | undefined
  name?: string | undefined
}

// Form types
export interface CreateListForm {
  title: string
  emoji?: string
  emoji_3d?: Emoji3D
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