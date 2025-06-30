import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { User } from '@supabase/supabase-js';

// Server-only Supabase client with cookie support
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Server-only auth utilities
export const createServerAuth = () => {
  return {
    // Get current user on server
    getUser: async (): Promise<User | null> => {
      try {
        const supabaseServer = createServerSupabaseClient();
        const { data: { user }, error } = await supabaseServer.auth.getUser();
        
        if (error || !user) {
          return null;
        }
        
        return user;
      } catch (error) {
        console.error('Error getting server user:', error);
        return null;
      }
    },

    // Update user metadata (server-only)
    updateUserMetadata: async (userId: string, metadata: any) => {
      try {
        const supabaseServer = createServerSupabaseClient();
        const { error } = await supabaseServer.auth.updateUser({
          data: metadata
        });
        return { error };
      } catch (error) {
        console.error('Error updating user metadata:', error);
        return { error };
      }
    }
  };
};