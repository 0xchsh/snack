'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, redirectTo?: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true)
    
    // Simple mock auth initialization
    console.log('Mock auth: Initializing AuthProvider...')
    
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('mock-auth-user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log('Mock auth: Found stored user, setting user state:', parsedUser)
          setUser(parsedUser)
        } else {
          console.log('Mock auth: No stored user found, user remains null')
          setUser(null)
        }
      } catch (error) {
        console.error('Mock auth: Error parsing stored user', error)
        localStorage.removeItem('mock-auth-user')
        setUser(null)
      }
      
      // Set loading to false after checking auth
      console.log('Mock auth: Setting loading to false')
      setLoading(false)
    }

    // Run immediately
    initAuth()
  }, [])

  const signIn = async (email: string, password: string, redirectTo?: string) => {
    console.log('Mock auth: Signing in with email', email)
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create mock user
    const mockUser: User = {
      id: 'mock-user-id',
      email: email,
      username: email?.split('@')[0] || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setUser(mockUser)
    localStorage.setItem('mock-auth-user', JSON.stringify(mockUser))
    setLoading(false)
    console.log('Mock auth: Sign in complete', mockUser)
    
    // Redirect after successful login
    setTimeout(() => {
      window.location.href = redirectTo || '/dashboard'
    }, 100)
  }

  const signUp = async (email: string, password: string) => {
    console.log('Mock auth: Signing up with email', email)
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For mock, sign up = sign in
    await signIn(email, password)
  }

  const signOut = async () => {
    console.log('Mock auth: Signing out')
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setUser(null)
    localStorage.removeItem('mock-auth-user')
    setLoading(false)
    console.log('Mock auth: Sign out complete')
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    console.log('Mock auth: Signing in with Google')
    
    // Create mock Google user
    const mockGoogleUser: User = {
      id: 'mock-google-user-id',
      email: 'demo@gmail.com',
      username: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setUser(mockGoogleUser)
    localStorage.setItem('mock-auth-user', JSON.stringify(mockGoogleUser))
    console.log('Mock auth: Google sign in complete', mockGoogleUser)
    
    // Redirect after successful login
    setTimeout(() => {
      window.location.href = redirectTo || '/dashboard'
    }, 100)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
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