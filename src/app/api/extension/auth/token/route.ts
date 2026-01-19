import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthCode } from '@/lib/extension-auth'

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/extension/auth/token
// Exchange an auth code for access and refresh tokens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await exchangeAuthCode(code)

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        access_token_expires_at: result.accessTokenExpiresAt,
        refresh_token_expires_at: result.refreshTokenExpiresAt,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          profile_picture_url: result.user.profilePictureUrl,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in POST /api/extension/auth/token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
