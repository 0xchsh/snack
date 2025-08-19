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

// Extended types with relations
export type ListWithLinks = List & {
  links: Link[]
  user: Pick<User, 'id' | 'username'>
}

export type ListWithUser = List & {
  user: Pick<User, 'id' | 'username'>
}

// 3D Emoji data structure
export interface Emoji3D {
  unicode: string
  url?: string
  name?: string
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