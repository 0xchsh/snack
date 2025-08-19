import { createClient } from './supabase'
import type { User } from '@/types'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Client-side auth utilities
export const auth = {
  async signUp(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  },

  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  },

  async signOut() {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new AuthError(error.message)
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return null
    }

    // Get user profile from our users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error || !user) {
      return null
    }

    return user
  },

  async signInWithGoogle() {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = createClient()
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  },
}