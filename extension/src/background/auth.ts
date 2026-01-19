import { API_ENDPOINTS, TOKEN_REFRESH_BUFFER, AUTH_PAGE_URL, CALLBACK_URL } from '@/shared/constants'
import {
  getTokens,
  setTokens,
  clearTokens,
  getUser,
  setUser,
  clearUser,
  clearAllData,
} from '@/shared/storage'
import type { ExtensionTokens, ExtensionUser, AuthState } from '@/shared/types'

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  tokens: ExtensionTokens
  user: ExtensionUser
}> {
  const response = await fetch(API_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to exchange code')
  }

  const data = await response.json()

  const tokens: ExtensionTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: data.access_token_expires_at,
    refreshTokenExpiresAt: data.refresh_token_expires_at,
  }

  const user: ExtensionUser = {
    id: data.user.id,
    email: data.user.email,
    username: data.user.username,
    profilePictureUrl: data.user.profile_picture_url,
  }

  // Store tokens and user
  await setTokens(tokens)
  await setUser(user)

  return { tokens, user }
}

// Refresh access token
export async function refreshAccessToken(): Promise<ExtensionTokens | null> {
  const tokens = await getTokens()

  if (!tokens?.refreshToken) {
    return null
  }

  // Check if refresh token is expired
  if (Date.now() > tokens.refreshTokenExpiresAt) {
    await clearAllData()
    return null
  }

  try {
    const response = await fetch(API_ENDPOINTS.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: tokens.refreshToken,
      }),
    })

    if (!response.ok) {
      // Refresh failed, clear auth
      await clearAllData()
      return null
    }

    const data = await response.json()

    const newTokens: ExtensionTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      accessTokenExpiresAt: data.access_token_expires_at,
      refreshTokenExpiresAt: data.refresh_token_expires_at || tokens.refreshTokenExpiresAt,
    }

    await setTokens(newTokens)
    return newTokens
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return null
  }
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens()

  if (!tokens) {
    return null
  }

  // Check if access token is about to expire
  const shouldRefresh = Date.now() + TOKEN_REFRESH_BUFFER > tokens.accessTokenExpiresAt

  if (shouldRefresh) {
    const newTokens = await refreshAccessToken()
    return newTokens?.accessToken || null
  }

  return tokens.accessToken
}

// Get current auth state
export async function getAuthState(): Promise<AuthState> {
  const [tokens, user] = await Promise.all([getTokens(), getUser()])

  const isAuthenticated = !!(tokens && user && Date.now() < tokens.refreshTokenExpiresAt)

  return {
    isAuthenticated,
    user: isAuthenticated ? user : null,
    tokens: isAuthenticated ? tokens : null,
  }
}

// Sign out
export async function signOut(): Promise<void> {
  const tokens = await getTokens()

  // Try to revoke tokens on server
  if (tokens?.refreshToken) {
    try {
      await fetch(API_ENDPOINTS.revoke, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokens.refreshToken,
        }),
      })
    } catch {
      // Ignore revoke errors
    }
  }

  // Clear local data
  await clearAllData()
}

// Open auth page in new tab and listen for callback
export async function openAuthPage(): Promise<void> {
  // Use web-based callback URL (works with Arc and other browsers)
  const callbackUrl = CALLBACK_URL

  // Open auth page with callback URL
  const authUrl = `${AUTH_PAGE_URL}?callback=${encodeURIComponent(callbackUrl)}`

  const tab = await chrome.tabs.create({ url: authUrl })

  // Listen for the tab navigating to our callback URL
  const tabId = tab.id
  if (!tabId) return

  const handleTabUpdate = async (
    updatedTabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    updatedTab: chrome.tabs.Tab
  ) => {
    // Only process our auth tab
    if (updatedTabId !== tabId) return

    // Check if the URL is our callback URL with a code
    const url = updatedTab.url || changeInfo.url
    if (!url || !url.startsWith(CALLBACK_URL)) return

    try {
      const urlObj = new URL(url)
      const code = urlObj.searchParams.get('code')
      const error = urlObj.searchParams.get('error')

      if (error) {
        console.error('Auth error:', error)
        chrome.tabs.onUpdated.removeListener(handleTabUpdate)
        return
      }

      if (code) {
        // Remove listener first to prevent double processing
        chrome.tabs.onUpdated.removeListener(handleTabUpdate)

        // Exchange code for tokens
        await exchangeCodeForTokens(code)

        // Close the auth tab after a short delay
        setTimeout(() => {
          chrome.tabs.remove(tabId).catch(() => {
            // Tab might already be closed
          })
        }, 1500)
      }
    } catch (err) {
      console.error('Error processing callback:', err)
    }
  }

  chrome.tabs.onUpdated.addListener(handleTabUpdate)

  // Clean up listener if tab is closed without completing auth
  const handleTabRemoved = (removedTabId: number) => {
    if (removedTabId === tabId) {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate)
      chrome.tabs.onRemoved.removeListener(handleTabRemoved)
    }
  }

  chrome.tabs.onRemoved.addListener(handleTabRemoved)
}
