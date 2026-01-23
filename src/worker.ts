import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SequenceEngine, SendEmailFunction } from './email/sequence-engine';
import { EmailComposer } from './email/composer';
import { LeadModel } from './crm/lead-model';
import { ActivityLogger } from './crm/activity-logger';
import { config, features } from './utils/config';
import { logger } from './utils/logger';

interface WorkerConfig {
  sendEmail: SendEmailFunction;
  senderName: string;
  senderCompany: string;
  pollingIntervalMs?: number;
  emailBatchSize?: number;
}

interface Job {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  error?: string;
  created_at: string;
  processed_at?: string;
}

export class Worker {
  private supabase: SupabaseClient;
  private sequenceEngine: SequenceEngine;
  private leadModel: LeadModel;
  private activityLogger: ActivityLogger;
  private pollingInterval: number;
  private emailBatchSize: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(workerConfig: WorkerConfig) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required');
    }

    this.supabase = createClient(url, key);
    this.leadModel = new LeadModel();
    this.activityLogger = new ActivityLogger();

    const emailComposer = new EmailComposer({
      senderName: workerConfig.senderName,
      senderCompany: workerConfig.senderCompany,
    });

    this.sequenceEngine = new SequenceEngine({
      emailComposer,
      sendEmail: workerConfig.sendEmail,
      leadModel: this.leadModel,
      activityLogger: this.activityLogger,
    });

    this.pollingInterval = workerConfig.pollingIntervalMs || 60000; // 1 minute
    this.emailBatchSize = workerConfig.emailBatchSize || 50;
  }

  /**
   * Start the worker
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Worker started', { pollingInterval: this.pollingInterval });

    // Run immediately
    this.tick();

    // Then run on interval
    this.intervalId = setInterval(() => this.tick(), this.pollingInterval);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Worker is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('Worker stopped');
  }

  /**
   * Single tick of the worker loop
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) return;

    try {
      logger.debug('Worker tick starting');

      // Process email sequences
      const emailsProcessed = await this.processEmailSequences();

      // Process job queue
      const jobsProcessed = await this.processJobQueue();

      logger.debug('Worker tick completed', { emailsProcessed, jobsProcessed });
    } catch (error: any) {
      logger.error('Worker tick error', { error: error.message });
    }
  }

  /**
   * Process pending email sequence steps
   */
  private async processEmailSequences(): Promise<number> {
    try {
      const count = await this.sequenceEngine.processNextEmails(this.emailBatchSize);
      if (count > 0) {
        logger.info('Processed email sequences', { count });
      }
      return count;
    } catch (error: any) {
      logger.error('Email sequence processing error', { error: error.message });
      return 0;
    }
  }

  /**
   * Process jobs from queue
   */
  private async processJobQueue(): Promise<number> {
    try {
      // Get pending jobs
      const { data: jobs, error } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        // Table might not exist yet
        if (error.message.includes('does not exist')) {
          return 0;
        }
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        return 0;
      }

      let processed = 0;

      for (const job of jobs as Job[]) {
        await this.processJob(job);
        processed++;
      }

      return processed;
    } catch (error: any) {
      logger.error('Job queue processing error', { error: error.message });
      return 0;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    logger.debug('Processing job', { id: job.id, type: job.type });

    // Mark as processing
    await this.supabase
      .from('jobs')
      .update({
        status: 'processing',
        attempts: job.attempts + 1,
      })
      .eq('id', job.id);

    try {
      switch (job.type) {
        case 'send_email':
          await this.handleSendEmailJob(job);
          break;

        case 'analyze_website':
          await this.handleAnalyzeWebsiteJob(job);
          break;

        case 'generate_proposal':
          await this.handleGenerateProposalJob(job);
          break;

        case 'process_webhook':
          await this.handleProcessWebhookJob(job);
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark as completed
      await this.supabase
        .from('jobs')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      logger.debug('Job completed', { id: job.id });
    } catch (error: any) {
      logger.error('Job failed', { id: job.id, error: error.message });

      const newStatus = job.attempts + 1 >= job.max_attempts ? 'failed' : 'pending';

      await this.supabase
        .from('jobs')
        .update({
          status: newStatus,
          error: error.message,
        })
        .eq('id', job.id);
    }
  }

  /**
   * Handle send email job
   */
  private async handleSendEmailJob(job: Job): Promise<void> {
    const { lead_id, template, subject, variables } = job.payload;

    // This would integrate with the actual email sending
    logger.info('Send email job', { lead_id, template, subject });
  }

  /**
   * Handle website analysis job
   */
  private async handleAnalyzeWebsiteJob(job: Job): Promise<void> {
    const { lead_id, url } = job.payload;

    if (!features.ai) {
      throw new Error('AI features not configured');
    }

    // Import dynamically to avoid loading if not needed
    const { WebsiteAnalyzer } = await import('./ai/website-analyzer');
    const analyzer = new WebsiteAnalyzer();

    const analysis = await analyzer.analyze({ url });

    await this.leadModel.update(lead_id, {
      industry: analysis.industry,
      website_score: analysis.overallScore,
      ai_analysis: analysis,
      issues_found: analysis.issues.map(i => i.title),
      recommendations: analysis.recommendations.map(r => r.title),
    });

    logger.info('Website analysis completed', { lead_id, score: analysis.overallScore });
  }

  /**
   * Handle proposal generation job
   */
  private async handleGenerateProposalJob(job: Job): Promise<void> {
    const { lead_id, discount_percent } = job.payload;

    // Would import and use ProposalGenerator
    logger.info('Generate proposal job', { lead_id, discount_percent });
  }

  /**
   * Handle webhook processing job
   */
  private async handleProcessWebhookJob(job: Job): Promise<void> {
    const { events } = job.payload;

    // Would import and use WebhookHandler
    logger.info('Process webhook job', { eventCount: events?.length });
  }

  /**
   * Add a job to the queue
   */
  async enqueue(
    type: string,
    payload: any,
    options: { maxAttempts?: number; runAt?: Date } = {}
  ): Promise<string> {
    const { maxAttempts = 3, runAt } = options;

    const { data, error } = await this.supabase
      .from('jobs')
      .insert({
        type,
        payload,
        status: 'pending',
        attempts: 0,
        max_attempts: maxAttempts,
        run_at: runAt?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to enqueue job: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('status');

    if (error) {
      if (error.message.includes('does not exist')) {
        return { pending: 0, processing: 0, completed: 0, failed: 0 };
      }
      throw error;
    }

    const stats = { pending: 0, processing: 0, completed: 0, failed: 0 };

    for (const job of data || []) {
      stats[job.status as keyof typeof stats]++;
    }

    return stats;
  }
}

export function createWorker(config: WorkerConfig): Worker {
  return new Worker(config);
}

// CLI entry point
if (require.main === module) {
  const mockSendEmail: SendEmailFunction = async (to, subject, html, text) => {
    logger.info('[Mock] Sending email', { to, subject });
    return { messageId: `mock_${Date.now()}` };
  };

  const worker = new Worker({
    sendEmail: mockSendEmail,
    senderName: config.COMPANY_NAME,
    senderCompany: config.COMPANY_NAME,
    pollingIntervalMs: 30000, // 30 seconds for CLI
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down worker...');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down worker...');
    worker.stop();
    process.exit(0);
  });

  worker.start();
}
