import { createClient } from '@/utils/supabase/client';
import { createAdminSupabaseClient } from './supabase';
import { User, Session } from '@supabase/supabase-js';

// Types
export interface AuthUser extends User {
  user_metadata: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface AuthSession extends Session {
  user: AuthUser;
}

// Client-side auth utilities
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getUser: async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Update user metadata
  updateUser: async (attributes: {
    email?: string;
    password?: string;
    data?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  // Social sign in
  signInWithProvider: async (provider: 'github' | 'google' | 'discord') => {
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/api/auth/callback`;
    console.log('OAuth redirect URL being used:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },
};

// Note: Server-side auth utilities have been moved to auth-server.ts

// Database user management utilities
export const userDb = {
  // Create or update user in database
  upsertUser: async (authUser: AuthUser) => {
    try {
      const supabase = createClient();
      console.log('Upserting user with data:', {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      });

      // Extract user data with proper fallbacks
      const userData = {
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.user_metadata?.username || 
                 authUser.user_metadata?.preferred_username || 
                 authUser.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') || 
                 `user_${Date.now()}`,
        first_name: authUser.user_metadata?.first_name || 
                   authUser.user_metadata?.given_name || 
                   authUser.user_metadata?.full_name?.split(' ')[0] ||
                   authUser.user_metadata?.name?.split(' ')[0] || '',
        last_name: authUser.user_metadata?.last_name || 
                  authUser.user_metadata?.family_name || 
                  authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                  authUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: authUser.user_metadata?.avatar_url || 
                   authUser.user_metadata?.picture || null,
        updated_at: new Date().toISOString(),
      };

      console.log('Final user data for upsert:', userData);

      const { data, error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Database upsert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('User metadata:', authUser.user_metadata);
        console.error('Attempted upsert data:', userData);
      } else {
        console.log('User upserted successfully:', data);
      }

      return { data, error };
    } catch (err) {
      console.error('Upsert user error:', err);
      return { data: null, error: err };
    }
  },

  // Get user by ID
  getById: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Get user by username
  getByUsername: async (username: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Check if username is available
  isUsernameAvailable: async (username: string, excludeUserId?: string) => {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;
    
    if (error) {
      return { available: false, error };
    }

    return { available: data.length === 0, error: null };
  },
};

// Admin utilities for user management
export const adminAuth = {
  // Delete user (requires service role key)
  deleteUser: async (userId: string) => {
    const adminClient = createAdminSupabaseClient();
    
    // Delete from auth first
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      return { error: authError };
    }

    // Delete from database
    const { error: dbError } = await adminClient
      .from('users')
      .delete()
      .eq('id', userId);

    return { error: dbError };
  },

  // Create user with admin privileges
  createUser: async (email: string, password: string, metadata?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const adminClient = createAdminSupabaseClient();
    
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata || {},
      email_confirm: true, // Auto-confirm email for admin created users
    });

    return { data, error };
  },
};