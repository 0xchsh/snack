import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Force Node.js runtime for better Supabase compatibility
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('OAuth callback received:', { code: !!code, origin, next })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Token exchange result:', { error: !!error })
    
    if (!error) {
      // Always use the current origin for redirect
      const redirectUrl = `${origin}${next}`
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  const errorUrl = `${origin}/auth/sign-in?error=Authentication%20failed`
  console.log('Auth failed, redirecting to:', errorUrl)
  return NextResponse.redirect(errorUrl)
}