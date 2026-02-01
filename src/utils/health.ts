import { getSupabaseClient } from './supabase';
import { verifyConnection as verifyGmailConnection, isConfigured as isGmailConfigured } from '../email/gmail-client';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    message?: string;
  }[];
}

export interface ServiceCheck {
  name: string;
  check: () => Promise<void>;
  critical?: boolean;
}

// Check Supabase connection
async function checkSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('leads').select('id').limit(1);

  if (error && !error.message.includes('does not exist')) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

// Check Gmail (optional)
async function checkGmail(): Promise<void> {
  if (!isGmailConfigured()) {
    throw new Error('Gmail not configured');
  }

  const connected = await verifyGmailConnection();
  if (!connected) {
    throw new Error('Gmail not authorized. Run: npx tsx src/email/gmail-client.ts');
  }
}

// Check Stripe (optional)
async function checkStripe(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe not configured');
  }

  const response = await fetch('https://api.stripe.com/v1/balance', {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!response.ok) {
    throw new Error(`Stripe API error: ${response.status}`);
  }
}

// Check Claude/Anthropic (optional)
async function checkAnthropic(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic not configured');
  }

  // Just verify the key format - don't make an actual API call
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid Anthropic API key format');
  }
}

// Memory check
async function checkMemory(): Promise<void> {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const percentUsed = (used.heapUsed / used.heapTotal) * 100;

  if (percentUsed > 90) {
    throw new Error(`High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed.toFixed(1)}%)`);
  }
}

// Start time for uptime calculation
const startTime = Date.now();

// Main health check function
export async function runHealthChecks(): Promise<HealthCheckResult> {
  const checks: ServiceCheck[] = [
    { name: 'database', check: checkSupabase, critical: true },
    { name: 'memory', check: checkMemory, critical: true },
    { name: 'gmail', check: checkGmail, critical: false },
    { name: 'stripe', check: checkStripe, critical: false },
    { name: 'anthropic', check: checkAnthropic, critical: false },
  ];

  const results: HealthCheckResult['checks'] = [];
  let hasCriticalFailure = false;
  let hasAnyFailure = false;

  for (const { name, check, critical } of checks) {
    const start = Date.now();

    try {
      await Promise.race([
        check(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        ),
      ]);

      results.push({
        name,
        status: 'pass',
        duration: Date.now() - start,
      });
    } catch (error: any) {
      hasAnyFailure = true;
      if (critical) hasCriticalFailure = true;

      results.push({
        name,
        status: 'fail',
        duration: Date.now() - start,
        message: error.message,
      });
    }
  }

  const status: HealthCheckResult['status'] = hasCriticalFailure
    ? 'unhealthy'
    : hasAnyFailure
    ? 'degraded'
    : 'healthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks: results,
  };
}

// Quick health check (just critical services)
export async function quickHealthCheck(): Promise<boolean> {
  try {
    await checkSupabase();
    await checkMemory();
    return true;
  } catch {
    return false;
  }
}

// Express endpoint handler
export async function healthEndpoint(req: any, res: any) {
  const result = await runHealthChecks();

  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(result);
}

// Liveness probe (for k8s)
export function livenessEndpoint(req: any, res: any) {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
}

// Readiness probe (for k8s)
export async function readinessEndpoint(req: any, res: any) {
  const isReady = await quickHealthCheck();

  if (isReady) {
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString() });
  }
}

// Get system info
export function getSystemInfo() {
  const memUsage = process.memoryUsage();

  return {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime_seconds: Math.round((Date.now() - startTime) / 1000),
    memory: {
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024),
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    },
    environment: process.env.NODE_ENV || 'development',
  };
}
