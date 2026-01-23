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

  // SendGrid (optional - for email, paid)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  SENDGRID_WEBHOOK_KEY: z.string().optional(),

  // Stripe (optional - for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Google Places (optional - for discovery)
  GOOGLE_PLACES_KEY: z.string().optional(),

  // Dashboard
  JWT_SECRET: z.string().min(16).default('change-this-in-production'),
  DASHBOARD_PORT: z.string().transform(Number).default('3001'),
  DASHBOARD_URL: z.string().url().optional(),

  // Company info
  COMPANY_NAME: z.string().default('AutoWebsites Pro'),
  COMPANY_EMAIL: z.string().email().optional(),
  COMPANY_PHONE: z.string().optional(),
  COMPANY_ADDRESS: z.string().optional(),
  COMPANY_LEGAL_NAME: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().optional(),
});

// Parse and validate environment
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment configuration:');
    for (const error of result.error.errors) {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    }
    throw new Error('Environment validation failed');
  }

  return result.data;
}

// Export validated config
export const config = loadConfig();

// Type for the config
export type Config = z.infer<typeof envSchema>;

// Feature flags based on available config
export const features = {
  ai: !!config.ANTHROPIC_API_KEY,
  email: !!(config.GMAIL_CLIENT_ID || config.SENDGRID_API_KEY),
  gmail: !!config.GMAIL_CLIENT_ID,
  sendgrid: !!config.SENDGRID_API_KEY,
  payments: !!config.STRIPE_SECRET_KEY,
  discovery: !!config.GOOGLE_PLACES_KEY,
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
