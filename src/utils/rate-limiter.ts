import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { createClient, RedisClientType } from 'redis';
import RedisStore from 'rate-limit-redis';
import { isProduction, features } from './config';
import { logger } from './logger';

// Rate limit configuration by endpoint type
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// Redis client singleton
let redisClient: RedisClientType | null = null;
let redisConnected = false;
let redisInitPromise: Promise<void> | null = null;

// Initialize Redis connection
async function initializeRedis(): Promise<void> {
  if (!process.env.REDIS_URL) {
    return;
  }

  if (redisInitPromise) {
    return redisInitPromise;
  }

  redisInitPromise = (async () => {
    try {
      redisClient = createClient({ url: process.env.REDIS_URL });

      redisClient.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        redisConnected = false;
      });

      redisClient.on('connect', () => {
        logger.info('Redis client connected');
        redisConnected = true;
      });

      redisClient.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      await redisClient.connect();
      redisConnected = true;
      logger.info('Rate limiter using Redis store');
    } catch (error: any) {
      logger.warn('Failed to connect to Redis, falling back to in-memory rate limiting', {
        error: error.message,
      });
      redisClient = null;
      redisConnected = false;
    }
  })();

  return redisInitPromise;
}

// Get Redis store if available
function getRedisStore(): RedisStore | undefined {
  if (!redisClient || !redisConnected) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    prefix: 'rl:',
  });
}

// Standard key generator using IP + optional user ID
function createKeyGenerator(includeUserId: boolean = false) {
  return (req: Request): string => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (includeUserId && (req as any).user?.id) {
      return `${ip}:${(req as any).user.id}`;
    }
    return ip;
  };
}

// Skip rate limiting in development unless explicitly enabled
function shouldSkipRateLimit(): boolean {
  if (process.env.FORCE_RATE_LIMIT === 'true') return false;
  return !isProduction();
}

// Create rate limiters with consistent error response format
function createRateLimiter(config: RateLimitConfig): RateLimitRequestHandler {
  const store = getRedisStore();

  const options: Partial<Options> = {
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: config.skipFailedRequests ?? false,
    keyGenerator: config.keyGenerator || createKeyGenerator(),
    skip: shouldSkipRateLimit,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000),
        }
      });
    },
  };

  // Add Redis store if available
  if (store) {
    options.store = store;
  }

  return rateLimit(options);
}

// Rate limiter configurations
const limiterConfigs = {
  login: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many login attempts. Please wait before trying again.',
    skipFailedRequests: false, // Count failed attempts too
  },
  register: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many registration attempts. Please wait before trying again.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests. Please slow down.',
    keyGenerator: createKeyGenerator(true), // Include user ID if available
  },
  strict: {
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: 'Too many sensitive requests. Please wait before trying again.',
  },
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    message: 'Too many requests. Please slow down.',
  },
};

// Rate limiters (will be initialized on first use or after Redis init)
let _loginRateLimiter: RateLimitRequestHandler | null = null;
let _registerRateLimiter: RateLimitRequestHandler | null = null;
let _apiRateLimiter: RateLimitRequestHandler | null = null;
let _strictRateLimiter: RateLimitRequestHandler | null = null;
let _publicRateLimiter: RateLimitRequestHandler | null = null;

// Lazy initialization of rate limiters
function getLoginRateLimiter(): RateLimitRequestHandler {
  if (!_loginRateLimiter) {
    _loginRateLimiter = createRateLimiter(limiterConfigs.login);
  }
  return _loginRateLimiter;
}

function getRegisterRateLimiter(): RateLimitRequestHandler {
  if (!_registerRateLimiter) {
    _registerRateLimiter = createRateLimiter(limiterConfigs.register);
  }
  return _registerRateLimiter;
}

function getApiRateLimiter(): RateLimitRequestHandler {
  if (!_apiRateLimiter) {
    _apiRateLimiter = createRateLimiter(limiterConfigs.api);
  }
  return _apiRateLimiter;
}

function getStrictRateLimiter(): RateLimitRequestHandler {
  if (!_strictRateLimiter) {
    _strictRateLimiter = createRateLimiter(limiterConfigs.strict);
  }
  return _strictRateLimiter;
}

function getPublicRateLimiter(): RateLimitRequestHandler {
  if (!_publicRateLimiter) {
    _publicRateLimiter = createRateLimiter(limiterConfigs.public);
  }
  return _publicRateLimiter;
}

// Initialize rate limiters (call this during server startup)
export async function initializeRateLimiters(): Promise<void> {
  // Initialize Redis if configured
  await initializeRedis();

  // Pre-create all rate limiters
  _loginRateLimiter = createRateLimiter(limiterConfigs.login);
  _registerRateLimiter = createRateLimiter(limiterConfigs.register);
  _apiRateLimiter = createRateLimiter(limiterConfigs.api);
  _strictRateLimiter = createRateLimiter(limiterConfigs.strict);
  _publicRateLimiter = createRateLimiter(limiterConfigs.public);

  logger.info('Rate limiters initialized', {
    store: redisConnected ? 'redis' : 'memory',
  });
}

// Shutdown Redis connection gracefully
export async function shutdownRateLimiters(): Promise<void> {
  if (redisClient && redisConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    } catch (error: any) {
      logger.error('Error disconnecting Redis client', { error: error.message });
    }
  }
  redisClient = null;
  redisConnected = false;
  redisInitPromise = null;
}

// Check if Redis is being used for rate limiting
export function isRedisRateLimiting(): boolean {
  return redisConnected;
}

// Export rate limiters with getters for lazy initialization
export const loginRateLimiter = new Proxy({} as RateLimitRequestHandler, {
  apply: (target, thisArg, args) => getLoginRateLimiter().apply(thisArg, args as any),
  get: (target, prop) => (getLoginRateLimiter() as any)[prop],
});

export const registerRateLimiter = new Proxy({} as RateLimitRequestHandler, {
  apply: (target, thisArg, args) => getRegisterRateLimiter().apply(thisArg, args as any),
  get: (target, prop) => (getRegisterRateLimiter() as any)[prop],
});

export const apiRateLimiter = new Proxy({} as RateLimitRequestHandler, {
  apply: (target, thisArg, args) => getApiRateLimiter().apply(thisArg, args as any),
  get: (target, prop) => (getApiRateLimiter() as any)[prop],
});

export const strictRateLimiter = new Proxy({} as RateLimitRequestHandler, {
  apply: (target, thisArg, args) => getStrictRateLimiter().apply(thisArg, args as any),
  get: (target, prop) => (getStrictRateLimiter() as any)[prop],
});

export const publicRateLimiter = new Proxy({} as RateLimitRequestHandler, {
  apply: (target, thisArg, args) => getPublicRateLimiter().apply(thisArg, args as any),
  get: (target, prop) => (getPublicRateLimiter() as any)[prop],
});

// Export all rate limiters
export const rateLimiters = {
  login: loginRateLimiter,
  register: registerRateLimiter,
  api: apiRateLimiter,
  strict: strictRateLimiter,
  public: publicRateLimiter,
};

export default rateLimiters;
