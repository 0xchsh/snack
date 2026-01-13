import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/toast'
import { AuthProvider } from '@/hooks/useAuth'
import { QueryProvider } from '@/providers/query-provider'

export const metadata: Metadata = {
  title: 'Snack - Curated Link Collections',
  description: 'Create, organize, and share curated collections of links',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'Snack - Curated Link Collections',
    description: 'Your favorite links all in one place.',
    images: [
      {
        url: '/images/og-image.png',
        width: 3840,
        height: 2160,
        alt: 'Snack - Your favorite links all in one place',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snack - Curated Link Collections',
    description: 'Your favorite links all in one place.',
    images: ['/images/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="snack-theme">
          <ErrorBoundary>
            <QueryProvider>
              <ToastProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </ToastProvider>
            </QueryProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
