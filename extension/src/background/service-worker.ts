import type {
  ExtensionMessage,
  MessageResponse,
  SnackList,
  CreateListRequest,
  LinkData,
  AuthState,
} from '@/shared/types'
import {
  getCachedLists,
  setCachedLists,
  clearListsCache,
  setRecentListId,
} from '@/shared/storage'
import {
  getAuthState,
  exchangeCodeForTokens,
  signOut,
  openAuthPage,
} from './auth'
import { fetchLists, createList, addLinksToList } from './api'

// Message handler
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('Message handler error:', error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    // Return true to indicate async response
    return true
  }
)

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  switch (message.type) {
    case 'GET_AUTH_STATE':
      return handleGetAuthState()

    case 'SIGN_IN':
      return handleSignIn()

    case 'SIGN_OUT':
      return handleSignOut()

    case 'EXCHANGE_CODE':
      return handleExchangeCode(message.code as string)

    case 'GET_LISTS':
      return handleGetLists(message.forceRefresh as boolean | undefined)

    case 'CREATE_LIST':
      return handleCreateList(message.data as CreateListRequest)

    case 'ADD_LINKS':
      return handleAddLinks(
        message.listId as string,
        message.links as LinkData[]
      )

    default:
      return { success: false, error: 'Unknown message type' }
  }
}

async function handleGetAuthState(): Promise<MessageResponse<AuthState>> {
  const authState = await getAuthState()
  return { success: true, data: authState }
}

async function handleSignIn(): Promise<MessageResponse> {
  await openAuthPage()
  return { success: true }
}

async function handleSignOut(): Promise<MessageResponse> {
  await signOut()
  await clearListsCache()
  return { success: true }
}

async function handleExchangeCode(code: string): Promise<MessageResponse> {
  if (!code) {
    return { success: false, error: 'No code provided' }
  }

  try {
    await exchangeCodeForTokens(code)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to authenticate',
    }
  }
}

async function handleGetLists(
  forceRefresh?: boolean
): Promise<MessageResponse<SnackList[]>> {
  // Check auth state
  const authState = await getAuthState()
  if (!authState.isAuthenticated) {
    return { success: false, error: 'Not authenticated' }
  }

  // Try cache first (unless forced refresh)
  if (!forceRefresh) {
    const cachedLists = await getCachedLists()
    if (cachedLists) {
      return { success: true, data: cachedLists }
    }
  }

  try {
    const lists = await fetchLists()
    await setCachedLists(lists)
    return { success: true, data: lists }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch lists',
    }
  }
}

async function handleCreateList(
  data: CreateListRequest
): Promise<MessageResponse<SnackList>> {
  // Check auth state
  const authState = await getAuthState()
  if (!authState.isAuthenticated) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const list = await createList(data)
    // Invalidate cache
    await clearListsCache()
    return { success: true, data: list }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create list',
    }
  }
}

async function handleAddLinks(
  listId: string,
  links: LinkData[]
): Promise<MessageResponse> {
  // Check auth state
  const authState = await getAuthState()
  if (!authState.isAuthenticated) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!listId || !links?.length) {
    return { success: false, error: 'Invalid parameters' }
  }

  try {
    await addLinksToList(listId, links)
    // Update recent list
    await setRecentListId(listId)
    // Invalidate cache
    await clearListsCache()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add links',
    }
  }
}

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Snack extension installed:', details.reason)
})
