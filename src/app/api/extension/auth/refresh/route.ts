import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/extension-auth'

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

// POST /api/extension/auth/refresh
// Refresh an access token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'refresh_token is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await refreshAccessToken(refresh_token)

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        access_token: result.accessToken,
        access_token_expires_at: result.accessTokenExpiresAt,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in POST /api/extension/auth/refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
