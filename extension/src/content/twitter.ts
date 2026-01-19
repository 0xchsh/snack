import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { startTweetDetection, reprocessAllTweets } from './tweet-detector'
import { SnackButton } from './ui/SnackButton'
import { ToastContainer } from './ui/Toast'
import type {
  TweetData,
  ExtractedLink,
  SnackList,
  AuthState,
  ToastData,
  LinkData,
  MessageResponse,
  CreateListRequest,
} from '@/shared/types'
import { generateId } from '@/shared/utils'
import { TWITTER_SELECTORS } from '@/shared/constants'

// State
let authState: AuthState = { isAuthenticated: false, user: null, tokens: null }
let lists: SnackList[] = []
let isLoadingLists = false
let toasts: ToastData[] = []

// Track button roots for cleanup
const buttonRoots = new Map<string, Root>()
let toastRoot: Root | null = null
let toastContainer: HTMLDivElement | null = null

// Initialize toast container
function initToastContainer() {
  if (toastContainer) return

  toastContainer = document.createElement('div')
  toastContainer.id = 'snack-toast-root'
  document.body.appendChild(toastContainer)
  toastRoot = createRoot(toastContainer)
  renderToasts()
}

// Render toasts
function renderToasts() {
  if (!toastRoot) return

  toastRoot.render(
    React.createElement(ToastContainer, {
      toasts,
      onRemove: (id: string) => {
        toasts = toasts.filter((t) => t.id !== id)
        renderToasts()
      },
    })
  )
}

// Show toast
function showToast(type: ToastData['type'], message: string, duration?: number): string {
  const id = generateId()
  toasts.push({ id, type, message, duration })
  renderToasts()
  return id
}

// Remove toast
function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  renderToasts()
}

// Send message to background
async function sendMessage<T>(message: Record<string, unknown>): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message)
}

// Fetch auth state
async function fetchAuthState(): Promise<void> {
  const response = await sendMessage<AuthState>({ type: 'GET_AUTH_STATE' })
  if (response.success && response.data) {
    authState = response.data
  }
}

// Fetch lists
async function fetchLists(): Promise<void> {
  if (!authState.isAuthenticated) return

  isLoadingLists = true
  reRenderAllButtons()

  const response = await sendMessage<SnackList[]>({ type: 'GET_LISTS' })

  if (response.success && response.data) {
    lists = response.data
  }

  isLoadingLists = false
  reRenderAllButtons()
}

// Sign in handler
function handleSignIn() {
  sendMessage({ type: 'SIGN_IN' })
}

// Save links to list
async function handleSave(listId: string, links: ExtractedLink[]): Promise<void> {
  console.log('[Snack] Saving links to list:', listId, links)

  const linkData: LinkData[] = links.map((link) => ({
    url: link.expandedUrl,
    title: null, // Will be fetched by server
  }))

  console.log('[Snack] Sending ADD_LINKS message:', { listId, links: linkData })

  const response = await sendMessage({
    type: 'ADD_LINKS',
    listId,
    links: linkData,
  })

  console.log('[Snack] ADD_LINKS response:', response)

  if (!response.success) {
    console.error('[Snack] Save failed:', response.error)
    throw new Error(response.error || 'Failed to save')
  }

  // Update the list's link count locally
  const list = lists.find((l) => l.id === listId)
  if (list) {
    list.linkCount += links.length
  }

  const listName = list?.title || 'list'
  showToast('success', `Saved to ${listName} ✓`)
}

// Create new list
async function handleCreateList(title: string, emoji: string): Promise<SnackList> {
  const response = await sendMessage<SnackList>({
    type: 'CREATE_LIST',
    data: { title, emoji } as CreateListRequest,
  })

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create list')
  }

  // Add to local list
  lists.unshift(response.data)

  return response.data
}

// Re-render all buttons (after auth/lists change)
function reRenderAllButtons() {
  buttonRoots.forEach((root, key) => {
    const data = tweetDataMap.get(key)
    if (data) {
      renderButton(root, data.links)
    }
  })
}

// Store tweet data for re-rendering
const tweetDataMap = new Map<string, TweetData>()

// Render a Snack button
function renderButton(root: Root, links: ExtractedLink[]) {
  root.render(
    React.createElement(SnackButton, {
      links,
      onSave: (listId: string) => handleSave(listId, links),
      onCreateList: handleCreateList,
      onSignIn: handleSignIn,
      authState,
      lists,
      isLoadingLists,
    })
  )
}

// Inject Snack button into tweet
function injectSnackButton(tweet: TweetData) {
  const { tweetId, links, element } = tweet

  console.log('[Snack] Injecting button for tweet:', tweetId, 'with', links.length, 'links')

  // Find the action bar - try multiple selectors
  let actionBar = element.querySelector(TWITTER_SELECTORS.tweetActions)

  // Fallback: find any role="group" that contains action buttons
  if (!actionBar) {
    const groups = element.querySelectorAll('[role="group"]')
    for (const group of groups) {
      if (group.querySelector('[data-testid="reply"]') ||
          group.querySelector('[data-testid="like"]') ||
          group.querySelector('[data-testid="retweet"]')) {
        actionBar = group
        break
      }
    }
  }

  if (!actionBar) {
    console.log('[Snack] No action bar found for tweet:', tweetId)
    return
  }

  // Check if button already exists
  if (actionBar.querySelector('.snack-button-root')) return

  console.log('[Snack] Found action bar, injecting button')

  // Create container with Shadow DOM for style isolation
  const container = document.createElement('div')
  container.className = 'snack-button-root'
  container.style.display = 'inline-flex'
  container.style.alignItems = 'center'

  // Create shadow root
  const shadow = container.attachShadow({ mode: 'open' })

  // Add styles to shadow DOM
  const style = document.createElement('style')
  style.textContent = `
    :host {
      display: inline-flex;
      align-items: center;
    }

    * {
      box-sizing: border-box;
    }

    .snack-action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34.75px;
      height: 34.75px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.2s;
    }

    .snack-action-button:hover {
      background-color: rgba(113, 118, 123, 0.15);
    }

    .snack-action-button:hover svg {
      color: rgb(231, 233, 234) !important;
    }

    .animate-check-pop {
      animation: checkPop 0.3s ease-out;
    }

    @keyframes checkPop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-spin {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .snack-scrollbar::-webkit-scrollbar {
      width: 8px;
    }

    .snack-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .snack-scrollbar::-webkit-scrollbar-thumb {
      background: rgb(47, 51, 54);
      border-radius: 4px;
    }

    .snack-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgb(62, 65, 68);
    }
  `
  shadow.appendChild(style)

  // Create React root inside shadow DOM
  const reactContainer = document.createElement('div')
  shadow.appendChild(reactContainer)
  const root = createRoot(reactContainer)

  // Store for cleanup and re-rendering
  buttonRoots.set(tweetId, root)
  tweetDataMap.set(tweetId, tweet)

  // Render button
  renderButton(root, links)

  // Insert into action bar (before bookmark button)
  const bookmarkButton = actionBar.querySelector('[data-testid="bookmark"]')
  if (bookmarkButton && bookmarkButton.parentElement) {
    bookmarkButton.parentElement.insertAdjacentElement('beforebegin', container)
  } else {
    // Fallback: try to find by aria-label or insert at end
    const fallbackBookmark = actionBar.querySelector('[aria-label*="Bookmark"]') ||
                             actionBar.querySelector('[aria-label*="bookmark"]')
    if (fallbackBookmark && fallbackBookmark.parentElement) {
      fallbackBookmark.parentElement.insertAdjacentElement('beforebegin', container)
    } else {
      actionBar.appendChild(container)
    }
  }
}

// Handle tweet detection
function handleTweetDetected(tweet: TweetData) {
  injectSnackButton(tweet)
}

// Initialize
async function init() {
  console.log('[Snack] Initializing Twitter content script')

  // Initialize toast container
  initToastContainer()

  // Fetch initial auth state
  await fetchAuthState()

  // If authenticated, fetch lists
  if (authState.isAuthenticated) {
    await fetchLists()
  }

  // Start detecting tweets
  startTweetDetection(handleTweetDetected)

  // Listen for auth state changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTH_STATE_CHANGED') {
      fetchAuthState().then(() => {
        if (authState.isAuthenticated) {
          fetchLists()
        } else {
          lists = []
        }
        reRenderAllButtons()
        reprocessAllTweets(handleTweetDetected)
      })
    }
  })

  console.log('[Snack] Content script ready')
}

// Start
init().catch(console.error)
