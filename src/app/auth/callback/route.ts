import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'

  // For mock auth system, we don't need to handle OAuth callbacks
  // since signInWithGoogle in the useAuth hook handles everything client-side.
  // If someone hits this route, redirect them to sign-in page.
  
  console.log('OAuth callback hit - redirecting to sign-in (using mock auth)')
  return NextResponse.redirect(`${origin}/auth/sign-in?message=using_mock_auth`)
}