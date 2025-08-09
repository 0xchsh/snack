import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Force Node.js runtime instead of Edge Runtime for Supabase compatibility
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Only run middleware on dashboard routes - disable for auth routes
    "/dashboard/:path*",
  ],
}; 