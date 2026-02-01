/**
 * Overnight Runner Configuration
 *
 * Manages configuration, quotas, and runtime settings for the overnight outreach system.
 */

import { OvernightConfig, OvernightQuotas, DEFAULT_OVERNIGHT_CONFIG } from './types';
import { IndustryType } from '../ai/industry-templates';
import { getSupabaseClient } from '../utils/supabase';
import { config } from '../utils/config';

/**
 * Environment variables for overnight config
 */
interface OvernightEnvConfig {
  OVERNIGHT_MAX_LEADS?: string;
  OVERNIGHT_MAX_EMAILS?: string;
  OVERNIGHT_SCORE_THRESHOLD?: string;
  OVERNIGHT_RUN_START_HOUR?: string;
  OVERNIGHT_RUN_END_HOUR?: string;
  OVERNIGHT_DELAY_MS?: string;
  OVERNIGHT_MAX_CONCURRENT_LEADS?: string;
  OVERNIGHT_INDUSTRIES?: string;
  OVERNIGHT_LOCATIONS?: string;
  OVERNIGHT_DRY_RUN?: string;
}

/**
 * Load overnight configuration from environment or use defaults
 */
export function loadOvernightConfig(overrides?: Partial<OvernightConfig>): OvernightConfig {
  const env = process.env as unknown as OvernightEnvConfig;

  // Parse industries from env
  let industries = DEFAULT_OVERNIGHT_CONFIG.industries;
  if (env.OVERNIGHT_INDUSTRIES) {
    industries = env.OVERNIGHT_INDUSTRIES.split(',').map(s => s.trim()) as IndustryType[];
  }

  // Parse locations from env
  let locations = DEFAULT_OVERNIGHT_CONFIG.locations;
  if (env.OVERNIGHT_LOCATIONS) {
    locations = env.OVERNIGHT_LOCATIONS.split(',').map(s => s.trim());
  }

  const baseConfig: OvernightConfig = {
    industries,
    locations,
    maxLeads: parseInt(env.OVERNIGHT_MAX_LEADS || '', 10) || DEFAULT_OVERNIGHT_CONFIG.maxLeads,
    maxEmails: parseInt(env.OVERNIGHT_MAX_EMAILS || '', 10) || DEFAULT_OVERNIGHT_CONFIG.maxEmails,
    websiteScoreThreshold: parseInt(env.OVERNIGHT_SCORE_THRESHOLD || '', 10) || DEFAULT_OVERNIGHT_CONFIG.websiteScoreThreshold,
    includeNoWebsite: DEFAULT_OVERNIGHT_CONFIG.includeNoWebsite,
    includePoorWebsite: DEFAULT_OVERNIGHT_CONFIG.includePoorWebsite,
    sendEmails: env.OVERNIGHT_DRY_RUN !== 'true',
    deployPreviews: env.OVERNIGHT_DRY_RUN !== 'true',
    runHours: {
      start: parseInt(env.OVERNIGHT_RUN_START_HOUR || '', 10) || DEFAULT_OVERNIGHT_CONFIG.runHours.start,
      end: parseInt(env.OVERNIGHT_RUN_END_HOUR || '', 10) || DEFAULT_OVERNIGHT_CONFIG.runHours.end,
    },
    delayBetweenLeads: parseInt(env.OVERNIGHT_DELAY_MS || '', 10) || DEFAULT_OVERNIGHT_CONFIG.delayBetweenLeads,
    maxConcurrentLeads: parseInt(env.OVERNIGHT_MAX_CONCURRENT_LEADS || '', 10) || DEFAULT_OVERNIGHT_CONFIG.maxConcurrentLeads,
    industryWeights: DEFAULT_OVERNIGHT_CONFIG.industryWeights,
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Get current quotas and usage
 */
export async function getQuotas(): Promise<OvernightQuotas> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // Get Gmail quota (from config or default)
  const gmailDailyLimit = parseInt(config.GMAIL_DAILY_QUOTA?.toString() || '500', 10);

  // Count emails sent today
  const { count: emailsSentToday } = await supabase
    .from('email_log')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', `${today}T00:00:00Z`)
    .lt('sent_at', `${today}T23:59:59Z`)
    .eq('status', 'sent');

  // Count leads processed today
  const { count: leadsProcessedToday } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`)
    .not('overnight_run_id', 'is', null);

  // Count Vercel deployments today (from overnight_runs stats)
  const { data: todayRuns } = await supabase
    .from('overnight_runs')
    .select('stats')
    .gte('started_at', `${today}T00:00:00Z`);

  let vercelDeployedToday = 0;
  let anthropicCallsToday = 0;
  if (todayRuns) {
    for (const run of todayRuns) {
      const stats = run.stats as any;
      vercelDeployedToday += stats?.previews_deployed || 0;
      anthropicCallsToday += stats?.previews_generated || 0;
    }
  }

  return {
    gmail_daily_limit: gmailDailyLimit,
    gmail_sent_today: emailsSentToday || 0,
    gmail_remaining: Math.max(0, gmailDailyLimit - (emailsSentToday || 0)),
    vercel_daily_limit: null, // Vercel doesn't have strict daily limits
    vercel_deployed_today: vercelDeployedToday,
    anthropic_calls_today: anthropicCallsToday,
    leads_processed_today: leadsProcessedToday || 0,
  };
}

/**
 * Check if we're within allowed run hours
 */
export function isWithinRunHours(runHours: { start: number; end: number }): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // Handle overnight hours (e.g., 22-6)
  if (runHours.start > runHours.end) {
    return currentHour >= runHours.start || currentHour < runHours.end;
  }

  // Handle same-day hours (e.g., 9-17)
  return currentHour >= runHours.start && currentHour < runHours.end;
}

/**
 * Calculate effective limits based on quotas
 */
export function calculateEffectiveLimits(
  config: OvernightConfig,
  quotas: OvernightQuotas
): { maxLeads: number; maxEmails: number } {
  // Respect Gmail quota
  const effectiveMaxEmails = Math.min(
    config.maxEmails,
    quotas.gmail_remaining
  );

  // Don't process more leads than we can email
  const effectiveMaxLeads = Math.min(
    config.maxLeads,
    effectiveMaxEmails
  );

  return {
    maxLeads: effectiveMaxLeads,
    maxEmails: effectiveMaxEmails,
  };
}

/**
 * Get industry weights for round-robin selection
 */
export function getWeightedIndustries(config: OvernightConfig): IndustryType[] {
  const weighted: IndustryType[] = [];

  for (const industry of config.industries) {
    const weight = config.industryWeights?.[industry] || 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(industry);
    }
  }

  // Shuffle for randomization
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }

  return weighted;
}

/**
 * Create a run schedule based on config
 */
export function createRunSchedule(config: OvernightConfig): {
  industries: IndustryType[];
  locations: string[];
  pairs: Array<{ industry: IndustryType; location: string }>;
} {
  const weightedIndustries = getWeightedIndustries(config);
  const pairs: Array<{ industry: IndustryType; location: string }> = [];

  // Create industry-location pairs
  for (const location of config.locations) {
    for (const industry of weightedIndustries) {
      pairs.push({ industry, location });
    }
  }

  // Shuffle pairs
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return {
    industries: weightedIndustries,
    locations: config.locations,
    pairs,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: OvernightConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.industries.length === 0) {
    errors.push('At least one industry is required');
  }

  if (config.locations.length === 0) {
    errors.push('At least one location is required');
  }

  if (config.maxLeads < 1) {
    errors.push('maxLeads must be at least 1');
  }

  if (config.maxEmails < 0) {
    errors.push('maxEmails cannot be negative');
  }

  if (config.websiteScoreThreshold < 1 || config.websiteScoreThreshold > 10) {
    errors.push('websiteScoreThreshold must be between 1 and 10');
  }

  if (config.delayBetweenLeads < 1000) {
    errors.push('delayBetweenLeads should be at least 1000ms to avoid rate limiting');
  }

  if (config.maxConcurrentLeads < 1) {
    errors.push('maxConcurrentLeads must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export config summary for logging
 */
export function configSummary(config: OvernightConfig): string {
  return [
    `Industries: ${config.industries.join(', ')}`,
    `Locations: ${config.locations.join(', ')}`,
    `Max Leads: ${config.maxLeads}`,
    `Max Emails: ${config.maxEmails}`,
    `Score Threshold: <${config.websiteScoreThreshold}`,
    `Include No Website: ${config.includeNoWebsite}`,
    `Include Poor Website: ${config.includePoorWebsite}`,
    `Deploy Previews: ${config.deployPreviews}`,
    `Send Emails: ${config.sendEmails}`,
    `Run Hours: ${config.runHours.start}:00 - ${config.runHours.end}:00`,
    `Max Concurrent Leads: ${config.maxConcurrentLeads}`,
  ].join('\n');
}
