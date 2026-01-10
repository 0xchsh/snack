import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender - update this to your verified domain
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Snack <onboarding@resend.dev>'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  react?: React.ReactElement
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, react, text, from = DEFAULT_FROM, replyTo } = options

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      react,
      text,
      replyTo,
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw new Error(error.message)
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

export { resend }
