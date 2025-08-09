'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { AuthUser, userDb } from '@/lib/auth';

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create auth context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshUser: async () => {},
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createClient();

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setError(error);
        setUser(null);
      } else {
        setUser(user as AuthUser);
        setError(null);
        
        // Ensure user exists in database
        if (user) {
          await userDb.upsertUser(user as AuthUser);
        }
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err as AuthError);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error);
      } else {
        setUser(null);
        setSession(null);
        setError(null);
      }
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Force stop loading after 5 seconds to prevent infinite loops
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session result:', { 
          hasSession: !!session, 
          error: error?.message || null,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
          setError(error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user as AuthUser || null);
          setError(null);
          
          // Ensure user exists in database
          if (session?.user) {
            console.log('Upserting user to database...');
            try {
              const result = await userDb.upsertUser(session.user as AuthUser);
              if (result.error) {
                console.warn('User upsert failed:', result.error);
              }
            } catch (upsertErr) {
              console.warn('User upsert error:', upsertErr);
            }
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        if (mounted) {
          setError(err as AuthError);
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('Setting loading to false');
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user as AuthUser || null);
        setLoading(false);
        setError(null);

        // Ensure user exists in database on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await userDb.upsertUser(session.user as AuthUser);
          } catch (err) {
            console.warn('Failed to upsert user on sign in:', err);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for user data (similar to Clerk's useUser)
export const useUser = () => {
  const { user, loading, error } = useAuth();
  
  return {
    user,
    isLoaded: !loading,
    isSignedIn: !!user,
    loading,
    error,
  };
};

// Hook for session data
export const useSession = () => {
  const { session, loading, error } = useAuth();
  
  return {
    session,
    isLoaded: !loading,
    loading,
    error,
  };
};

// Hook for auth actions
export const useAuthActions = () => {
  const { signOut, refreshUser } = useAuth();
  
  return {
    signOut,
    refreshUser,
  };
};

// Hook for checking if user is authenticated
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in page
      window.location.href = '/auth/sign-in';
    }
  }, [user, loading]);
  
  return { user, loading };
};