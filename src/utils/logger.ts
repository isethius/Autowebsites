import winston from 'winston';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
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
}

// Request logging helper
export function logRequest(req: any, res: any, duration: number) {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, `${req.method} ${req.path}`, {
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
}

// Structured logging helpers
export function logLeadAction(action: string, leadId: string, details?: any) {
  logger.info(`Lead ${action}`, {
    leadId,
    action,
    ...details,
  });
}

export function logEmailEvent(event: string, leadId: string, details?: any) {
  logger.info(`Email ${event}`, {
    leadId,
    event,
    ...details,
  });
}

export function logApiCall(service: string, endpoint: string, duration: number, success: boolean) {
  const level = success ? 'debug' : 'warn';
  logger.log(level, `API call to ${service}`, {
    service,
    endpoint,
    duration: `${duration}ms`,
    success,
  });
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, {
    errorName: error.name,
    stack: error.stack,
    ...context,
  });
}

// Child logger for specific modules
export function createChildLogger(module: string) {
  return logger.child({ module });
}

export { logger };
export default logger;
