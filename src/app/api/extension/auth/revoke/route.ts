import { NextRequest, NextResponse } from 'next/server'
import { revokeRefreshToken } from '@/lib/extension-auth'

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

// POST /api/extension/auth/revoke
// Revoke a refresh token (sign out)
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

    const success = await revokeRefreshToken(refresh_token)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke token' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error in POST /api/extension/auth/revoke:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
