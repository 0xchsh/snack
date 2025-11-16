import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { ApiErrors, createErrorResponse, createSuccessResponse } from '@/lib/api-errors'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // Sign out from Supabase (clears session)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase sign out error:', error)
      throw ApiErrors.operationFailed('Sign out', error.message)
    }

    // Clear all auth-related cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Delete all Supabase auth cookies
    allCookies.forEach((cookie) => {
      if (
        cookie.name.startsWith('sb-') ||
        cookie.name.includes('auth-token') ||
        cookie.name.includes('supabase')
      ) {
        cookieStore.delete(cookie.name)
      }
    })

    // Create success response
    const response = createSuccessResponse(
      null,
      200,
      'Successfully signed out'
    )

    // Set cache headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    return createErrorResponse(error, '/api/auth/signout')
  }
}