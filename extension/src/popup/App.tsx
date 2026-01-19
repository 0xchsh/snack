import React, { useEffect, useState } from 'react'
import type { AuthState, SnackList, MessageResponse } from '@/shared/types'
import { LoginScreen } from './components/LoginScreen'
import { ListSelector } from './components/ListSelector'
import { Settings } from './components/Settings'

type Screen = 'main' | 'settings'

export function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
  })
  const [lists, setLists] = useState<SnackList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<Screen>('main')

  // Fetch auth state on mount
  useEffect(() => {
    fetchAuthState()
  }, [])

  // Fetch lists when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchLists()
    }
  }, [authState.isAuthenticated])

  async function fetchAuthState() {
    setIsLoading(true)
    try {
      const response: MessageResponse<AuthState> = await chrome.runtime.sendMessage({
        type: 'GET_AUTH_STATE',
      })
      if (response.success && response.data) {
        setAuthState(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchLists() {
    setIsLoadingLists(true)
    try {
      const response: MessageResponse<SnackList[]> = await chrome.runtime.sendMessage({
        type: 'GET_LISTS',
      })
      if (response.success && response.data) {
        setLists(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error)
    } finally {
      setIsLoadingLists(false)
    }
  }

  async function handleSignIn() {
    await chrome.runtime.sendMessage({ type: 'SIGN_IN' })
    // Close popup - user will authenticate in new tab
    window.close()
  }

  async function handleSignOut() {
    await chrome.runtime.sendMessage({ type: 'SIGN_OUT' })
    setAuthState({ isAuthenticated: false, user: null, tokens: null })
    setLists([])
    setCurrentScreen('main')
  }

  if (isLoading) {
    return (
      <div className="popup-container flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-snack-border border-t-snack-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!authState.isAuthenticated) {
    return <LoginScreen onSignIn={handleSignIn} />
  }

  if (currentScreen === 'settings') {
    return (
      <Settings
        user={authState.user!}
        onBack={() => setCurrentScreen('main')}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <ListSelector
      user={authState.user!}
      lists={lists}
      isLoading={isLoadingLists}
      onOpenSettings={() => setCurrentScreen('settings')}
      onRefresh={fetchLists}
    />
  )
}
