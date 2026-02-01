import winston from 'winston';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// PII patterns for redaction
const PII_PATTERNS: [RegExp, string][] = [
  // Email addresses
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]'],
  // Phone numbers (various formats)
  [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE REDACTED]'],
  [/\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/g, '[PHONE REDACTED]'],
  // Credit card numbers
  [/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD REDACTED]'],
  // SSN
  [/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN REDACTED]'],
  // API keys and tokens (common patterns)
  [/\b(sk|pk|api|key|token|secret|bearer)[_-]?[a-zA-Z0-9]{20,}\b/gi, '[TOKEN REDACTED]'],
  // JWT tokens
  [/eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/g, '[JWT REDACTED]'],
  // Password fields in JSON
  [/"password"\s*:\s*"[^"]+"/gi, '"password": "[REDACTED]"'],
  [/'password'\s*:\s*'[^']+'/gi, "'password': '[REDACTED]'"],
];

// Keys to redact from objects
const REDACTED_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'secret_key',
  'authorization',
  'cookie',
  'ssn',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
]);

// Redact PII from string
function redactPII(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Recursively redact PII from object
function redactObject(obj: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (typeof obj === 'string') {
    return redactPII(obj);
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactObject(value, depth + 1);
    }
  }
  return result;
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const redactedMeta = redactObject(meta);
    const correlationStr = correlationId ? ` [${String(correlationId).slice(0, 8)}]` : '';
    const metaStr = Object.keys(redactedMeta).length ? ` ${JSON.stringify(redactedMeta)}` : '';
    return `${timestamp} ${level}:${correlationStr} ${message}${metaStr}`;
  })
);

// JSON format for file output (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format((info) => {
    // Redact PII in all logged data
    return redactObject(info);
  })(),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'autowebsites' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Ensure log directory exists
  const fs = require('fs');
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // All logs
  logger.add(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );

  // Error logs
  logger.add(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );

  // Security events log
  logger.add(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'security.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

// Request logging helper with correlation ID
export function logRequest(req: any, res: any, duration: number) {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

  // Sample high-volume operations in production
  if (process.env.NODE_ENV === 'production') {
    // Only log 10% of successful requests to high-volume endpoints
    if (res.statusCode < 400 && ['/', '/health', '/api/analytics'].some(p => req.path.startsWith(p))) {
      if (Math.random() > 0.1) return;
    }
  }

  logger.log(level, `${req.method} ${req.path}`, {
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId,
    userId: req.user?.id,
  });
}

// Structured logging helpers
export function logLeadAction(action: string, leadId: string, details?: any) {
  logger.info(`Lead ${action}`, redactObject({
    leadId,
    action,
    ...details,
  }));
}

export function logEmailEvent(event: string, leadId: string, details?: any) {
  logger.info(`Email ${event}`, redactObject({
    leadId,
    event,
    ...details,
  }));
}

export function logApiCall(service: string, endpoint: string, duration: number, success: boolean, correlationId?: string) {
  const level = success ? 'debug' : 'warn';
  logger.log(level, `API call to ${service}`, {
    service,
    endpoint,
    duration: `${duration}ms`,
    success,
    correlationId,
  });
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, redactObject({
    errorName: error.name,
    stack: error.stack,
    ...context,
  }));
}

// Security event logging
export function logSecurityEvent(event: string, details: Record<string, any>) {
  logger.warn(`Security: ${event}`, redactObject({
    securityEvent: event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

// Login attempt logging for security monitoring
export function logLoginAttempt(email: string, success: boolean, ip: string, details?: Record<string, any>) {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Login attempt: ${success ? 'success' : 'failed'}`, {
    email: redactPII(email),
    success,
    ip,
    timestamp: new Date().toISOString(),
    ...redactObject(details || {}),
  });
}

// Child logger for specific modules
export function createChildLogger(module: string) {
  return logger.child({ module });
}

// Correlation ID aware logging
export function withCorrelationId(correlationId: string) {
  return {
    info: (message: string, meta?: any) => logger.info(message, { correlationId, ...redactObject(meta || {}) }),
    warn: (message: string, meta?: any) => logger.warn(message, { correlationId, ...redactObject(meta || {}) }),
    error: (message: string, meta?: any) => logger.error(message, { correlationId, ...redactObject(meta || {}) }),
    debug: (message: string, meta?: any) => logger.debug(message, { correlationId, ...redactObject(meta || {}) }),
  };
}

export { logger };
export default logger;
