/**
 * Overnight Runner Type Definitions
 *
 * Types for the automated overnight outreach system that discovers businesses,
 * generates website previews, and sends personalized outreach.
 */

import { IndustryType } from '../ai/industry-templates';

/**
 * Configuration for an overnight run
 */
export interface OvernightConfig {
  /** Target industries to discover leads for */
  industries: IndustryType[];
  /** Locations to search (city, state format) */
  locations: string[];
  /** Maximum leads to process per night */
  maxLeads: number;
  /** Maximum emails to send per night (respect Gmail 500/day quota) */
  maxEmails: number;
  /** Website score threshold - target businesses with scores below this */
  websiteScoreThreshold: number;
  /** Include businesses with no website */
  includeNoWebsite: boolean;
  /** Include businesses with poor websites (score < threshold) */
  includePoorWebsite: boolean;
  /** Whether to send emails (false = dry run) */
  sendEmails: boolean;
  /** Whether to deploy previews to Vercel */
  deployPreviews: boolean;
  /** Hours during which to run (24h format) */
  runHours: { start: number; end: number };
  /** Delay between processing each lead (ms) */
  delayBetweenLeads: number;
  /** Maximum number of leads to process concurrently */
  maxConcurrentLeads: number;
  /** Priority order for industries (higher = more leads) */
  industryWeights?: Partial<Record<IndustryType, number>>;
}

/**
 * Default configuration
 */
export const DEFAULT_OVERNIGHT_CONFIG: OvernightConfig = {
  industries: ['plumbers', 'hvac', 'dentists', 'salons', 'fitness'],
  locations: ['Tucson, AZ', 'Phoenix, AZ', 'Scottsdale, AZ'],
  maxLeads: 50,
  maxEmails: 50,
  websiteScoreThreshold: 6,
  includeNoWebsite: true,
  includePoorWebsite: true,
  sendEmails: true,
  deployPreviews: true,
  runHours: { start: 22, end: 6 }, // 10 PM to 6 AM
  delayBetweenLeads: 30000, // 30 seconds
  maxConcurrentLeads: 2,
  industryWeights: {
    plumbers: 2,
    hvac: 2,
    dentists: 1,
    salons: 1,
    fitness: 1,
  },
};

/**
 * Status of an overnight run
 */
export type OvernightRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Record of an overnight run
 */
export interface OvernightRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: OvernightRunStatus;
  config: OvernightConfig;
  stats: OvernightRunStats;
  errors: OvernightRunError[];
  created_at: string;
}

/**
 * Statistics for an overnight run
 */
export interface OvernightRunStats {
  /** Total leads discovered */
  leads_discovered: number;
  /** Leads that passed filters */
  leads_qualified: number;
  /** Website previews generated */
  previews_generated: number;
  /** Previews deployed to Vercel */
  previews_deployed: number;
  /** Emails composed */
  emails_composed: number;
  /** Emails sent successfully */
  emails_sent: number;
  /** Emails failed to send */
  emails_failed: number;
  /** Time spent discovering (ms) */
  discovery_time_ms: number;
  /** Time spent generating previews (ms) */
  preview_time_ms: number;
  /** Time spent deploying (ms) */
  deploy_time_ms: number;
  /** Time spent on email (ms) */
  email_time_ms: number;
  /** Total processing time (ms) */
  total_time_ms: number;
  /** Breakdown by industry */
  by_industry: Record<string, {
    discovered: number;
    qualified: number;
    previews: number;
    emails: number;
  }>;
  /** Breakdown by location */
  by_location: Record<string, {
    discovered: number;
    qualified: number;
  }>;
}

/**
 * Error during overnight run
 */
export interface OvernightRunError {
  timestamp: string;
  phase: 'discovery' | 'qualification' | 'preview' | 'deploy' | 'email' | 'other';
  message: string;
  lead_id?: string;
  stack?: string;
}

/**
 * Lead discovered during overnight run
 */
export interface DiscoveredLead {
  /** Business name */
  business_name: string;
  /** Website URL (empty if no website) */
  website_url: string;
  /** Has no real website */
  has_no_website: boolean;
  /** Website score (if has website) */
  website_score: number | null;
  /** Detected industry */
  industry: IndustryType;
  /** Contact email */
  email: string | null;
  /** Phone number */
  phone: string | null;
  /** Contact name */
  contact_name: string | null;
  /** City */
  city: string | null;
  /** State */
  state: string | null;
  /** Source of the lead */
  source: 'yelp' | 'yellowpages' | 'google';
  /** Source URL (Yelp page, etc) */
  source_url: string;
  /** Raw data from source */
  raw_data?: Record<string, any>;
}

/**
 * Result of processing a single lead
 */
export interface ProcessedLeadResult {
  lead_id: string;
  business_name: string;
  status: 'success' | 'partial' | 'failed';
  preview_generated: boolean;
  preview_url: string | null;
  email_sent: boolean;
  email_id: string | null;
  errors: string[];
  processing_time_ms: number;
}

/**
 * Result of the preview generation phase
 */
export interface PreviewGenerationResult {
  success: boolean;
  files_created: string[];
  local_path: string;
  deployed: boolean;
  deployed_url: string | null;
  design_variations: number;
  error?: string;
}

/**
 * Website preview content generated by Claude
 */
export interface PreviewContent {
  /** Main headline */
  headline: string;
  /** Business tagline */
  tagline: string;
  /** About section (2 paragraphs) */
  about: string;
  /** Service descriptions */
  services: Array<{
    name: string;
    description: string;
  }>;
  /** Call-to-action text */
  cta_text: string;
  /** Contact section text */
  contact_text: string;
  /** Meta description for SEO */
  meta_description: string;
}

/**
 * Color palette for website preview
 */
export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

/**
 * Industry-specific template configuration
 */
export interface IndustryTemplateConfig {
  industry: IndustryType;
  display_name: string;
  sections: string[];
  suggested_ctas: string[];
  trust_signals: string[];
  color_palettes: ColorPalette[];
}

/**
 * Quotas and limits
 */
export interface OvernightQuotas {
  /** Gmail daily send limit */
  gmail_daily_limit: number;
  /** Emails sent today */
  gmail_sent_today: number;
  /** Remaining Gmail quota */
  gmail_remaining: number;
  /** Vercel deployment limit (if any) */
  vercel_daily_limit: number | null;
  /** Vercel deployments today */
  vercel_deployed_today: number;
  /** Anthropic API calls today */
  anthropic_calls_today: number;
  /** Leads processed today */
  leads_processed_today: number;
}

/**
 * Event emitted during overnight run
 */
export interface OvernightEvent {
  type: 'run_started' | 'run_completed' | 'run_failed' |
        'lead_discovered' | 'lead_qualified' | 'lead_skipped' |
        'preview_generated' | 'preview_deployed' |
        'email_sent' | 'email_failed' |
        'quota_warning' | 'error';
  timestamp: string;
  run_id: string;
  data?: Record<string, any>;
}

/**
 * Callback for overnight events
 */
export type OvernightEventCallback = (event: OvernightEvent) => void;
