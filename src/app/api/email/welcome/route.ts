import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { WelcomeEmail } from '@/emails/welcome'

// Webhook secret for Supabase webhooks (optional but recommended)
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // If webhook secret is set, verify it
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Handle Supabase webhook payload format
    // Supabase sends: { type: 'INSERT', table: 'users', record: { ... }, ... }
    const email = body.record?.email || body.email
    const username = body.record?.username || body.username || body.record?.email?.split('@')[0]

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send welcome email
    const result = await sendEmail({
      to: email,
      subject: 'Welcome to Snack',
      react: WelcomeEmail({ username }),
    })

    return NextResponse.json({
      success: true,
      messageId: result.id,
    })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
