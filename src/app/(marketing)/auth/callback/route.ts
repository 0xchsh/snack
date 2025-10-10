import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth_error`)
      }

      if (data?.session) {
        console.log('OAuth callback successful, session created for:', data.session.user.email)
        
        // Get the user from the session
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userData?.user) {
          console.log('User verified:', userData.user.email)
          
          // Ensure user record exists in our users table
          const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', userData.user.id)
            .single()
          
          if (!existingUser && !userCheckError?.code?.includes('PGRST116')) {
            console.error('Error checking user record:', userCheckError)
          } else if (!existingUser) {
            // User doesn't exist, create one
            console.log('Creating user record for:', userData.user.email)
            const username = userData.user.user_metadata?.username || 
                            userData.user.email?.split('@')[0] || 
                            'user'
            
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: userData.user.id,
                username: username,
                first_name: userData.user.user_metadata?.first_name || null,
                last_name: userData.user.user_metadata?.last_name || null,
                email: userData.user.email,
                profile_picture_url: userData.user.user_metadata?.avatar_url || null,
                profile_is_public: true,
                bio: null,
                subscription_status: 'free',
                subscription_tier: 'free'
              })
            
            if (insertError) {
              console.error('Error creating user record:', insertError)
            } else {
              console.log('User record created successfully')
            }
          } else {
            console.log('User record already exists:', existingUser.username)
          }
        }
      }

      // Successful authentication, redirect to intended page
      console.log('OAuth callback successful, redirecting to:', next)
      
      // Use a small delay to ensure cookies are set
      const response = NextResponse.redirect(`${origin}${next}`)
      return response
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth_error`)
    }
  }

  // No code provided, redirect to sign-in
  return NextResponse.redirect(`${origin}/auth/sign-in`)
}