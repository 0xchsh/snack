'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, redirectTo?: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to add timeout to promises
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch full user profile from our users table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        // This is expected if the users table doesn't exist or user has no profile yet
        console.log('User profile not found, using auth data:', error.message || 'No profile record')
        // Fallback to basic user data from auth with safe defaults
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || null,
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
          first_name: null,
          last_name: null,
          profile_picture_url: null,
          profile_is_public: true,
          bio: null,
          avatar_url: null,
          stripe_account_id: null,
          stripe_account_status: null,
          stripe_connected_at: null,
          stripe_customer_id: null,
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at || supabaseUser.created_at
        }
      }

      // Return the user profile from database
      return userProfile
    } catch (error) {
      console.log('Could not fetch user profile, using auth data')
      // Return basic user data as final fallback
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || null,
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
        first_name: null,
        last_name: null,
        profile_picture_url: null,
        profile_is_public: true,
        bio: null,
        avatar_url: null,
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_connected_at: null,
        stripe_customer_id: null,
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at || supabaseUser.created_at
      }
    }
  }

  useEffect(() => {
    let mounted = true
    
    // Immediately check if we're in a browser environment
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    
    console.log('useAuth: Initializing auth check...')
    
    // Check if we have a session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Fetching session from Supabase...')
        
        // Get the session with timeout
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          2000 // 2 second timeout - more aggressive
        )
        
        if (!mounted) return
        
        console.log('useAuth: Session check complete:', { 
          hasSession: !!session, 
          hasError: !!error,
          userEmail: session?.user?.email 
        })
        
        if (error) {
          console.error('useAuth: Session error:', error)
          setUser(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('useAuth: Found session for user:', session.user.email)
          
          // Use session data directly
         const emailPrefix = session.user.email?.split('@')[0] || 'user'
         const basicUser: User = {
           id: session.user.id,
           email: session.user.email || null,
           username: session.user.user_metadata?.username || `@${emailPrefix}`,
           first_name: session.user.user_metadata?.first_name || null,
           last_name: session.user.user_metadata?.last_name || null,
           profile_picture_url: session.user.user_metadata?.avatar_url || null,
            profile_is_public: true,
            bio: null,
            avatar_url: null,
            stripe_account_id: null,
            stripe_account_status: null,
            stripe_connected_at: null,
            stripe_customer_id: null,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
         }
          
          setUser(basicUser)
          console.log('useAuth: User state updated')
          
          // Try to fetch full profile in background
          fetchUserProfile(session.user).then(profile => {
            if (mounted && profile) {
              console.log('useAuth: Full profile fetched')
              setUser(profile)
            }
          }).catch(err => {
            console.log('useAuth: Profile fetch failed, using session data', err)
          })
        } else {
          console.log('useAuth: No active session found')
          setUser(null)
        }
      } catch (error) {
        console.error('useAuth: Session check failed:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          console.log('useAuth: Loading complete')
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Failsafe timeout to prevent indefinite loading
    const failsafeTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('useAuth: Failsafe timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second failsafe

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || null,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
          first_name: null,
          last_name: null,
          profile_picture_url: null,
          profile_is_public: true,
          bio: null,
          avatar_url: null,
          stripe_account_id: null,
          stripe_account_status: null,
          stripe_connected_at: null,
          stripe_customer_id: null,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at
        }
        setUser(basicUser)
        
        // Try to fetch full profile in background
        fetchUserProfile(session.user).then(profile => {
          if (profile) {
            setUser(profile)
          }
        }).catch(err => {
          console.log('Profile fetch failed in auth state change:', err)
        })
      } else {
        setUser(null)
      }
    })
    
    return () => {
      mounted = false
      clearTimeout(failsafeTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, redirectTo?: string) => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Redirect after successful login
      if (redirectTo) {
        window.location.href = redirectTo
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0]
          }
        }
      })

      if (error) {
        throw error
      }

      // For email confirmation flow, user will need to check their email
      console.log('Sign up successful - check email for confirmation')
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Redirect to home page after logout
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo || '/dashboard')}`
        }
      })

      if (error) {
        throw error
      }
      
      // OAuth redirect will handle the rest
    } catch (error) {
      console.error('Google sign in error:', error)
      setLoading(false)
      throw error
    }
  }

  const refreshSession = async () => {
    console.log('Manually refreshing session...')
    setLoading(true)
    
    try {
      // First try to refresh the token with timeout
      try {
        const { data: refreshData, error: refreshError } = await withTimeout(
          supabase.auth.refreshSession(),
          3000
        )
        
        if (refreshError) {
          console.log('Token refresh failed, getting current session:', refreshError.message)
        } else if (refreshData?.session) {
          console.log('Token refreshed successfully')
        }
      } catch (timeoutError) {
        console.log('Token refresh timed out, continuing...')
      }
      
      // Now get the current session with timeout
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        3000
      )
      
      if (error) {
        console.error('Error getting session:', error)
        setUser(null)
        return
      }
      
      if (session?.user) {
        console.log('Session found for:', session.user.email)
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || null,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
          first_name: session.user.user_metadata?.first_name || null,
          last_name: session.user.user_metadata?.last_name || null,
          profile_picture_url: session.user.user_metadata?.avatar_url || null,
          profile_is_public: true,
          bio: session.user.user_metadata?.bio || null,
          avatar_url: null,
          stripe_account_id: null,
          stripe_account_status: null,
          stripe_connected_at: null,
          stripe_customer_id: null,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at
        }
        setUser(basicUser)
        console.log('User state updated from session')
        
        // Try to fetch full profile
        fetchUserProfile(session.user).then(profile => {
          if (profile) {
            console.log('Full profile loaded')
            setUser(profile)
          }
        }).catch(err => {
          console.log('Profile fetch failed:', err)
        })
      } else {
        console.log('No session found during refresh')
        setUser(null)
      }
    } catch (error) {
      console.error('Refresh session error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
