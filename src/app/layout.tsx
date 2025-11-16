import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ListsProvider } from '@/hooks/useLists'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/toast'

export const metadata: Metadata = {
  title: 'Snack - Curated Link Collections',
  description: 'Create, organize, and share curated collections of links',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
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
            <ToastProvider>
              <AuthProvider>
                <ListsProvider>
                  {children}
                </ListsProvider>
              </AuthProvider>
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
