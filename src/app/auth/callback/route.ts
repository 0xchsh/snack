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