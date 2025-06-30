'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { userDb } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    let hasProcessed = false;
    
    const processOAuthCallback = async () => {
      if (hasProcessed) return;
      hasProcessed = true;
      
      try {
        console.log('Processing OAuth callback...');
        setStatus('Extracting tokens...');
        
        // Check if we have OAuth tokens in the URL hash
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('OAuth tokens found in hash, processing...');
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            setStatus('Creating session...');
            console.log('Setting session with tokens...');
            
            // Extract and set session from OAuth callback hash
            console.log('Calling setSession with tokens...');
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('setSession timeout')), 5000)
            );
            
            try {
              const { data, error } = await Promise.race([
                supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                }),
                timeoutPromise
              ]) as any;
              
              console.log('setSession response:', {
                hasData: !!data,
                hasSession: !!data?.session,
                hasUser: !!data?.session?.user,
                error: error
              });
              
              // Continue with the existing logic
              if (error) {
                throw error;
              }
              
              // If successful, continue processing
              if (!data?.session?.user) {
                throw new Error('No session created');
              }
              
              // Session created successfully - continue with original flow
              setStatus('Creating user profile...');
              console.log('Session created, user data:', {
                id: data.session.user.id,
                email: data.session.user.email,
                metadata: data.session.user.user_metadata
              });
              
              // Manually upsert user to database
              const upsertResult = await userDb.upsertUser(data.session.user as any);
              
              if (upsertResult.error) {
                console.error('User upsert failed, but continuing...', upsertResult.error);
                // Don't fail the login for database errors
              } else {
                console.log('User upserted successfully');
              }
              
              setStatus('Redirecting...');
              console.log('Redirecting to dashboard');
              
              // Clear the hash from URL and redirect
              window.history.replaceState(null, '', window.location.pathname);
              
              // Add small delay to ensure state is settled
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
              return;
              
            } catch (err: any) {
              console.error('Session creation failed:', err);
              
              // Try alternative method - direct navigation with tokens
              console.log('Trying alternative method...');
              setStatus('Using alternative login method...');
              
              // Store tokens in localStorage temporarily
              localStorage.setItem('supabase.auth.token', JSON.stringify({
                currentSession: {
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  expires_at: Math.floor(Date.now() / 1000) + 3600
                }
              }));
              
              // Force reload to trigger auth detection
              window.location.href = '/dashboard';
              return;
            }
          }
        }

        // If we get here, something went wrong
        console.log('No valid tokens found or session creation failed');
        router.push('/auth/sign-in?error=Authentication failed');
        
      } catch (err) {
        console.error('OAuth callback error:', err);
        router.push('/auth/sign-in?error=Authentication failed');
      }
    };

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(processOAuthCallback, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
      </div>
    </div>
  );
}