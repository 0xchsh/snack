import { STORAGE_KEYS, CACHE_TTL } from './constants'
import type { ExtensionTokens, ExtensionUser, SnackList } from './types'

// Token storage
export async function getTokens(): Promise<ExtensionTokens | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.tokens)
  return result[STORAGE_KEYS.tokens] || null
}

export async function setTokens(tokens: ExtensionTokens): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.tokens]: tokens })
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.tokens)
}

// User storage
export async function getUser(): Promise<ExtensionUser | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.user)
  return result[STORAGE_KEYS.user] || null
}

export async function setUser(user: ExtensionUser): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.user]: user })
}

export async function clearUser(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.user)
}

// Recent list storage
export async function getRecentListId(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.recentListId)
  return result[STORAGE_KEYS.recentListId] || null
}

export async function setRecentListId(listId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.recentListId]: listId })
}

// Lists cache
export async function getCachedLists(): Promise<SnackList[] | null> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.listsCache,
    STORAGE_KEYS.listsCacheTime,
  ])

  const cache = result[STORAGE_KEYS.listsCache]
  const cacheTime = result[STORAGE_KEYS.listsCacheTime]

  if (!cache || !cacheTime) {
    return null
  }

  // Check if cache is still valid
  if (Date.now() - cacheTime > CACHE_TTL) {
    return null
  }

  return cache
}

export async function setCachedLists(lists: SnackList[]): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.listsCache]: lists,
    [STORAGE_KEYS.listsCacheTime]: Date.now(),
  })
}

export async function clearListsCache(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.listsCache,
    STORAGE_KEYS.listsCacheTime,
  ])
}

// Clear all extension data (for sign out)
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.tokens,
    STORAGE_KEYS.user,
    STORAGE_KEYS.recentListId,
    STORAGE_KEYS.listsCache,
    STORAGE_KEYS.listsCacheTime,
  ])
}
