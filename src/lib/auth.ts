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

    // Try to get user profile from our users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // If database table doesn't exist or user not found, create from auth user
    if (error || !user) {
      // For development: create user object from auth data when DB doesn't exist
      return {
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.email?.split('@')[0] || 'user',
        first_name: authUser.user_metadata?.first_name || null,
        last_name: authUser.user_metadata?.last_name || null,
        profile_picture_url: authUser.user_metadata?.avatar_url || null,
        profile_is_public: true,
        bio: authUser.user_metadata?.bio || null,
        avatar_url: null,
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_connected_at: null,
        stripe_customer_id: null,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at
      }
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
