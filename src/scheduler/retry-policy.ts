import { JobType } from './queue';
import { logger } from '../utils/logger';

/**
 * Retry policy configuration for job processing
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Type of backoff strategy */
  backoffType: 'exponential' | 'linear' | 'fixed';
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (cap for exponential) */
  maxDelayMs: number;
  /** Specific error messages/codes that should trigger retry */
  retryableErrors?: string[];
  /** Errors that should fail immediately without retry */
  nonRetryableErrors?: string[];
  /** Jitter factor (0-1) to add randomness to delays */
  jitterFactor?: number;
}

/**
 * Default retry policies by job type
 */
export const RETRY_POLICIES: Record<JobType, RetryPolicy> = {
  discover: {
    maxAttempts: 3,
    backoffType: 'exponential',
    baseDelayMs: 60000,       // 1 minute
    maxDelayMs: 900000,       // 15 minutes
    jitterFactor: 0.2,
    retryableErrors: [
      'RATE_LIMIT',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
    ],
    nonRetryableErrors: [
      'INVALID_QUERY',
      'AUTHENTICATION_FAILED',
    ],
  },

  capture: {
    maxAttempts: 4,
    backoffType: 'exponential',
    baseDelayMs: 30000,       // 30 seconds
    maxDelayMs: 600000,       // 10 minutes
    jitterFactor: 0.15,
    retryableErrors: [
      'TIMEOUT',
      'NETWORK_ERROR',
      'BROWSER_CRASHED',
      'PAGE_LOAD_FAILED',
    ],
    nonRetryableErrors: [
      'INVALID_URL',
      'BLOCKED',
    ],
  },

  generate: {
    maxAttempts: 3,
    backoffType: 'exponential',
    baseDelayMs: 60000,       // 1 minute
    maxDelayMs: 1800000,      // 30 minutes
    jitterFactor: 0.1,
    retryableErrors: [
      'RATE_LIMIT',
      'TIMEOUT',
      'API_ERROR',
      'OVERLOADED',
    ],
    nonRetryableErrors: [
      'CONTENT_POLICY_VIOLATION',
      'INVALID_INPUT',
    ],
  },

  deploy: {
    maxAttempts: 5,
    backoffType: 'exponential',
    baseDelayMs: 30000,       // 30 seconds
    maxDelayMs: 1800000,      // 30 minutes
    jitterFactor: 0.2,
    retryableErrors: [
      'DEPLOYMENT_FAILED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
    ],
    nonRetryableErrors: [
      'DOMAIN_NOT_AVAILABLE',
      'QUOTA_EXCEEDED',
    ],
  },

  email: {
    maxAttempts: 5,
    backoffType: 'exponential',
    baseDelayMs: 60000,       // 1 minute
    maxDelayMs: 3600000,      // 1 hour
    jitterFactor: 0.25,
    retryableErrors: [
      'RATE_LIMIT',
      'TEMPORARY_FAILURE',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
    ],
    nonRetryableErrors: [
      'INVALID_RECIPIENT',
      'UNSUBSCRIBED',
      'HARD_BOUNCE',
      'SPAM_BLOCKED',
    ],
  },

  followup: {
    maxAttempts: 3,
    backoffType: 'linear',
    baseDelayMs: 300000,      // 5 minutes
    maxDelayMs: 1800000,      // 30 minutes
    jitterFactor: 0.1,
    retryableErrors: [
      'RATE_LIMIT',
      'TEMPORARY_FAILURE',
    ],
    nonRetryableErrors: [
      'SEQUENCE_CANCELLED',
      'LEAD_UNSUBSCRIBED',
    ],
  },

  score: {
    maxAttempts: 2,
    backoffType: 'fixed',
    baseDelayMs: 60000,       // 1 minute
    maxDelayMs: 60000,
    jitterFactor: 0,
    retryableErrors: [
      'TIMEOUT',
      'DATA_UNAVAILABLE',
    ],
    nonRetryableErrors: [
      'INVALID_LEAD',
    ],
  },
};

/**
 * Get retry policy for a job type
 */
export function getRetryPolicy(jobType: JobType): RetryPolicy {
  return RETRY_POLICIES[jobType] || {
    maxAttempts: 3,
    backoffType: 'exponential',
    baseDelayMs: 60000,
    maxDelayMs: 3600000,
    jitterFactor: 0.1,
  };
}

/**
 * Calculate the next retry delay based on policy and attempt number
 */
export function calculateRetryDelay(
  policy: RetryPolicy,
  attemptNumber: number
): number {
  let delay: number;

  switch (policy.backoffType) {
    case 'exponential':
      // 2^n * baseDelay with max cap
      delay = Math.min(
        policy.baseDelayMs * Math.pow(2, attemptNumber - 1),
        policy.maxDelayMs
      );
      break;

    case 'linear':
      // n * baseDelay with max cap
      delay = Math.min(
        policy.baseDelayMs * attemptNumber,
        policy.maxDelayMs
      );
      break;

    case 'fixed':
    default:
      delay = policy.baseDelayMs;
      break;
  }

  // Apply jitter if configured
  if (policy.jitterFactor && policy.jitterFactor > 0) {
    const jitter = delay * policy.jitterFactor * (Math.random() * 2 - 1);
    delay = Math.max(0, delay + jitter);
  }

  return Math.round(delay);
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(
  policy: RetryPolicy,
  error: Error | string,
  attemptNumber: number
): { shouldRetry: boolean; reason: string } {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = extractErrorCode(errorMessage);

  // Check if max attempts exceeded
  if (attemptNumber >= policy.maxAttempts) {
    return {
      shouldRetry: false,
      reason: `Max attempts (${policy.maxAttempts}) exceeded`,
    };
  }

  // Check non-retryable errors first (they take precedence)
  if (policy.nonRetryableErrors?.length) {
    for (const pattern of policy.nonRetryableErrors) {
      if (errorCode === pattern || errorMessage.includes(pattern)) {
        return {
          shouldRetry: false,
          reason: `Non-retryable error: ${pattern}`,
        };
      }
    }
  }

  // If retryable errors are specified, check if error matches
  if (policy.retryableErrors?.length) {
    for (const pattern of policy.retryableErrors) {
      if (errorCode === pattern || errorMessage.includes(pattern)) {
        return {
          shouldRetry: true,
          reason: `Retryable error matched: ${pattern}`,
        };
      }
    }
    // If specific retryable errors are defined but none matched, don't retry
    return {
      shouldRetry: false,
      reason: 'Error did not match any retryable patterns',
    };
  }

  // Default: retry unless non-retryable
  return {
    shouldRetry: true,
    reason: 'Default retry behavior',
  };
}

/**
 * Extract error code from error message (e.g., "RATE_LIMIT: Too many requests")
 */
function extractErrorCode(message: string): string | null {
  const match = message.match(/^([A-Z_]+):/);
  return match ? match[1] : null;
}

/**
 * Retry context for tracking retry state
 */
export interface RetryContext {
  jobId: string;
  jobType: JobType;
  attemptNumber: number;
  lastError?: string;
  nextRetryAt?: Date;
  policy: RetryPolicy;
}

/**
 * Create a retry context for a job
 */
export function createRetryContext(
  jobId: string,
  jobType: JobType,
  attemptNumber: number = 0
): RetryContext {
  const policy = getRetryPolicy(jobType);

  return {
    jobId,
    jobType,
    attemptNumber,
    policy,
  };
}

/**
 * Update retry context after a failure
 */
export function updateRetryContext(
  context: RetryContext,
  error: Error | string
): RetryContext {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const { shouldRetry: willRetry, reason } = shouldRetry(
    context.policy,
    error,
    context.attemptNumber
  );

  const delay = willRetry
    ? calculateRetryDelay(context.policy, context.attemptNumber + 1)
    : 0;

  logger.debug('Retry decision', {
    jobId: context.jobId.slice(0, 8),
    attempt: context.attemptNumber,
    willRetry,
    reason,
    delayMs: delay,
  });

  return {
    ...context,
    attemptNumber: context.attemptNumber + 1,
    lastError: errorMessage,
    nextRetryAt: willRetry ? new Date(Date.now() + delay) : undefined,
  };
}

/**
 * Format retry delay for display
 */
export function formatRetryDelay(delayMs: number): string {
  if (delayMs < 1000) return `${delayMs}ms`;
  if (delayMs < 60000) return `${(delayMs / 1000).toFixed(0)}s`;
  if (delayMs < 3600000) return `${(delayMs / 60000).toFixed(1)}m`;
  return `${(delayMs / 3600000).toFixed(1)}h`;
}
