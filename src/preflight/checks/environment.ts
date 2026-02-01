/**
 * Environment Checks
 *
 * Verifies .env file, required variables, and Node.js version.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult, timed } from '../types';

const CATEGORY = 'Environment';

// Required environment variables
const REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

// Optional but recommended variables
const RECOMMENDED_VARS = [
  { name: 'JWT_SECRET', defaultValue: 'change-this-in-production', warning: 'Using default value (change for production)' },
  { name: 'GMAIL_CLIENT_ID', warning: 'Gmail not configured (email features disabled)' },
  { name: 'GOOGLE_PLACES_KEY', warning: 'Google Places not configured (discovery disabled)' },
];

// Minimum Node.js version
const MIN_NODE_VERSION = '18.0.0';

/**
 * Check if .env file exists
 */
async function checkEnvFile(options: PreflightOptions): Promise<PreflightResult> {
  const { duration } = await timed(async () => {});
  const start = Date.now();

  const envPath = path.resolve(process.cwd(), '.env');
  const exists = fs.existsSync(envPath);

  if (exists) {
    // Check if it's readable and has content
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lineCount = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;

      return createResult(CATEGORY, '.env file', 'pass', Date.now() - start, {
        details: { path: envPath, variables: lineCount },
      });
    } catch (error: any) {
      return createResult(CATEGORY, '.env file', 'fail', Date.now() - start, {
        message: `Cannot read .env file: ${error.message}`,
      });
    }
  }

  return createResult(CATEGORY, '.env file', 'fail', Date.now() - start, {
    message: '.env file not found',
    fixable: true,
    fixCommand: 'cp .env.example .env',
  });
}

/**
 * Check required environment variables
 */
async function checkRequiredVars(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();
  const missing: string[] = [];
  const present: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    return createResult(CATEGORY, 'Required credentials', 'pass', Date.now() - start, {
      details: options.verbose ? { present } : undefined,
    });
  }

  return createResult(CATEGORY, 'Required credentials', 'fail', Date.now() - start, {
    message: `Missing: ${missing.join(', ')}`,
    details: { missing, present },
  });
}

/**
 * Check Supabase credentials format
 */
async function checkSupabaseCredentials(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return createResult(CATEGORY, 'Supabase credentials', 'skip', Date.now() - start, {
      message: 'Supabase not configured',
    });
  }

  // Validate URL format
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('supabase')) {
      return createResult(CATEGORY, 'Supabase credentials', 'warn', Date.now() - start, {
        message: 'URL does not appear to be a Supabase URL',
      });
    }
  } catch {
    return createResult(CATEGORY, 'Supabase credentials', 'fail', Date.now() - start, {
      message: 'Invalid SUPABASE_URL format',
    });
  }

  // Check key format (JWT-like)
  if (!key.includes('.') || key.length < 100) {
    return createResult(CATEGORY, 'Supabase credentials', 'warn', Date.now() - start, {
      message: 'SUPABASE_ANON_KEY format may be invalid',
    });
  }

  return createResult(CATEGORY, 'Supabase credentials', 'pass', Date.now() - start);
}

/**
 * Check JWT_SECRET
 */
async function checkJwtSecret(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return createResult(CATEGORY, 'JWT_SECRET', 'warn', Date.now() - start, {
      message: 'Using default value',
      fixCommand: 'Add JWT_SECRET to .env with a secure random string',
    });
  }

  if (jwtSecret === 'change-this-in-production') {
    return createResult(CATEGORY, 'JWT_SECRET', 'warn', Date.now() - start, {
      message: 'Using default value',
      fixCommand: 'Change JWT_SECRET in .env',
    });
  }

  if (jwtSecret.length < 32) {
    return createResult(CATEGORY, 'JWT_SECRET', 'warn', Date.now() - start, {
      message: 'JWT_SECRET should be at least 32 characters',
    });
  }

  return createResult(CATEGORY, 'JWT_SECRET', 'pass', Date.now() - start);
}

/**
 * Check Gmail credentials
 */
async function checkGmailCredentials(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional) {
    return createResult(CATEGORY, 'Gmail credentials', 'skip', Date.now() - start, {
      message: 'Skipped (--skip-optional)',
    });
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const fromEmail = process.env.GMAIL_FROM_EMAIL;

  if (!clientId || !clientSecret) {
    return createResult(CATEGORY, 'Gmail credentials', 'warn', Date.now() - start, {
      message: 'Gmail not configured (email features disabled)',
    });
  }

  if (!fromEmail) {
    return createResult(CATEGORY, 'Gmail credentials', 'warn', Date.now() - start, {
      message: 'GMAIL_FROM_EMAIL not set',
    });
  }

  // Basic email format check
  if (!fromEmail.includes('@')) {
    return createResult(CATEGORY, 'Gmail credentials', 'fail', Date.now() - start, {
      message: 'GMAIL_FROM_EMAIL is not a valid email address',
    });
  }

  return createResult(CATEGORY, 'Gmail credentials', 'pass', Date.now() - start);
}

/**
 * Check Node.js version
 */
async function checkNodeVersion(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();
  const currentVersion = process.version.replace('v', '');

  const parseVersion = (v: string): number[] => v.split('.').map(Number);
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(MIN_NODE_VERSION);

  let isValid = true;
  for (let i = 0; i < 3; i++) {
    if (current[i] > minimum[i]) break;
    if (current[i] < minimum[i]) {
      isValid = false;
      break;
    }
  }

  if (!isValid) {
    return createResult(CATEGORY, 'Node.js version', 'fail', Date.now() - start, {
      message: `Found ${currentVersion}, requires ${MIN_NODE_VERSION}+`,
      fixCommand: `nvm install ${MIN_NODE_VERSION}`,
    });
  }

  return createResult(CATEGORY, 'Node.js version', 'pass', Date.now() - start, {
    details: options.verbose ? { version: currentVersion, minimum: MIN_NODE_VERSION } : undefined,
  });
}

/**
 * Export all environment checks
 */
export const environmentChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: '.env file',
    required: true,
    run: checkEnvFile,
  },
  {
    category: CATEGORY,
    name: 'Required credentials',
    required: true,
    run: checkRequiredVars,
  },
  {
    category: CATEGORY,
    name: 'Supabase credentials',
    required: true,
    run: checkSupabaseCredentials,
  },
  {
    category: CATEGORY,
    name: 'JWT_SECRET',
    required: false,
    run: checkJwtSecret,
  },
  {
    category: CATEGORY,
    name: 'Gmail credentials',
    required: false,
    run: checkGmailCredentials,
  },
  {
    category: CATEGORY,
    name: 'Node.js version',
    required: true,
    run: checkNodeVersion,
  },
];
