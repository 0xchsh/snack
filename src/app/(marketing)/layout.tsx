import { TopBar, BrandMark } from '@/components/primitives'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

/**
 * Marketing Layout
 *
 * Used for public-facing pages: home, auth pages
 * Features larger branding and auth CTAs
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm"
      >
        Skip to content
      </a>

      <TopBar variant="marketing">
        <TopBar.Left>
          <BrandMark variant="marketing" href="/" />
        </TopBar.Left>

        <TopBar.Right>
          <ThemeToggle />
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </Link>
        </TopBar.Right>
      </TopBar>

      <main id="main-content">
        {children}
      </main>
    </>
  )
}
