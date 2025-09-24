import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { linkId, listId } = await request.json()

    if (!linkId || !listId) {
      return NextResponse.json({ error: 'Link ID and List ID are required' }, { status: 400 })
    }

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Get client info
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Try to track the click (will silently fail if table doesn't exist)
    const { error } = await supabase
      .from('link_clicks')
      .insert({
        link_id: linkId,
        list_id: listId,
        clicker_id: user?.id || null,
        clicker_ip: ip,
        clicker_user_agent: userAgent,
        referrer: referrer
      })

    if (error && error.code !== '42P01') {
      // Only log if it's not a "table doesn't exist" error
      console.error('Error tracking click:', error)
    }

    // Always return success to avoid breaking the frontend
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in click tracking:', error)
    // Still return success to avoid breaking the frontend
    return NextResponse.json({ success: true })
  }
}