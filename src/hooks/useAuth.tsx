'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
    // Force stop loading after 3 seconds to prevent infinite loops
    const loadingTimeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing loading to false');
      setLoading(false);
    }, 3000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        console.log('Current URL:', window.location.href);
        console.log('URL has hash:', !!window.location.hash);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session result:', { 
          hasSession: !!session, 
          error: error?.message || null,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          } : null
        });
        
        if (error) {
          console.error('Session error:', error);
          setError(error);
        } else {
          setSession(session);
          setUser(session?.user as AuthUser || null);
          
          // Ensure user exists in database
          if (session?.user) {
            console.log('Upserting user to database...');
            const result = await userDb.upsertUser(session.user as AuthUser);
            console.log('Upsert result:', result.error ? { error: result.error } : { success: true });
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setError(err as AuthError);
      } finally {
        console.log('Setting loading to false');
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user as AuthUser || null);
        setLoading(false);
        setError(null);

        // Ensure user exists in database on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          await userDb.upsertUser(session.user as AuthUser);
        }
      }
    );

    return () => {
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