import { supabaseAdmin } from './supabase-admin'
import { nanoid } from 'nanoid'
import crypto from 'crypto'

// Token expiration times
const ACCESS_TOKEN_EXPIRY_HOURS = 1
const REFRESH_TOKEN_EXPIRY_DAYS = 30
const AUTH_CODE_EXPIRY_MINUTES = 5

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// Generate a short auth code
function generateAuthCode(): string {
  return nanoid(32)
}

// Create a one-time auth code for the extension
export async function createAuthCode(
  userId: string,
  callbackUrl: string
): Promise<string> {
  const code = generateAuthCode()
  const expiresAt = new Date(
    Date.now() + AUTH_CODE_EXPIRY_MINUTES * 60 * 1000
  )

  const { error } = await supabaseAdmin.from('extension_auth_codes').insert({
    code,
    user_id: userId,
    callback_url: callbackUrl,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error('Failed to create auth code:', error)
    throw new Error('Failed to create auth code')
  }

  return code
}

// Exchange an auth code for tokens
export async function exchangeAuthCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
  user: {
    id: string
    email: string
    username: string | null
    profilePictureUrl: string | null
  }
} | null> {
  // Find and validate the auth code
  const { data: authCode, error: codeError } = await supabaseAdmin
    .from('extension_auth_codes')
    .select('*')
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (codeError || !authCode) {
    return null
  }

  // Mark code as used
  await supabaseAdmin
    .from('extension_auth_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', authCode.id)

  // Get user data
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, username, profile_picture_url')
    .eq('id', authCode.user_id)
    .single()

  if (userError || !user) {
    return null
  }

  // Generate tokens
  const accessToken = generateToken()
  const refreshToken = generateToken()
  const now = Date.now()
  const accessTokenExpiresAt = now + ACCESS_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  const refreshTokenExpiresAt =
    now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000

  // Store tokens
  const { error: tokenError } = await supabaseAdmin.from('extension_tokens').insert({
    user_id: user.id,
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_expires_at: new Date(accessTokenExpiresAt).toISOString(),
    refresh_token_expires_at: new Date(refreshTokenExpiresAt).toISOString(),
  })

  if (tokenError) {
    console.error('Failed to create tokens:', tokenError)
    throw new Error('Failed to create tokens')
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      profilePictureUrl: user.profile_picture_url,
    },
  }
}

// Refresh an access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  accessTokenExpiresAt: number
} | null> {
  // Find the token record
  const { data: tokenRecord, error } = await supabaseAdmin
    .from('extension_tokens')
    .select('*')
    .eq('refresh_token', refreshToken)
    .is('revoked_at', null)
    .gt('refresh_token_expires_at', new Date().toISOString())
    .single()

  if (error || !tokenRecord) {
    return null
  }

  // Generate new access token
  const newAccessToken = generateToken()
  const accessTokenExpiresAt =
    Date.now() + ACCESS_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000

  // Update the record
  const { error: updateError } = await supabaseAdmin
    .from('extension_tokens')
    .update({
      access_token: newAccessToken,
      access_token_expires_at: new Date(accessTokenExpiresAt).toISOString(),
      last_used_at: new Date().toISOString(),
    })
    .eq('id', tokenRecord.id)

  if (updateError) {
    console.error('Failed to refresh token:', updateError)
    return null
  }

  return {
    accessToken: newAccessToken,
    accessTokenExpiresAt,
  }
}

// Validate an access token and return the user
export async function validateAccessToken(accessToken: string): Promise<{
  userId: string
  tokenId: string
} | null> {
  const { data: tokenRecord, error } = await supabaseAdmin
    .from('extension_tokens')
    .select('id, user_id')
    .eq('access_token', accessToken)
    .is('revoked_at', null)
    .gt('access_token_expires_at', new Date().toISOString())
    .single()

  if (error || !tokenRecord) {
    return null
  }

  // Update last used
  await supabaseAdmin
    .from('extension_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRecord.id)

  return {
    userId: tokenRecord.user_id,
    tokenId: tokenRecord.id,
  }
}

// Revoke a refresh token (sign out)
export async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('extension_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('refresh_token', refreshToken)
    .is('revoked_at', null)

  return !error
}

// Revoke all tokens for a user
export async function revokeAllUserTokens(userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('extension_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null)

  return !error
}
