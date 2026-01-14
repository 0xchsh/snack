import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to handle domain redirects
 *
 * Redirects all requests from app.snack.xyz to snack.xyz
 * preserving the full path and query string
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Redirect app.snack.xyz to snack.xyz
  if (host === 'app.snack.xyz' || host.startsWith('app.snack.xyz:')) {
    const url = request.nextUrl.clone()
    url.host = 'snack.xyz'
    url.port = '' // Remove any port number for production

    // Use 308 (Permanent Redirect) to preserve the request method
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - api/ routes that shouldn't redirect (webhooks, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
