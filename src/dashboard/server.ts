import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { authMiddleware, AuthenticatedRequest, createAuthRouter } from './auth';
import { createLeadsRouter } from './routes/leads';
import { createCampaignsRouter } from './routes/campaigns';
import { createProposalsRouter } from './routes/proposals';
import { createAnalyticsRouter } from './routes/analytics';
import { createJobsRouter } from './routes/jobs';
import { createOvernightRouter } from './routes/overnight';
import { createThemesRouter } from './routes/themes';
import { createTemplatesRouter } from './routes/templates';
import { createUnsubscribeHandler } from '../email/unsubscribe';
import { isProduction } from '../utils/config';
import { logger, logRequest } from '../utils/logger';
import { securityMiddleware } from '../utils/security-headers';
import { rateLimiters, initializeRateLimiters, shutdownRateLimiters } from '../utils/rate-limiter';
import { AppError, globalErrorHandler } from '../utils/error-handler';
import { healthEndpoint, livenessEndpoint, readinessEndpoint } from '../utils/health';

// Extend Express Request to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export interface DashboardConfig {
  port?: number;
  jwtSecret: string;
  corsOrigins?: string[];
}

// Validate JWT secret configuration
function validateJwtSecret(secret: string): void {
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  if (isProduction()) {
    // In production, enforce secure secret requirements
    if (secret === 'dev-secret-change-in-production' || secret === 'change-this-in-production') {
      throw new Error('JWT_SECRET must be changed from default value in production');
    }

    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
  }
}

// Validate and parse CORS origins
function validateCorsOrigins(origins: string[] | undefined): string[] {
  if (isProduction()) {
    if (!origins || origins.length === 0) {
      throw new Error('CORS_ORIGINS must be configured in production');
    }

    // Validate each origin format
    for (const origin of origins) {
      if (origin === '*') {
        throw new Error('Wildcard (*) CORS origin is not allowed in production');
      }

      try {
        const url = new URL(origin);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error(`Invalid CORS origin protocol: ${origin}`);
        }
      } catch {
        throw new Error(`Invalid CORS origin format: ${origin}`);
      }
    }
  }

  return origins || ['http://localhost:3000', 'http://localhost:3001'];
}

export async function createDashboardServer(config: DashboardConfig) {
  // Validate configuration
  validateJwtSecret(config.jwtSecret);
  const corsOrigins = validateCorsOrigins(config.corsOrigins);

  // Initialize rate limiters (with Redis if configured)
  await initializeRateLimiters();

  const app = express();
  const port = config.port || 3001;

  // Track active connections for graceful shutdown
  const connections = new Set<any>();

  // Trust proxy for rate limiting behind reverse proxies
  if (isProduction()) {
    app.set('trust proxy', 1);
  }

  // Security headers (helmet + custom)
  app.use(securityMiddleware());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing (required for CSRF)
  app.use(cookieParser());

  // Request correlation ID middleware
  app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] as string ||
      crypto.randomUUID();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
  });

  // CORS middleware with validated origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && corsOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Request logging middleware with correlation ID
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logRequest(req, res, duration);
    });
    next();
  });

  // Static files (before rate limiting for performance)
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check endpoints (no rate limiting, for monitoring/k8s)
  app.get('/health', healthEndpoint);      // Full health check with all services
  app.get('/live', livenessEndpoint);      // Liveness probe - is process alive?
  app.get('/ready', readinessEndpoint);    // Readiness probe - can accept traffic?

  // CSRF Protection middleware
  const csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
    },
  });

  // CSRF token endpoint (must be called before state-changing operations)
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // CSRF error handler
  const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      logger.warn('CSRF token validation failed', {
        correlationId: req.correlationId,
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({
        error: { code: 'CSRF_ERROR', message: 'Invalid or missing CSRF token' }
      });
    }
    next(err);
  };

  // Auth routes with rate limiting
  const authRouter = createAuthRouter(config.jwtSecret);

  // Apply specific rate limiters to auth endpoints
  app.use('/api/auth/login', rateLimiters.login);
  app.use('/api/auth/register', rateLimiters.register);
  app.use('/api/auth/change-password', rateLimiters.strict);
  app.use('/api/auth/refresh', rateLimiters.strict);
  app.use('/api/auth', authRouter);

  // Unsubscribe routes (public, with rate limiting)
  const unsubscribeHandler = createUnsubscribeHandler();

  app.get('/unsubscribe', rateLimiters.public, async (req, res) => {
    try {
      const leadId = req.query.lead_id as string;
      if (!leadId) {
        return res.status(400).send('Invalid unsubscribe link');
      }

      // Validate leadId format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
        return res.status(400).send('Invalid unsubscribe link');
      }

      const data = await unsubscribeHandler.getUnsubscribePageData(leadId);
      if (!data) {
        return res.status(404).send('Invalid unsubscribe link');
      }

      res.send(unsubscribeHandler.generateUnsubscribePage(data, leadId));
    } catch (error: any) {
      logger.error('Unsubscribe page error', {
        correlationId: req.correlationId,
        error: error.message,
      });
      res.status(500).send('An error occurred');
    }
  });

  app.post('/api/unsubscribe', rateLimiters.public, async (req, res) => {
    try {
      const { lead_id, feedback } = req.body;
      if (!lead_id) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Missing lead_id' }
        });
      }

      // Validate lead_id format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead_id)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid lead_id format' }
        });
      }

      const result = await unsubscribeHandler.processUnsubscribe(lead_id, {
        feedback: typeof feedback === 'string' ? feedback.slice(0, 1000) : undefined,
        source: 'link_click',
      });

      if (req.headers.accept?.includes('text/html')) {
        res.send(unsubscribeHandler.generateSuccessPage());
      } else {
        res.json(result);
      }
    } catch (error: any) {
      logger.error('Unsubscribe error', {
        correlationId: req.correlationId,
        error: error.message,
      });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' }
      });
    }
  });

  // Template preview routes (public, read-only, with rate limiting)
  app.use('/api/templates', rateLimiters.public, createTemplatesRouter());

  // Protected API routes with general rate limiting and CSRF protection
  app.use('/api/leads', rateLimiters.api, csrfProtection, authMiddleware(config.jwtSecret), createLeadsRouter());
  app.use('/api/campaigns', rateLimiters.api, csrfProtection, authMiddleware(config.jwtSecret), createCampaignsRouter());
  app.use('/api/proposals', rateLimiters.api, csrfProtection, authMiddleware(config.jwtSecret), createProposalsRouter());
  app.use('/api/analytics', rateLimiters.api, authMiddleware(config.jwtSecret), createAnalyticsRouter()); // Read-only, no CSRF needed
  app.use('/api/jobs', rateLimiters.api, csrfProtection, authMiddleware(config.jwtSecret), createJobsRouter());
  app.use('/api/overnight', rateLimiters.api, csrfProtection, authMiddleware(config.jwtSecret), createOvernightRouter());
  app.use('/api/themes', rateLimiters.api, authMiddleware(config.jwtSecret), createThemesRouter()); // Read-heavy, no CSRF needed for GET routes
  // CSRF error handler (must be after routes that use CSRF protection)
  app.use(csrfErrorHandler);

  // Catch-all for SPA
  app.get('*', (req, res) => {
    // If it's an API request, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
      });
    }

    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Global error handler
  app.use(globalErrorHandler);

  // Start server
  const server = app.listen(port, () => {
    logger.info(`Dashboard server running at http://localhost:${port}`);
  });

  // Track connections for graceful shutdown
  server.on('connection', (conn) => {
    connections.add(conn);
    conn.on('close', () => connections.delete(conn));
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Shutdown rate limiters (Redis connection)
    await shutdownRateLimiters();

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        logger.error('Error during server close', { error: err.message });
        process.exit(1);
      }
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Set shutdown timeout (30 seconds)
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Shutdown timeout reached. Forcing exit...');
      process.exit(1);
    }, 30000);

    // Close existing connections gracefully
    for (const conn of connections) {
      conn.end();
    }

    // Clear timeout if shutdown completes
    server.on('close', () => clearTimeout(shutdownTimeout));
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return { app, server, gracefulShutdown };
}

// CLI entry point
if (require.main === module) {
  const jwtSecret = process.env.JWT_SECRET;

  // Require JWT_SECRET in all environments when running directly
  if (!jwtSecret) {
    console.error('ERROR: JWT_SECRET environment variable is required');
    console.error('Set JWT_SECRET in your .env file or environment');
    process.exit(1);
  }

  const port = parseInt(process.env.DASHBOARD_PORT || '3001', 10);

  // Parse CORS origins from environment
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : undefined;

  createDashboardServer({ port, jwtSecret, corsOrigins }).catch((error: any) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
