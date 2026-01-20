import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { startTweetDetection, reprocessAllTweets } from './tweet-detector'
import { extractLinksFromTweet, getTweetId } from './link-extractor'
import { SnackButton } from './ui/SnackButton'
import { ListDropdown } from './ui/ListDropdown'
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
function showToast(type: ToastData['type'], message: string, options?: { duration?: number; listPublicId?: string }): string {
  const id = generateId()
  toasts.push({ id, type, message, duration: options?.duration, listPublicId: options?.listPublicId })
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
  const linkData: LinkData[] = links.map((link) => ({
    url: link.expandedUrl,
    title: null, // Will be fetched by server
  }))

  const response = await sendMessage({
    type: 'ADD_LINKS',
    listId,
    links: linkData,
  })

  if (!response.success) {
    throw new Error(response.error || 'Failed to save')
  }

  // Update the list locally (count and timestamp for sorting)
  const list = lists.find((l) => l.id === listId)
  if (list) {
    list.linkCount += links.length
    list.updatedAt = new Date().toISOString()
  }

  const listName = list?.title || 'list'
  showToast('success', `Saved to ${listName} ✓`, { listPublicId: list?.publicId })
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

// Track current tweet for share menu
let currentShareMenuTweet: { tweetId: string; links: ExtractedLink[] } | null = null
let shareMenuRoot: Root | null = null

// Inject Snack option into share dropdown menu
function injectShareMenuItem(menu: Element) {
  // Check if already injected
  if (menu.querySelector('.snack-share-menu-item')) return

  // Find the menu items container - it's usually a div with role="menu" or contains menuitem roles
  const menuItems = menu.querySelectorAll('[role="menuitem"]')
  if (menuItems.length === 0) return

  // Get the first menu item to copy its styling
  const firstMenuItem = menuItems[0] as HTMLElement
  if (!firstMenuItem) return

  // Try to find the associated tweet to get its links
  // The share menu is opened from a tweet, we need to find which tweet
  const tweetArticle = document.querySelector('article[data-testid="tweet"]:hover') ||
    document.querySelector('article[data-testid="tweet"][tabindex="-1"]') ||
    findFocusedTweet()

  if (tweetArticle) {
    const links = extractLinksFromTweet(tweetArticle)
    const tweetId = getTweetId(tweetArticle)
    if (links.length > 0 && tweetId) {
      currentShareMenuTweet = { tweetId, links }
    }
  }

  // Only show if we have links to save
  if (!currentShareMenuTweet || currentShareMenuTweet.links.length === 0) return

  // Create our menu item container
  const snackMenuItem = document.createElement('div')
  snackMenuItem.className = 'snack-share-menu-item'
  snackMenuItem.setAttribute('role', 'menuitem')
  snackMenuItem.setAttribute('tabindex', '0')

  // Copy styles from existing menu item
  const computedStyle = window.getComputedStyle(firstMenuItem)
  snackMenuItem.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: ${computedStyle.padding || '16px'};
    cursor: pointer;
    transition: background-color 0.2s;
    color: rgb(231, 233, 234);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
    font-weight: 400;
  `

  // Pretzel icon
  const iconContainer = document.createElement('div')
  iconContainer.style.cssText = `
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  `
  iconContainer.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 72 72" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M37.79 17.558C42.746 14.468 48.035 13.877 52.977 17.463C58.33 21.35 59.754 27.144 59.058 33.342C58.389 39.3 55.83 44.504 51.295 48.652C50.673 49.221 50.249 50.633 50.498 51.411C51.208 53.64 51.798 55.553 48.937 56.675C45.884 57.873 45.314 55.489 44.346 53.625C44.247 53.437 44.092 53.276 43.88 52.986C39.142 52.986 28.239 53.022 28.171 53.023C28.159 53.042 27.584 54.002 27.121 54.778C26.067 56.544 25.018 57.66 22.811 56.567C20.835 55.591 20.088 54.232 21.223 52.23C22.17 50.557 21.692 49.534 20.322 48.227C14.059 42.249 11.581 34.68 13.323 26.366C15.29 16.982 24.104 12.036 33.588 17.151C34.969 17.897 36.011 18.667 37.79 17.558ZM30.579 46.352H41.392C39.527 41.837 37.887 37.864 35.955 33.188C34 37.975 32.409 41.872 30.579 46.352ZM51.875 27.11C50.449 21.762 44.554 20.084 40.488 23.832C40.043 24.242 39.66 25.249 39.854 25.735C42.134 31.427 44.53 37.072 47.111 43.248C51.774 38.336 53.489 33.161 51.875 27.11ZM31.431 23.862C28.944 20.884 23.721 21.275 21.521 24.5C17.813 29.937 19.292 37.755 24.718 43.009C24.925 42.952 29.694 31.71 31.892 26.221C32.148 25.58 31.891 24.415 31.431 23.862Z" fill="currentColor"/>
    </svg>
  `

  // Label
  const label = document.createElement('span')
  label.textContent = 'Save to Snack'

  snackMenuItem.appendChild(iconContainer)
  snackMenuItem.appendChild(label)

  // Hover effect
  snackMenuItem.addEventListener('mouseenter', () => {
    snackMenuItem.style.backgroundColor = 'rgba(231, 233, 234, 0.1)'
  })
  snackMenuItem.addEventListener('mouseleave', () => {
    snackMenuItem.style.backgroundColor = 'transparent'
  })

  // Prevent mousedown from triggering navigation
  snackMenuItem.addEventListener('mousedown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
  }, true)

  // Click handler - show list picker
  snackMenuItem.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    const linksToSave = currentShareMenuTweet?.links
    if (!linksToSave || linksToSave.length === 0) return

    // Close the share menu by pressing Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    // Small delay to let menu close, then show our picker
    setTimeout(() => {
      showShareMenuListPicker(linksToSave)
    }, 100)
  }, true) // Use capture phase

  // Insert after "Copy link" or at the beginning
  const copyLinkItem = Array.from(menuItems).find(item =>
    item.textContent?.toLowerCase().includes('copy link')
  )

  if (copyLinkItem && copyLinkItem.parentElement) {
    copyLinkItem.parentElement.insertBefore(snackMenuItem, copyLinkItem.nextSibling)
  } else {
    // Insert at the end before the last divider if exists
    const parent = firstMenuItem.parentElement
    if (parent) {
      parent.appendChild(snackMenuItem)
    }
  }
}

// Find the tweet that triggered the share menu
function findFocusedTweet(): Element | null {
  // Try to find by various methods
  const tweets = document.querySelectorAll('article[data-testid="tweet"]')
  for (const tweet of tweets) {
    // Check if any child has focus or was recently clicked
    if (tweet.contains(document.activeElement)) {
      return tweet
    }
  }
  // Return the first visible tweet as fallback
  return tweets[0] || null
}

// Show list picker modal for share menu
function showShareMenuListPicker(links: ExtractedLink[]) {
  // Create modal overlay
  const overlay = document.createElement('div')
  overlay.id = 'snack-share-picker-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // Create picker container
  const pickerContainer = document.createElement('div')
  pickerContainer.id = 'snack-share-picker'

  overlay.appendChild(pickerContainer)
  document.body.appendChild(overlay)

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove()
      currentShareMenuTweet = null
    }
  })

  // Close on escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove()
      currentShareMenuTweet = null
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)

  // Render the list dropdown
  shareMenuRoot = createRoot(pickerContainer)
  shareMenuRoot.render(
    React.createElement(ListDropdown, {
      lists,
      isLoading: isLoadingLists,
      isSaving: false,
      isAuthenticated: authState.isAuthenticated,
      onSelect: async (listId: string) => {
        try {
          await handleSave(listId, links)
          overlay.remove()
          currentShareMenuTweet = null
        } catch (error) {
          console.error('[Snack] Failed to save from share menu:', error)
        }
      },
      onCreate: async (title: string, emoji: string) => {
        try {
          const newList = await handleCreateList(title, emoji)
          await handleSave(newList.id, links)
          overlay.remove()
          currentShareMenuTweet = null
        } catch (error) {
          console.error('[Snack] Failed to create and save from share menu:', error)
        }
      },
      onSignIn: () => {
        handleSignIn()
        overlay.remove()
        currentShareMenuTweet = null
      },
      onClose: () => {
        overlay.remove()
        currentShareMenuTweet = null
      },
      linkCount: links.length,
    })
  )
}

// Observe for share dropdown menu
function observeShareMenu() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue

        // Look for dropdown menus - Twitter uses [data-testid="Dropdown"] or role="menu"
        const dropdownMenu = node.querySelector?.('[data-testid="Dropdown"]') ||
          (node.matches?.('[data-testid="Dropdown"]') ? node : null) ||
          node.querySelector?.('[role="menu"]') ||
          (node.matches?.('[role="menu"]') ? node : null)

        if (dropdownMenu) {
          // Check if it's a share menu by looking for "Copy link" text
          setTimeout(() => {
            const hasCopyLink = dropdownMenu.textContent?.toLowerCase().includes('copy link')
            const hasSharePost = dropdownMenu.textContent?.toLowerCase().includes('share post')
            if (hasCopyLink || hasSharePost) {
              injectShareMenuItem(dropdownMenu)
            }
          }, 50) // Small delay to ensure menu is fully rendered
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return observer
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

  // Start observing share menu
  observeShareMenu()

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
