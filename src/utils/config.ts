import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase (required)
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Anthropic (optional - for AI features)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Gmail (optional - for email, free tier)
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_FROM_EMAIL: z.string().email().optional(),
  GMAIL_FROM_NAME: z.string().optional(),
  GMAIL_DAILY_QUOTA: z.string().transform(Number).optional(),

  // Stripe (optional - for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Google Places (optional - for discovery)
  GOOGLE_PLACES_KEY: z.string().optional(),

  // Dashboard
  JWT_SECRET: z.string().min(16).default('change-this-in-production'),
  DASHBOARD_PORT: z.string().transform(Number).default('3001'),
  DASHBOARD_URL: z.string().url().optional(),

  // CORS
  CORS_ORIGINS: z.string().optional(),

  // Company info
  COMPANY_NAME: z.string().default('AutoWebsites Pro'),
  COMPANY_EMAIL: z.string().email().optional(),
  COMPANY_PHONE: z.string().optional(),
  COMPANY_ADDRESS: z.string().optional(),
  COMPANY_LEGAL_NAME: z.string().optional(),
  COMPANY_WEBSITE: z.string().url().optional(),

  // Vercel deployment
  VERCEL_TOKEN: z.string().optional(),

  // Spider API (deep contact extraction)
  SPIDER_API_KEY: z.string().optional(),

  // Stripe publishable key
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Gmail token encryption
  GMAIL_TOKEN_ENC_KEY: z.string().optional(),

  // Alerting configuration
  ALERT_EMAIL_TO: z.string().email().optional(),
  ALERT_EMAIL_FROM: z.string().email().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
  ALERT_WEBHOOK_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().optional(),

  // Redis (optional - for rate limiting persistence)
  REDIS_URL: z.string().url().optional(),

  // External monitoring heartbeat
  HEARTBEAT_URL: z.string().url().optional(),
});

// Production-specific validation
function validateProductionConfig(config: z.infer<typeof envSchema>): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // JWT Secret validation
  if (config.JWT_SECRET === 'change-this-in-production') {
    errors.push('JWT_SECRET must be changed from default in production');
  }
  if (config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters in production');
  }

  // CORS validation
  if (!config.CORS_ORIGINS) {
    errors.push('CORS_ORIGINS must be configured in production');
  } else if (config.CORS_ORIGINS.includes('*')) {
    errors.push('Wildcard CORS origin (*) is not allowed in production');
  }

  // Dashboard URL should be set
  if (!config.DASHBOARD_URL) {
    warnings.push('DASHBOARD_URL is not set - some features may not work correctly');
  }

  // Company email should be set
  if (!config.COMPANY_EMAIL) {
    warnings.push('COMPANY_EMAIL is not set - outreach features may not work correctly');
  }

  // Print warnings
  for (const warning of warnings) {
    console.warn(`[Config Warning] ${warning}`);
  }

  // Throw errors
  if (errors.length > 0) {
    console.error('\n=== PRODUCTION CONFIGURATION ERRORS ===');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error('\nFix these issues before deploying to production.\n');
    throw new Error('Production configuration validation failed');
  }
}

// Log configuration summary (with sensitive values redacted)
function logConfigSummary(config: z.infer<typeof envSchema>): void {
  if (config.NODE_ENV === 'test') return;

  const summary = {
    environment: config.NODE_ENV,
    supabase: config.SUPABASE_URL ? 'configured' : 'missing',
    ai: config.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
    email: config.GMAIL_CLIENT_ID ? 'configured' : 'not configured',
    payments: config.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
    discovery: config.GOOGLE_PLACES_KEY ? 'configured' : 'not configured',
    vercel: config.VERCEL_TOKEN ? 'configured' : 'not configured',
    alerting: (config.ALERT_EMAIL_TO || config.SLACK_WEBHOOK_URL || config.DISCORD_WEBHOOK_URL) ? 'configured' : 'not configured',
    dashboard: {
      port: config.DASHBOARD_PORT,
      url: config.DASHBOARD_URL || 'not set',
    },
    company: config.COMPANY_NAME,
  };

  console.log('\n=== Configuration Summary ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('==============================\n');
}

// Parse and validate environment
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n=== INVALID ENVIRONMENT CONFIGURATION ===');
    for (const error of result.error.errors) {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    }
    console.error('==========================================\n');
    throw new Error('Environment validation failed');
  }

  const config = result.data;

  // Run production-specific validation
  if (config.NODE_ENV === 'production') {
    validateProductionConfig(config);
  } else if (config.NODE_ENV === 'development') {
    // Warn about insecure defaults in development
    if (config.JWT_SECRET === 'change-this-in-production') {
      console.warn('[Dev Warning] Using default JWT_SECRET - change before production');
    }
  }

  // Log configuration summary
  logConfigSummary(config);

  return config;
}

// Export validated config
export const config = loadConfig();

// Type for the config
export type Config = z.infer<typeof envSchema>;

// Feature flags based on available config
export const features = {
  ai: !!config.ANTHROPIC_API_KEY,
  email: !!config.GMAIL_CLIENT_ID,
  gmail: !!config.GMAIL_CLIENT_ID,
  payments: !!config.STRIPE_SECRET_KEY,
  discovery: !!config.GOOGLE_PLACES_KEY,
  redis: !!config.REDIS_URL,
  vercel: !!config.VERCEL_TOKEN,
  spider: !!config.SPIDER_API_KEY,
  alerting: !!(config.ALERT_EMAIL_TO || config.SLACK_WEBHOOK_URL || config.DISCORD_WEBHOOK_URL || config.ALERT_WEBHOOK_URL),
};

// Helper to check if feature is available
export function requireFeature(feature: keyof typeof features, featureName?: string) {
  if (!features[feature]) {
    const name = featureName || feature;
    throw new Error(`${name} feature is not configured. Please add the required environment variables.`);
  }
}

// Get config value with fallback
export function getConfigValue<K extends keyof Config>(
  key: K,
  fallback?: Config[K]
): Config[K] {
  return config[key] ?? fallback!;
}

// Check if running in production
export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

// Check if running in development
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

// Check if running in test
export function isTest(): boolean {
  return config.NODE_ENV === 'test';
}

// Get parsed CORS origins
export function getCorsOrigins(): string[] {
  if (!config.CORS_ORIGINS) {
    return ['http://localhost:3000', 'http://localhost:3001'];
  }
  return config.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
}

// Validate that required production vars are set
export function validateProductionReadiness(): { ready: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    issues.push('Database: Supabase credentials not configured');
  }

  if (config.JWT_SECRET === 'change-this-in-production' || config.JWT_SECRET.length < 32) {
    issues.push('Security: JWT_SECRET needs to be set to a secure value (32+ chars)');
  }

  if (!config.CORS_ORIGINS) {
    issues.push('Security: CORS_ORIGINS not configured');
  }

  if (!config.COMPANY_EMAIL) {
    issues.push('Business: COMPANY_EMAIL not set');
  }

  if (!config.DASHBOARD_URL) {
    issues.push('Business: DASHBOARD_URL not set');
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}
