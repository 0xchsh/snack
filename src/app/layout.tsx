import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ListsProvider } from '@/hooks/useLists'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Snack - Curated Link Collections',
  description: 'Create, organize, and share curated collections of links',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="snack-theme">
          <AuthProvider>
            <ListsProvider>
              {children}
            </ListsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}