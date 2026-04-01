import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const openRunde = localFont({
  src: [
    { path: '../../public/fonts/OpenRunde-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/OpenRunde-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/OpenRunde-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/OpenRunde-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toast'
import { AuthProvider } from '@/hooks/useAuth'
import { QueryProvider } from '@/providers/query-provider'
import { Agentation } from 'agentation'

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
    <html lang="en" suppressHydrationWarning className={openRunde.variable}>
      <head>
        <script src="https://cdn.visitors.now/v.js" data-token="706f3ada-f68c-4ce3-b72f-22bb1cb34d8c" data-persist></script>
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </QueryProvider>
          </ErrorBoundary>
          <Toaster />
          {process.env.NODE_ENV === 'development' && <Agentation />}
        </ThemeProvider>
      </body>
    </html>
  )
}
