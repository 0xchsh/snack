import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  username?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snack.so'

export function WelcomeEmail({ username = 'there' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Snack - Start curating your links</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>snack</Text>
          </Section>

          <Heading style={heading}>Welcome to Snack</Heading>

          <Text style={paragraph}>Hey {username},</Text>

          <Text style={paragraph}>
            Thanks for joining Snack. We're excited to have you here.
          </Text>

          <Text style={paragraph}>
            Snack is the simplest way to curate and share collections of links.
            Create lists for your favorite resources, share them with your
            audience, and discover what others are curating.
          </Text>

          <Section style={buttonSection}>
            <Link href={`${baseUrl}/dashboard`} style={button}>
              Create your first list
            </Link>
          </Section>

          <Text style={paragraph}>
            Here are a few things you can do to get started:
          </Text>

          <Text style={listItem}>
            <strong>1. Create a list</strong> - Curate links around a topic you
            care about
          </Text>
          <Text style={listItem}>
            <strong>2. Customize your profile</strong> - Add a bio and profile
            picture
          </Text>
          <Text style={listItem}>
            <strong>3. Share your lists</strong> - Every list has a shareable
            link
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Just reply to this email - we're here to help.
          </Text>

          <Text style={footer}>
            — The Snack Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const logoSection = {
  padding: '0 0 24px',
}

const logoText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#0a0a0a',
  margin: '0',
  letterSpacing: '-0.5px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#0a0a0a',
  margin: '0 0 24px',
  padding: '0',
  lineHeight: '1.3',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#404040',
  margin: '0 0 16px',
}

const listItem = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#404040',
  margin: '0 0 12px',
  paddingLeft: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0a0a0a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e5e5e5',
  borderTop: '1px solid #e5e5e5',
  margin: '32px 0',
}

const footer = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#737373',
  margin: '0 0 8px',
}
