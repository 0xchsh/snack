// Extension auth token types
export interface ExtensionTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number // Unix timestamp
  refreshTokenExpiresAt: number // Unix timestamp
}

// User data stored in extension
export interface ExtensionUser {
  id: string
  email: string
  username: string | null
  profilePictureUrl: string | null
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean
  user: ExtensionUser | null
  tokens: ExtensionTokens | null
}

// List data from API
export interface SnackList {
  id: string
  publicId: string
  title: string
  emoji: string | null
  isPublic: boolean
  linkCount: number
  updatedAt: string
}

// Link data for saving
export interface LinkData {
  url: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  faviconUrl?: string | null
  position?: number
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface ListsResponse {
  lists: SnackList[]
}

export interface CreateListRequest {
  title: string
  emoji?: string
  isPublic?: boolean
}

export interface AddLinksRequest {
  links: LinkData[]
}

// Messages between content script and background
export type MessageType =
  | 'GET_AUTH_STATE'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'EXCHANGE_CODE'
  | 'GET_LISTS'
  | 'CREATE_LIST'
  | 'ADD_LINKS'
  | 'REFRESH_TOKEN'

export interface ExtensionMessage {
  type: MessageType
  [key: string]: unknown
}

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Tweet data extracted from DOM
export interface TweetData {
  tweetId: string
  links: ExtractedLink[]
  element: Element
}

// Extracted link from tweet
export interface ExtractedLink {
  url: string
  expandedUrl: string
  displayText: string
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'loading'

export interface ToastData {
  id: string
  type: ToastType
  message: string
  duration?: number
}
