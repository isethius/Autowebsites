/**
 * Overnight Runner
 *
 * Main orchestration loop for the overnight outreach system.
 * Discovers leads, generates website previews, deploys them, and sends outreach emails.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  OvernightConfig,
  OvernightRun,
  OvernightRunStats,
  OvernightRunError,
  OvernightEvent,
  OvernightEventCallback,
  DiscoveredLead,
  ProcessedLeadResult,
} from './types';
import { getQuotas, calculateEffectiveLimits, createRunSchedule } from './config';
import { getSupabaseClient } from '../utils/supabase';
import { logger } from '../utils/logger';
import { YelpScraper, YelpBusiness } from '../discovery/yelp-scraper';
import { LeadModel, CreateLeadInput } from '../crm/lead-model';
import { IndustryType, detectIndustryFromKeywords } from '../ai/industry-templates';
import { LeadWebsiteGenerator } from '../preview/lead-website-generator';
import { deployToVercel } from '../preview/deploy';
import { createEmailComposer } from '../email/composer';
import { sendEmail, EmailMessage, isConfigured as isGmailConfigured } from '../email/gmail-client';
import { config as appConfig } from '../utils/config';

export class OvernightRunner {
  private config: OvernightConfig;
  private runId: string;
  private run: OvernightRun;
  private stats: OvernightRunStats;
  private errors: OvernightRunError[] = [];
  private cancelled = false;
  private onEvent?: OvernightEventCallback;
  private supabase = getSupabaseClient();
  private leadModel = new LeadModel();
  private emailComposer = createEmailComposer({
    senderName: appConfig.GMAIL_FROM_NAME || 'Alex',
    senderCompany: appConfig.COMPANY_NAME,
    unsubscribeBaseUrl: `${appConfig.DASHBOARD_URL || 'http://localhost:3001'}/unsubscribe`,
  });

  constructor(config: OvernightConfig, onEvent?: OvernightEventCallback) {
    this.config = config;
    this.runId = uuidv4();
    this.onEvent = onEvent;

    this.stats = this.initStats();
    this.run = {
      id: this.runId,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: 'pending',
      config,
      stats: this.stats,
      errors: [],
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Execute the overnight cycle
   */
  async execute(): Promise<OvernightRun> {
    const startTime = Date.now();

    try {
      // Initialize
      await this.initRun();
      this.emitEvent('run_started', { config: this.config });

      // Get effective limits based on quotas
      const quotas = await getQuotas();
      const limits = calculateEffectiveLimits(this.config, quotas);

      logger.info('Overnight run starting', {
        runId: this.runId,
        effectiveLimits: limits,
        quotas,
      });

      if (limits.maxLeads === 0) {
        logger.warn('No capacity for leads, ending run');
        this.run.status = 'completed';
        this.run.completed_at = new Date().toISOString();
        await this.saveRun();
        return this.run;
      }

      // Create run schedule
      const schedule = createRunSchedule(this.config);
      let leadsProcessed = 0;
      let emailsSent = 0;
      let leadsScheduled = 0;
      const maxConcurrent = Math.max(1, this.config.maxConcurrentLeads || 1);

      // Process each industry-location pair
      for (const { industry, location } of schedule.pairs) {
        if (this.cancelled) break;
        if (leadsScheduled >= limits.maxLeads) break;
        if (emailsSent >= limits.maxEmails) break;

        // Calculate how many leads to find for this pair
        const remainingLeads = limits.maxLeads - leadsScheduled;
        const leadsToFind = Math.min(10, remainingLeads);

        try {
          // Discover leads
          const discoveryStart = Date.now();
          const discoveredLeads = await this.discoverLeads(industry, location, leadsToFind);
          this.stats.discovery_time_ms += Date.now() - discoveryStart;

          // Process leads with bounded concurrency
          const inFlight = new Set<Promise<void>>();

          const scheduleLead = (lead: DiscoveredLead): Promise<void> => {
            return (async () => {
              try {
                const result = await this.processLead(lead);
                if (result.email_sent) {
                  emailsSent++;
                }
              } catch (err: any) {
                this.recordError('other', err.message, undefined, err.stack);
              } finally {
                leadsProcessed++;
              }
            })();
          };

          for (const lead of discoveredLeads) {
            if (this.cancelled) break;
            if (leadsScheduled >= limits.maxLeads) break;
            if (emailsSent >= limits.maxEmails) break;

            const task = scheduleLead(lead);
            leadsScheduled++;
            inFlight.add(task);
            task.finally(() => inFlight.delete(task));

            if (this.config.delayBetweenLeads > 0) {
              await this.delay(this.config.delayBetweenLeads);
            }

            if (inFlight.size >= maxConcurrent) {
              await Promise.race(inFlight);
            }
          }

          await Promise.all(inFlight);
        } catch (err: any) {
          this.recordError('discovery', `Discovery failed for ${industry} in ${location}: ${err.message}`);
        }
      }

      // Finalize
      this.run.status = 'completed';
      this.stats.total_time_ms = Date.now() - startTime;
      this.emitEvent('run_completed', { stats: this.stats });

    } catch (error: any) {
      this.run.status = 'failed';
      this.recordError('other', error.message, undefined, error.stack);
      this.emitEvent('run_failed', { error: error.message });
    } finally {
      this.run.completed_at = new Date().toISOString();
      this.run.stats = this.stats;
      this.run.errors = this.errors;
      await this.saveRun();
    }

    return this.run;
  }

  /**
   * Cancel the run
   */
  cancel(): void {
    this.cancelled = true;
    this.run.status = 'cancelled';
    logger.info('Overnight run cancelled', { runId: this.runId });
  }

  /**
   * Initialize the run in the database
   */
  private async initRun(): Promise<void> {
    this.run.status = 'running';
    await this.saveRun();

    // Initialize preview generator
    // Check if Gmail is configured for sending emails
    if (this.config.sendEmails && !isGmailConfigured()) {
      logger.warn('Gmail not configured - emails will be simulated');
    }
  }

  /**
   * Discover leads for an industry/location pair
   */
  private async discoverLeads(
    industry: IndustryType,
    location: string,
    limit: number
  ): Promise<DiscoveredLead[]> {
    const discovered: DiscoveredLead[] = [];

    // Use Yelp scraper
    const scraper = new YelpScraper();

    // Map industry to search query
    const searchQuery = this.getSearchQuery(industry);

    logger.debug('Discovering leads', { industry, location, searchQuery, limit });

    try {
      const result = await scraper.search({
        query: searchQuery,
        location,
        maxResults: limit * 2, // Get more to filter
        noWebsiteOnly: this.config.includeNoWebsite && !this.config.includePoorWebsite,
      });

      for (const biz of result.businesses) {
        if (discovered.length >= limit) break;

        // Check if already in database
        const existing = await this.leadModel.getByUrl(biz.url || biz.yelpUrl);
        if (existing) {
          logger.debug('Skipping existing lead', { business: biz.name });
          continue;
        }

        const lead = await this.qualifyBusiness(biz, industry, location);
        if (lead) {
          discovered.push(lead);
          this.stats.leads_discovered++;
          this.updateIndustryStats(industry, 'discovered');
          this.updateLocationStats(location, 'discovered');
          this.emitEvent('lead_discovered', { lead });
        }
      }
    } catch (err: any) {
      logger.error('Yelp search failed', { error: err.message, industry, location });
      throw err;
    }

    return discovered;
  }

  /**
   * Qualify a business as a good lead
   */
  private async qualifyBusiness(
    biz: YelpBusiness,
    industry: IndustryType,
    location: string
  ): Promise<DiscoveredLead | null> {
    const hasNoWebsite = YelpScraper.hasNoRealWebsite(biz);

    // Filter based on config
    if (hasNoWebsite && !this.config.includeNoWebsite) {
      this.emitEvent('lead_skipped', { reason: 'has_no_website', business: biz.name });
      return null;
    }

    // Parse address
    const parsed = YelpScraper.parseAddress(biz.address || '');

    const lead: DiscoveredLead = {
      business_name: biz.name,
      website_url: biz.url || '',
      has_no_website: hasNoWebsite,
      website_score: null, // Will be scored if has website
      industry,
      email: null, // Will be extracted later
      phone: biz.phone || null,
      contact_name: null,
      city: parsed.city || location.split(',')[0].trim(),
      state: parsed.state || location.split(',')[1]?.trim() || null,
      source: 'yelp',
      source_url: biz.yelpUrl,
      raw_data: biz,
    };

    // If has website and we want poor websites, check score
    if (!hasNoWebsite && this.config.includePoorWebsite) {
      // Score will be done during processing
      lead.website_score = null;
    }

    this.stats.leads_qualified++;
    this.updateIndustryStats(industry, 'qualified');
    this.updateLocationStats(location, 'qualified');
    this.emitEvent('lead_qualified', { lead });

    return lead;
  }

  /**
   * Process a single lead
   */
  private async processLead(discoveredLead: DiscoveredLead): Promise<ProcessedLeadResult> {
    const startTime = Date.now();
    const result: ProcessedLeadResult = {
      lead_id: '',
      business_name: discoveredLead.business_name,
      status: 'failed',
      preview_generated: false,
      preview_url: null,
      email_sent: false,
      email_id: null,
      errors: [],
      processing_time_ms: 0,
    };

    try {
      // Create lead in database
      const leadInput: CreateLeadInput = {
        business_name: discoveredLead.business_name,
        website_url: discoveredLead.website_url || discoveredLead.source_url,
        industry: discoveredLead.industry,
        email: discoveredLead.email || undefined,
        phone: discoveredLead.phone || undefined,
        contact_name: discoveredLead.contact_name || undefined,
        city: discoveredLead.city || undefined,
        state: discoveredLead.state || undefined,
        website_score: discoveredLead.website_score || undefined,
        tags: ['overnight', discoveredLead.has_no_website ? 'no-website' : 'poor-website'],
        custom_fields: {
          source: discoveredLead.source,
          source_url: discoveredLead.source_url,
          overnight_run_id: this.runId,
        },
      };

      const lead = await this.leadModel.create(leadInput);
      result.lead_id = lead.id;

      // Update lead with overnight run reference
      await this.supabase
        .from('leads')
        .update({ overnight_run_id: this.runId })
        .eq('id', lead.id);

      // Generate preview
      {
        try {
          const previewGenerator = new LeadWebsiteGenerator();
          const previewStart = Date.now();
          const previewResult = await previewGenerator.generate({
            leadId: lead.id,
            businessName: discoveredLead.business_name,
            industry: discoveredLead.industry,
            city: discoveredLead.city || undefined,
            state: discoveredLead.state || undefined,
            services: [], // Will be inferred from industry
          });

          this.stats.preview_time_ms += Date.now() - previewStart;
          this.stats.previews_generated++;
          result.preview_generated = true;

          this.emitEvent('preview_generated', {
            leadId: lead.id,
            localPath: previewResult.local_path,
          });

          // Deploy if configured
          if (this.config.deployPreviews && previewResult.local_path) {
            const deployStart = Date.now();
            const deployResult = await deployToVercel({
              directory: previewResult.local_path,
              projectName: `preview-${discoveredLead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`,
              prod: true,
            });

            this.stats.deploy_time_ms += Date.now() - deployStart;

            if (deployResult.success) {
              result.preview_url = deployResult.url;
              this.stats.previews_deployed++;

              // Update lead with preview URL
              await this.leadModel.update(lead.id, {
                gallery_url: deployResult.url,
              });

              this.emitEvent('preview_deployed', {
                leadId: lead.id,
                url: deployResult.url,
              });
            } else {
              result.errors.push(`Deploy failed: ${deployResult.error}`);
            }
          }

          this.updateIndustryStats(discoveredLead.industry, 'previews');
        } catch (err: any) {
          result.errors.push(`Preview generation failed: ${err.message}`);
          this.recordError('preview', err.message, lead.id, err.stack);
        }
      }

      // Send email if configured and we have a preview
      if (this.config.sendEmails && result.preview_url) {
        try {
          const emailStart = Date.now();

          // Try to extract email if not present
          if (!discoveredLead.email) {
            // For now, skip leads without email
            // In future: use contact extractor
            result.errors.push('No email address found');
          } else {
            const email = this.composeOutreachEmail(discoveredLead, result.preview_url);

            const sendResult = await sendEmail({
              to: discoveredLead.email,
              from: appConfig.GMAIL_FROM_EMAIL || '',
              fromName: appConfig.GMAIL_FROM_NAME || 'Alex',
              subject: email.subject,
              html: email.html,
              text: email.text,
            });

            this.stats.email_time_ms += Date.now() - emailStart;

            if (sendResult.success) {
              result.email_sent = true;
              result.email_id = sendResult.messageId || null;
              this.stats.emails_sent++;
              this.updateIndustryStats(discoveredLead.industry, 'emails');

              // Update lead
              await this.leadModel.update(lead.id, {
                pipeline_stage: 'contacted',
              });
              await this.leadModel.recordEmailSent(lead.id);

              this.emitEvent('email_sent', {
                leadId: lead.id,
                messageId: sendResult.messageId,
              });
            } else {
              result.errors.push(`Email failed: ${sendResult.error}`);
              this.stats.emails_failed++;
              this.emitEvent('email_failed', {
                leadId: lead.id,
                error: sendResult.error,
              });
            }
          }

          this.stats.emails_composed++;
        } catch (err: any) {
          result.errors.push(`Email error: ${err.message}`);
          this.recordError('email', err.message, lead.id, err.stack);
        }
      }

      result.status = result.errors.length === 0 ? 'success' : 'partial';

    } catch (err: any) {
      result.errors.push(err.message);
      result.status = 'failed';
      this.recordError('other', err.message, undefined, err.stack);
    }

    result.processing_time_ms = Date.now() - startTime;
    return result;
  }

  /**
   * Compose outreach email for a lead
   */
  private composeOutreachEmail(
    lead: DiscoveredLead,
    previewUrl: string
  ): { subject: string; html: string; text: string } {
    const isNoWebsite = lead.has_no_website;

    const subject = isNoWebsite
      ? `I built you a website, ${lead.business_name} 👀`
      : `I redesigned ${lead.business_name}'s website 👀`;

    const contactName = lead.contact_name || 'there';

    const htmlBody = `
      <p>Hi ${contactName},</p>

      <p>I noticed ${lead.business_name} ${isNoWebsite
        ? "doesn't have a website yet"
        : "could use a website refresh"
      } and took the liberty of creating a preview of what a modern site could look like:</p>

      <p><a href="${previewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Your Preview →</a></p>

      <p>I've included a few design options - take a look and let me know which style resonates with you (or if you'd like something completely different).</p>

      <p>This is just a preview - if you like what you see, I can have a fully customized version live within a week.</p>

      <p>No pressure, no obligation. Just wanted to show you what's possible.</p>

      <p>Best,<br/>
      ${appConfig.GMAIL_FROM_NAME || 'Alex'}<br/>
      ${appConfig.COMPANY_NAME}</p>

      <p style="color: #666; font-size: 12px;">P.S. The preview includes your business info I found online. Let me know if anything needs updating!</p>
    `;

    const textBody = `
Hi ${contactName},

I noticed ${lead.business_name} ${isNoWebsite
      ? "doesn't have a website yet"
      : "could use a website refresh"
    } and took the liberty of creating a preview of what a modern site could look like:

${previewUrl}

I've included a few design options - take a look and let me know which style resonates with you (or if you'd like something completely different).

This is just a preview - if you like what you see, I can have a fully customized version live within a week.

No pressure, no obligation. Just wanted to show you what's possible.

Best,
${appConfig.GMAIL_FROM_NAME || 'Alex'}
${appConfig.COMPANY_NAME}

P.S. The preview includes your business info I found online. Let me know if anything needs updating!
    `.trim();

    return { subject, html: htmlBody, text: textBody };
  }

  /**
   * Get search query for industry
   */
  private getSearchQuery(industry: IndustryType): string {
    const queries: Record<string, string> = {
      plumbers: 'plumbers',
      hvac: 'hvac air conditioning',
      dentists: 'dentist',
      salons: 'hair salon',
      fitness: 'gym fitness',
      contractors: 'general contractor',
      lawyers: 'attorney lawyer',
      restaurants: 'restaurant',
      doctors: 'doctor medical practice',
      accountants: 'accountant cpa',
      realtors: 'real estate agent',
      'auto-repair': 'auto repair mechanic',
      cleaning: 'cleaning service',
      landscaping: 'landscaping lawn care',
      photography: 'photographer',
      other: 'local business',
    };

    return queries[industry] || industry;
  }

  /**
   * Initialize stats object
   */
  private initStats(): OvernightRunStats {
    return {
      leads_discovered: 0,
      leads_qualified: 0,
      previews_generated: 0,
      previews_deployed: 0,
      emails_composed: 0,
      emails_sent: 0,
      emails_failed: 0,
      discovery_time_ms: 0,
      preview_time_ms: 0,
      deploy_time_ms: 0,
      email_time_ms: 0,
      total_time_ms: 0,
      by_industry: {},
      by_location: {},
    };
  }

  /**
   * Update industry stats
   */
  private updateIndustryStats(industry: string, field: 'discovered' | 'qualified' | 'previews' | 'emails'): void {
    if (!this.stats.by_industry[industry]) {
      this.stats.by_industry[industry] = {
        discovered: 0,
        qualified: 0,
        previews: 0,
        emails: 0,
      };
    }
    this.stats.by_industry[industry][field]++;
  }

  /**
   * Update location stats
   */
  private updateLocationStats(location: string, field: 'discovered' | 'qualified'): void {
    if (!this.stats.by_location[location]) {
      this.stats.by_location[location] = {
        discovered: 0,
        qualified: 0,
      };
    }
    this.stats.by_location[location][field]++;
  }

  /**
   * Record an error
   */
  private recordError(
    phase: OvernightRunError['phase'],
    message: string,
    leadId?: string,
    stack?: string
  ): void {
    const error: OvernightRunError = {
      timestamp: new Date().toISOString(),
      phase,
      message,
      lead_id: leadId,
      stack,
    };
    this.errors.push(error);
    logger.error('Overnight run error', error);
    this.emitEvent('error', error);
  }

  /**
   * Save run to database
   */
  private async saveRun(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('overnight_runs')
        .upsert({
          id: this.run.id,
          started_at: this.run.started_at,
          completed_at: this.run.completed_at,
          status: this.run.status,
          config: this.run.config,
          stats: this.stats,
          errors: this.errors,
        });

      if (error) {
        logger.error('Failed to save overnight run', { error: error.message });
      }
    } catch (err: any) {
      logger.error('Failed to save overnight run', { error: err.message });
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(type: OvernightEvent['type'], data?: Record<string, any>): void {
    if (this.onEvent) {
      this.onEvent({
        type,
        timestamp: new Date().toISOString(),
        run_id: this.runId,
        data,
      });
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
