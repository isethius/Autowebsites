import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { isProduction } from './config';

// Create helmet middleware with production-appropriate settings
export function createSecurityHeaders() {
  return helmet({
    // Content Security Policy - strict in production
    contentSecurityPolicy: isProduction() ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI flexibility
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false, // Disable CSP in development

    // Prevent clickjacking
    frameguard: { action: 'deny' },

    // Prevent MIME type sniffing
    noSniff: true,

    // XSS Protection (legacy header, but still useful for older browsers)
    xssFilter: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // HSTS - only in production with HTTPS
    hsts: isProduction() ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,

    // Referrer Policy - send origin only on same-origin, nothing on cross-origin
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // DNS Prefetch Control - disable to prevent leaking visited links
    dnsPrefetchControl: { allow: false },

    // IE No Open - prevent IE from executing downloads in site context
    ieNoOpen: true,

    // Permitted Cross-Domain Policies - restrict Adobe products
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  });
}

// Additional security headers not covered by helmet
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Permissions Policy (replaces Feature-Policy)
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Cross-Origin headers for API security
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Cache Control for sensitive endpoints
  if (req.path.startsWith('/api/auth/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
}

// Combine all security middleware
export function securityMiddleware() {
  const helmetMiddleware = createSecurityHeaders();

  return [
    helmetMiddleware,
    additionalSecurityHeaders,
  ];
}

export default securityMiddleware;
