import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('API: Checking auth...')
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('API: Auth check error:', error)
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      })
    }
    
    if (session) {
      console.log('API: Session found for:', session.user.email)
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        }
      })
    }
    
    console.log('API: No session found')
    return NextResponse.json({ 
      authenticated: false,
      message: 'No session' 
    })
  } catch (error) {
    console.error('API: Unexpected error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Server error' 
    }, { status: 500 })
  }
}