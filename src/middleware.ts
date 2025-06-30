import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from '@/types/database';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/lists',
  '/api/saved-lists',
  '/api/user',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/api/og-data',
  '/api/keep-alive',
  '/api/test-db',
];

// Check if a path matches any pattern in the array
const matchesPattern = (path: string, patterns: string[]): boolean => {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(css|js|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (matchesPattern(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  // For user profile routes like /[username]/[listId], allow public access
  const isUserProfileRoute = pathname.match(/^\/[^\/]+\/[^\/]+$/);
  if (isUserProfileRoute) {
    return NextResponse.next();
  }

  // For test routes like /test/[listId], allow public access
  if (pathname.startsWith('/test/')) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = matchesPattern(pathname, protectedRoutes);

  if (requiresAuth) {
    try {
      const response = NextResponse.next();
      
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options });
              response.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();

      // If no user or error, redirect to sign in
      if (error || !user) {
        const url = request.nextUrl.clone();
        
        // For API routes, return 401
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        // For page routes, redirect to sign in
        url.pathname = '/auth/sign-in';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      // User is authenticated, continue
      return response;
    } catch (error) {
      console.error('Middleware auth error:', error);
      
      // On error, redirect to sign in for safety
      const url = request.nextUrl.clone();
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }

      url.pathname = '/auth/sign-in';
      return NextResponse.redirect(url);
    }
  }

  // For all other routes, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 