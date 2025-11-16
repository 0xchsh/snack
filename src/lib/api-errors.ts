import { NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Standard API Error Types
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Business Logic
  OPERATION_FAILED = 'OPERATION_FAILED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
}

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Standard API Error Response Format
 */
interface ApiErrorResponse {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: any
  }
  timestamp: string
  path?: string
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error | PostgrestError | unknown,
  path?: string
): NextResponse<ApiErrorResponse> {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
        path,
      },
      { status: error.statusCode }
    )
  }

  // Handle PostgrestError (Supabase errors)
  if (isPostgrestError(error)) {
    const postgrestError = error as PostgrestError

    // Map common Postgres errors
    if (postgrestError.code === '23505') {
      return createErrorResponse(
        new ApiError(
          ApiErrorCode.ALREADY_EXISTS,
          'Resource already exists',
          409,
          { detail: postgrestError.details }
        ),
        path
      )
    }

    if (postgrestError.code === '23503') {
      return createErrorResponse(
        new ApiError(
          ApiErrorCode.NOT_FOUND,
          'Referenced resource not found',
          404,
          { detail: postgrestError.details }
        ),
        path
      )
    }

    return createErrorResponse(
      new ApiError(
        ApiErrorCode.DATABASE_ERROR,
        'Database operation failed',
        500,
        {
          code: postgrestError.code,
          details: postgrestError.details,
          hint: postgrestError.hint,
        }
      ),
      path
    )
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: error.message || 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
        },
        timestamp: new Date().toISOString(),
        path,
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined,
      },
      timestamp: new Date().toISOString(),
      path,
    },
    { status: 500 }
  )
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error === 'object' && 'code' in error && 'details' in error
}

/**
 * Common API Errors - Factory Functions
 */
export const ApiErrors = {
  unauthorized: (message = 'Authentication required') =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Access denied') =>
    new ApiError(ApiErrorCode.FORBIDDEN, message, 403),

  notFound: (resource = 'Resource', message?: string) =>
    new ApiError(
      ApiErrorCode.NOT_FOUND,
      message || `${resource} not found`,
      404
    ),

  alreadyExists: (resource = 'Resource', message?: string) =>
    new ApiError(
      ApiErrorCode.ALREADY_EXISTS,
      message || `${resource} already exists`,
      409
    ),

  validationError: (message: string, details?: any) =>
    new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 400, details),

  missingField: (fieldName: string) =>
    new ApiError(
      ApiErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${fieldName}`,
      400,
      { field: fieldName }
    ),

  invalidInput: (message: string, details?: any) =>
    new ApiError(ApiErrorCode.INVALID_INPUT, message, 400, details),

  rateLimitExceeded: (message = 'Rate limit exceeded. Please try again later.') =>
    new ApiError(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  internalError: (message = 'Internal server error', details?: any) =>
    new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, message, 500, details),

  databaseError: (message = 'Database operation failed', details?: any) =>
    new ApiError(ApiErrorCode.DATABASE_ERROR, message, 500, details),

  paymentRequired: (message = 'Payment required to access this resource') =>
    new ApiError(ApiErrorCode.PAYMENT_REQUIRED, message, 402),

  operationFailed: (operation: string, reason?: string) =>
    new ApiError(
      ApiErrorCode.OPERATION_FAILED,
      `${operation} failed${reason ? `: ${reason}` : ''}`,
      400
    ),
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
  path?: string
) {
  return async (...args: T): Promise<NextResponse<R | ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error(`API Error in ${path || 'unknown route'}:`, error)
      return createErrorResponse(error, path)
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(
    (field) => !body[field] && body[field] !== 0 && body[field] !== false
  )

  if (missingFields.length > 0) {
    throw ApiErrors.validationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    )
  }
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}
