import { NextResponse, type NextRequest } from 'next/server'
import { couldBeUsername, isReservedUsername } from './src/lib/username-utils'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Parse the pathname to get segments
  const segments = pathname.split('/').filter(segment => segment.length > 0)
  
  // If no segments, continue to home page
  if (segments.length === 0) {
    return NextResponse.next()
  }

  const firstSegment = segments[0]

  // Ensure we have a valid first segment
  if (!firstSegment) {
    return NextResponse.next()
  }

  // Check if first segment is a known static route
  const staticRoutes = [
    'auth', 'profile', 'dashboard', 'demo', 'public-demo', 'dashboard-simple', 'list'
  ]
  
  if (staticRoutes.includes(firstSegment)) {
    return NextResponse.next()
  }

  // If it's a reserved word, prevent it from matching username routes
  // This will let Next.js handle it normally (resulting in 404 if no actual route exists)
  if (isReservedUsername(firstSegment)) {
    return NextResponse.next()
  }

  // If it could be a username, let Next.js handle the routing
  // The dynamic routes [username] and [username]/[listId] will handle this
  if (couldBeUsername(firstSegment)) {
    return NextResponse.next()
  }

  // Let Next.js handle all other routes (will result in 404 if no match)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}