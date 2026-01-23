export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
    this.name = 'ExternalServiceError';
  }
}

// Error classification for retry logic
export interface ErrorClassification {
  isRetryable: boolean;
  retryAfter?: number; // milliseconds
  shouldNotify: boolean;
  category: 'validation' | 'auth' | 'network' | 'rate_limit' | 'external' | 'internal';
}

export function classifyError(error: Error): ErrorClassification {
  // Rate limit errors
  if (error instanceof RateLimitError || (error as any).status === 429) {
    return {
      isRetryable: true,
      retryAfter: 60000, // 1 minute
      shouldNotify: false,
      category: 'rate_limit',
    };
  }

  // Network errors
  if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH'].includes((error as any).code)) {
    return {
      isRetryable: true,
      retryAfter: 5000,
      shouldNotify: true,
      category: 'network',
    };
  }

  // External service errors (5xx)
  if (error instanceof ExternalServiceError || (500 <= (error as any).status && (error as any).status < 600)) {
    return {
      isRetryable: true,
      retryAfter: 10000,
      shouldNotify: true,
      category: 'external',
    };
  }

  // Validation errors - never retry
  if (error instanceof ValidationError) {
    return {
      isRetryable: false,
      shouldNotify: false,
      category: 'validation',
    };
  }

  // Auth errors - never retry
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return {
      isRetryable: false,
      shouldNotify: false,
      category: 'auth',
    };
  }

  // Unknown errors - notify but don't retry
  return {
    isRetryable: false,
    shouldNotify: true,
    category: 'internal',
  };
}

// Retry helper
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const classification = classifyError(error);

      if (!classification.isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        classification.retryAfter || baseDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );

      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Global error handler for Express
export function globalErrorHandler(err: Error, req: any, res: any, next: any) {
  const appError = err instanceof AppError ? err : new AppError(err.message, 500, 'INTERNAL_ERROR', false);

  // Log error
  if (!appError.isOperational) {
    console.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  res.status(appError.statusCode).json({
    error: appError.message,
    code: appError.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Error message sanitizer for user-facing messages
export function sanitizeErrorMessage(error: Error): string {
  // List of sensitive patterns to remove
  const sensitivePatterns = [
    /api[_-]?key/i,
    /password/i,
    /secret/i,
    /token/i,
    /credential/i,
    /bearer/i,
  ];

  let message = error.message;

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An error occurred. Please try again.';
    }
  }

  // Truncate very long messages
  if (message.length > 200) {
    message = message.substring(0, 200) + '...';
  }

  return message;
}
