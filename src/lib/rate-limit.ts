import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { ApiErrors } from './api-errors'

/**
 * Rate Limit Configuration
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },

  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },

  // Write operations - tighter limits
  write: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 writes per minute
  },

  // Read operations - relaxed limits
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 reads per minute
  },

  // File uploads - very strict
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
  },
}

/**
 * In-memory rate limiter for development/fallback
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  async limit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      this.cleanup()
    }

    if (!entry || now > entry.resetTime) {
      // New window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return {
        success: true,
        remaining: maxRequests - 1,
        reset: now + windowMs,
      }
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    // Increment count
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      remaining: maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton instance for in-memory rate limiter
const inMemoryLimiter = new InMemoryRateLimiter()

/**
 * Create rate limiter instance
 * Uses Upstash Redis if configured, falls back to in-memory
 */
function createRateLimiter(maxRequests: number, windowMs: number) {
  // Check if Upstash Redis is configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    // Use Upstash Redis for production
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: 'ratelimit',
    })
  }

  // Fallback to in-memory for development
  console.warn(
    'Upstash Redis not configured - using in-memory rate limiting (not suitable for production)'
  )

  return {
    limit: async (identifier: string) => {
      const result = await inMemoryLimiter.limit(identifier, maxRequests, windowMs)
      return {
        success: result.success,
        limit: maxRequests,
        remaining: result.remaining,
        reset: result.reset,
      }
    },
  }
}

/**
 * Rate limit types
 */
export type RateLimitType = keyof typeof RATE_LIMITS

/**
 * Get rate limiter for a specific type
 */
export function getRateLimiter(type: RateLimitType) {
  const config = RATE_LIMITS[type]
  return createRateLimiter(config.max, config.windowMs)
}

/**
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   await checkRateLimit(request, 'write')
 *   // ... rest of your handler
 * }
 * ```
 */
export async function checkRateLimit(
  request: Request,
  type: RateLimitType = 'api',
  customIdentifier?: string
): Promise<void> {
  // Get identifier (IP address or custom identifier)
  const identifier = customIdentifier || getClientIdentifier(request)

  // Get rate limiter
  const limiter = getRateLimiter(type)

  // Check rate limit
  const result = await limiter.limit(identifier)

  if (!result.success) {
    const resetTime = new Date(result.reset)
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    throw ApiErrors.rateLimitExceeded(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    )
  }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or falls back to user agent
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies, load balancers, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip =
    cfConnectingIp ||
    realIp ||
    forwarded?.split(',')[0]?.trim() ||
    'unknown-ip'

  // Combine with user agent for better uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown-ua'

  return `${ip}:${userAgent.substring(0, 50)}` // Limit UA length
}

/**
 * Optional: Get remaining rate limit info without consuming a request
 */
export async function getRateLimitInfo(
  request: Request,
  type: RateLimitType = 'api'
): Promise<{
  limit: number
  remaining: number
  reset: number
}> {
  const identifier = getClientIdentifier(request)
  const limiter = getRateLimiter(type)
  const result = await limiter.limit(identifier)

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
