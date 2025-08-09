import { NextRequest, NextResponse } from 'next/server';
import { createServerAuth } from "@/lib/auth-server"
import { createClient } from "@/utils/supabase/server"
import { z } from 'zod';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_REQUESTS = 10; // 10 requests per minute

const checkUsernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username must be 15 characters or less')
    .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers (no spaces or special characters)')
});

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = checkUsernameSchema.parse(body);
    const { username } = validatedData;

    const supabase = await createClient();
    
    // Check if username is available (excluding current user)
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Ignore no-rows error
      throw error;
    }

    const isAvailable = !existingUser;

    return NextResponse.json({
      available: isAvailable,
      username,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });

  } catch (error: unknown) {
    console.error('Username check error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid username format',
          details: error.errors[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 