import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAuthCode } from '@/lib/extension-auth'

// POST /api/extension/auth/authorize
// Generate a one-time auth code for the extension
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get callback URL from request body
    const body = await request.json().catch(() => ({}))
    const callbackUrl = body.callback_url

    if (!callbackUrl) {
      return NextResponse.json(
        { error: 'callback_url is required' },
        { status: 400 }
      )
    }

    // Validate callback URL (must be chrome-extension://, http://localhost, or snack.xyz callback)
    const isValidCallback =
      callbackUrl.startsWith('chrome-extension://') ||
      callbackUrl.startsWith('http://localhost') ||
      callbackUrl.startsWith('https://snack.xyz/extension/callback')

    if (!isValidCallback) {
      return NextResponse.json(
        { error: 'Invalid callback URL' },
        { status: 400 }
      )
    }

    // Create auth code
    const code = await createAuthCode(user.id, callbackUrl)

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error in POST /api/extension/auth/authorize:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
