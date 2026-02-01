import * as fs from 'fs';
import * as path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceClient } from '../utils/supabase';
import { logger } from '../utils/logger';
import { getRetryPolicy, shouldRetry, calculateRetryDelay, RetryPolicy } from './retry-policy';
import { getAlertManager, AlertManager } from './alerting';

export interface Job {
  id: string;
  type: JobType;
  data: any;
  status: JobStatus;
  priority: number;
  createdAt: string;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
  retries: number;
  maxRetries: number;
}

export type JobType = 'discover' | 'capture' | 'generate' | 'deploy' | 'email' | 'followup' | 'score';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'scheduled' | 'cancelled';

export interface QueueConfig {
  maxConcurrent: number;
  rateLimitPerMinute: number;
  retryDelayMs: number;
  persistPath?: string;
  useDatabase: boolean;
  workerId?: string;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 2,
  rateLimitPerMinute: 30,
  retryDelayMs: 5000,
  persistPath: 'tmp/autowebsites/queue.json',
  useDatabase: !!process.env.SUPABASE_URL,
  workerId: `worker-${process.pid}-${Date.now()}`,
};

// Job execution timeout (5 minutes default)
const JOB_EXECUTION_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10);

// Stuck job threshold (30 minutes)
const STUCK_JOB_THRESHOLD_MS = parseInt(process.env.STUCK_JOB_THRESHOLD_MS || '1800000', 10);

// Monitoring interval (5 minutes)
const MONITORING_INTERVAL_MS = 5 * 60 * 1000;

export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processing: Set<string> = new Set();
  private handlers: Map<JobType, (job: Job) => Promise<any>> = new Map();
  private config: QueueConfig;
  private lastProcessedTimes: number[] = [];
  private isRunning = false;
  private supabase: SupabaseClient | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitorInterval: NodeJS.Timeout | null = null;
  private alertManager: AlertManager;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.alertManager = getAlertManager();

    // Initialize Supabase if database persistence is enabled
    if (this.config.useDatabase) {
      try {
        this.supabase = getSupabaseServiceClient();
        logger.info('Job queue using database persistence');
      } catch {
        logger.warn('Database persistence enabled but Supabase not configured, falling back to file');
        this.config.useDatabase = false;
      }
    }

    // Load from disk if not using database
    if (!this.config.useDatabase) {
      this.loadFromDisk();
    }
  }

  registerHandler(type: JobType, handler: (job: Job) => Promise<any>): void {
    this.handlers.set(type, handler);
  }

  async addJob(type: JobType, data: any, options?: {
    priority?: number;
    scheduledFor?: string;
    maxRetries?: number;
  }): Promise<Job> {
    const job: Job = {
      id: this.generateId(),
      type,
      data,
      status: options?.scheduledFor ? 'scheduled' : 'pending',
      priority: options?.priority || 0,
      createdAt: new Date().toISOString(),
      scheduledFor: options?.scheduledFor,
      retries: 0,
      maxRetries: options?.maxRetries || 3
    };

    if (this.supabase && this.config.useDatabase) {
      // Insert into database
      const { error } = await this.supabase
        .from('job_queue')
        .insert({
          id: job.id,
          type: job.type,
          data: job.data,
          status: job.status,
          priority: job.priority,
          scheduled_for: job.scheduledFor || new Date().toISOString(),
          max_attempts: job.maxRetries,
        });

      if (error) {
        logger.error('Failed to add job to database', { error: error.message });
        // Fall back to in-memory
        this.jobs.set(job.id, job);
      }
    } else {
      this.jobs.set(job.id, job);
      this.saveToDisk();
    }

    logger.info(`Job added: ${job.type}`, { jobId: job.id.slice(0, 8) });
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    if (this.supabase && this.config.useDatabase) {
      const { data, error } = await this.supabase
        .from('job_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return this.dbRowToJob(data);
    }
    return this.jobs.get(id);
  }

  async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    if (this.supabase && this.config.useDatabase) {
      const { data, error } = await this.supabase
        .from('job_queue')
        .select('*')
        .eq('status', status)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map(this.dbRowToJob);
    }
    return Array.from(this.jobs.values()).filter(j => j.status === status);
  }

  getJobsByType(type: JobType): Job[] {
    return Array.from(this.jobs.values()).filter(j => j.type === type);
  }

  getPendingJobs(): Job[] {
    const now = new Date();
    return Array.from(this.jobs.values())
      .filter(j => {
        if (j.status === 'pending') return true;
        if (j.status === 'scheduled' && j.scheduledFor) {
          return new Date(j.scheduledFor) <= now;
        }
        return false;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  async processNext(): Promise<Job | null> {
    // Check rate limit
    if (!this.canProcessNow()) {
      return null;
    }

    // Check concurrent limit
    if (this.processing.size >= this.config.maxConcurrent) {
      return null;
    }

    let job: Job | null = null;

    if (this.supabase && this.config.useDatabase) {
      // Use database function to claim a job atomically
      const { data, error } = await this.supabase
        .rpc('claim_job', { worker_id: this.config.workerId });

      if (error || !data) {
        return null;
      }

      // Fetch the claimed job
      const { data: jobData } = await this.supabase
        .from('job_queue')
        .select('*')
        .eq('id', data)
        .single();

      if (jobData) {
        job = this.dbRowToJob(jobData);
      }
    } else {
      // Get next pending job from memory
      const pendingJobs = this.getPendingJobs();
      job = pendingJobs.find(j => !this.processing.has(j.id)) || null;

      if (job) {
        job.status = 'running';
        job.startedAt = new Date().toISOString();
        job.retries++;
        this.saveToDisk();
      }
    }

    if (!job) {
      return null;
    }

    // Get handler
    const handler = this.handlers.get(job.type);
    if (!handler) {
      logger.error(`No handler registered for job type: ${job.type}`);
      job.maxRetries = 0; // Don't retry missing handlers
      await this.failJob(job.id, 'No handler registered', job);
      return job;
    }

    // Mark as processing
    this.processing.add(job.id);
    this.recordProcessTime();

    logger.info(`Processing job: ${job.type}`, { jobId: job.id.slice(0, 8) });

    try {
      // Log job start
      await this.logJobEvent(job.id, 'info', 'Job execution started', {
        type: job.type,
        attempt: job.retries + 1,
      });

      // Execute with timeout
      const result = await this.executeWithTimeout(handler, job, JOB_EXECUTION_TIMEOUT_MS);
      await this.completeJob(job.id, result);
      job.status = 'completed';

      // Log job completion
      await this.logJobEvent(job.id, 'info', 'Job completed successfully', {
        duration: job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : undefined,
      });

      logger.info(`Job completed: ${job.type}`, { jobId: job.id.slice(0, 8) });
    } catch (err: any) {
      job.error = err.message;

      // Log job failure
      await this.logJobEvent(job.id, 'error', 'Job execution failed', {
        error: err.message,
        attempt: job.retries + 1,
      });

      // Use retry policy to determine retry behavior
      await this.failJob(job.id, err.message, job);

      // Update local job status based on retry decision
      const policy = getRetryPolicy(job.type);
      const retryDecision = shouldRetry(policy, err.message, job.retries);

      if (retryDecision.shouldRetry) {
        job.status = 'scheduled';
        logger.warn(`Job retry scheduled: ${job.type}`, {
          jobId: job.id.slice(0, 8),
          attempt: job.retries,
          reason: retryDecision.reason,
        });
      } else {
        job.status = 'failed';
        logger.error(`Job failed permanently: ${job.type}`, {
          jobId: job.id.slice(0, 8),
          error: err.message,
          reason: retryDecision.reason,
        });
      }
    } finally {
      this.processing.delete(job.id);
    }

    return job;
  }

  private async completeJob(jobId: string, result?: any): Promise<void> {
    if (this.supabase && this.config.useDatabase) {
      await this.supabase.rpc('complete_job', {
        job_id: jobId,
        job_result: result ? JSON.stringify(result) : null,
      });
    } else {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.result = result;
        this.saveToDisk();
      }
    }
  }

  private async failJob(jobId: string, errorMessage: string, job: Job): Promise<void> {
    const policy = getRetryPolicy(job.type);
    const retryDecision = shouldRetry(policy, errorMessage, job.retries);
    const willRetry = retryDecision.shouldRetry;

    if (this.supabase && this.config.useDatabase) {
      if (willRetry) {
        // Calculate delay using retry policy
        const delay = calculateRetryDelay(policy, job.retries + 1);
        const nextRetry = new Date(Date.now() + delay);

        await this.supabase
          .from('job_queue')
          .update({
            status: 'scheduled',
            error: errorMessage,
            scheduled_for: nextRetry.toISOString(),
            attempts: job.retries + 1,
          })
          .eq('id', jobId);

        // Log retry schedule
        await this.logJobEvent(jobId, 'info', `Retry scheduled in ${Math.round(delay / 1000)}s`, {
          attempt: job.retries + 1,
          maxAttempts: policy.maxAttempts,
          reason: retryDecision.reason,
        });
      } else {
        // Move to failed and add to DLQ
        await this.supabase
          .from('job_queue')
          .update({
            status: 'failed',
            error: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        // Add to dead letter queue
        await this.addToDLQ(job, errorMessage);

        // Send alert for permanent failure
        await this.alertManager.alertJobFailed(
          jobId,
          job.type,
          errorMessage,
          job.retries
        );
      }
    } else {
      const existingJob = this.jobs.get(jobId);
      if (existingJob) {
        existingJob.error = errorMessage;
        if (willRetry) {
          const delay = calculateRetryDelay(policy, existingJob.retries + 1);
          existingJob.status = 'scheduled';
          existingJob.scheduledFor = new Date(Date.now() + delay).toISOString();
        } else {
          existingJob.status = 'failed';
          existingJob.completedAt = new Date().toISOString();

          // Send alert for permanent failure
          await this.alertManager.alertJobFailed(
            jobId,
            existingJob.type,
            errorMessage,
            existingJob.retries
          );
        }
        this.saveToDisk();
      }
    }
  }

  /**
   * Add a failed job to the dead letter queue
   */
  private async addToDLQ(job: Job, error: string): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase.from('dead_letter_queue').insert({
        original_job_id: job.id,
        job_type: job.type,
        job_data: job.data,
        error,
        attempts: job.retries,
      });

      // Log DLQ addition
      await this.logJobEvent(job.id, 'error', 'Job moved to dead letter queue', {
        error,
        attempts: job.retries,
      });

      // Check DLQ threshold for alerting
      const { count } = await this.supabase
        .from('dead_letter_queue')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null);

      const dlqCount = count || 0;
      const thresholds = this.alertManager.getThresholds();
      if (dlqCount >= thresholds.dlqThreshold) {
        await this.alertManager.alertDLQThreshold(dlqCount);
      }
    } catch (err: any) {
      logger.error('Failed to add job to DLQ', {
        jobId: job.id,
        error: err.message,
      });
    }
  }

  /**
   * Log a job event to the job_logs table
   */
  private async logJobEvent(
    jobId: string,
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase.from('job_logs').insert({
        job_id: jobId,
        level,
        message,
        data,
      });
    } catch (err: any) {
      // Don't fail the job if logging fails
      logger.debug('Failed to log job event', { jobId, error: err.message });
    }
  }

  async processAll(): Promise<{ completed: number; failed: number }> {
    let completed = 0;
    let failed = 0;

    while (true) {
      const pendingCount = this.getPendingJobs().length;
      if (pendingCount === 0 && this.processing.size === 0) {
        break;
      }

      const job = await this.processNext();
      if (!job) {
        // Either rate limited or at max concurrent - wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      if (job.status === 'completed') {
        completed++;
      } else if (job.status === 'failed') {
        failed++;
      }
    }

    return { completed, failed };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('Job queue started');

    // Start cleanup interval (every hour)
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60 * 60 * 1000);

    // Start monitoring interval (every 5 minutes)
    this.monitorInterval = setInterval(() => {
      this.runMonitoringChecks();
    }, MONITORING_INTERVAL_MS);

    // Run initial checks
    this.cleanupCompletedJobs();
    this.runMonitoringChecks();

    const tick = async () => {
      if (!this.isRunning) return;

      try {
        await this.processNext();
      } catch (err) {
        logger.error('Queue tick error', { error: (err as Error).message });
      }

      // Continue processing
      setTimeout(tick, 500);
    };

    tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    logger.info('Job queue stopped');
  }

  /**
   * Clean up completed/failed jobs older than maxAge to prevent memory leaks
   */
  private cleanupCompletedJobs(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        const completedAt = job.completedAt
          ? new Date(job.completedAt).getTime()
          : new Date(job.createdAt).getTime();

        if (now - completedAt > maxAge) {
          this.jobs.delete(id);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old jobs from queue`);
      this.saveToDisk();
    }
  }

  /**
   * Execute a job handler with timeout protection
   */
  private async executeWithTimeout(
    handler: (job: Job) => Promise<any>,
    job: Job,
    timeoutMs: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Job execution timeout after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      handler(job)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  /**
   * Run monitoring checks for stuck jobs, DLQ size, and queue health
   */
  private async runMonitoringChecks(): Promise<void> {
    try {
      // Check for stuck jobs
      await this.checkStuckJobs();

      // Check DLQ size
      await this.checkDLQSize();

      // Check queue backlog
      await this.checkQueueBacklog();

      // Log queue metrics
      this.logQueueMetrics();
    } catch (err: any) {
      logger.error('Monitoring check error', { error: err.message });
    }
  }

  /**
   * Check for stuck jobs (running too long)
   */
  private async checkStuckJobs(): Promise<void> {
    const now = Date.now();

    if (this.supabase && this.config.useDatabase) {
      // Check database for stuck jobs
      const stuckThreshold = new Date(now - STUCK_JOB_THRESHOLD_MS).toISOString();
      const { data: stuckJobs } = await this.supabase
        .from('job_queue')
        .select('id, type, started_at')
        .eq('status', 'running')
        .lt('started_at', stuckThreshold);

      if (stuckJobs && stuckJobs.length > 0) {
        for (const job of stuckJobs) {
          const runningFor = now - new Date(job.started_at).getTime();
          await this.alertManager.alertJobStuck(job.id, job.type, runningFor);

          // Auto-recover: reset stuck jobs to pending for retry
          await this.supabase
            .from('job_queue')
            .update({
              status: 'pending',
              error: 'Job was stuck and has been reset for retry',
              attempts: this.supabase.rpc ? undefined : 0, // Will let regular retry handle it
            })
            .eq('id', job.id);

          logger.warn(`Reset stuck job: ${job.type}`, { jobId: job.id.slice(0, 8) });
        }
      }
    } else {
      // Check in-memory jobs
      for (const job of this.jobs.values()) {
        if (job.status === 'running' && job.startedAt) {
          const runningFor = now - new Date(job.startedAt).getTime();
          if (runningFor > STUCK_JOB_THRESHOLD_MS) {
            await this.alertManager.alertJobStuck(job.id, job.type, runningFor);

            // Reset stuck job for retry
            job.status = 'pending';
            job.error = 'Job was stuck and has been reset for retry';
            this.processing.delete(job.id);

            logger.warn(`Reset stuck job: ${job.type}`, { jobId: job.id.slice(0, 8) });
          }
        }
      }
    }
  }

  /**
   * Check DLQ size and alert if above threshold
   */
  private async checkDLQSize(): Promise<void> {
    if (!this.supabase || !this.config.useDatabase) return;

    const { count } = await this.supabase
      .from('dead_letter_queue')
      .select('*', { count: 'exact', head: true })
      .is('resolved_at', null);

    const dlqCount = count || 0;
    const threshold = this.alertManager.getThresholds().dlqThreshold;

    if (dlqCount >= threshold) {
      await this.alertManager.alertDLQThreshold(dlqCount);
    }
  }

  /**
   * Check queue backlog and alert if too large
   */
  private async checkQueueBacklog(): Promise<void> {
    let pendingCount = 0;
    let byType: Record<string, number> = {};

    if (this.supabase && this.config.useDatabase) {
      const { data } = await this.supabase
        .from('job_queue')
        .select('type')
        .in('status', ['pending', 'scheduled']);

      if (data) {
        pendingCount = data.length;
        for (const job of data) {
          byType[job.type] = (byType[job.type] || 0) + 1;
        }
      }
    } else {
      const stats = this.getStats();
      pendingCount = stats.byStatus.pending + stats.byStatus.scheduled;
      byType = stats.byType;
    }

    const thresholds = this.alertManager.getThresholds();
    if (pendingCount >= thresholds.queueBacklogWarning) {
      await this.alertManager.alertQueueBacklog(pendingCount, byType);
    }
  }

  /**
   * Log queue metrics for observability
   */
  private logQueueMetrics(): void {
    const stats = this.getStats();
    const memUsage = process.memoryUsage();

    logger.info('Queue metrics', {
      total: stats.total,
      pending: stats.byStatus.pending,
      running: stats.byStatus.running,
      failed: stats.byStatus.failed,
      completed: stats.byStatus.completed,
      scheduled: stats.byStatus.scheduled,
      processingCount: this.processing.size,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    });

    // Check memory usage and alert if high
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsedPercent > 85) {
      this.alertManager.sendAlert(
        'worker_unhealthy',
        heapUsedPercent > 95 ? 'critical' : 'warning',
        'High Memory Usage',
        `Worker heap usage at ${heapUsedPercent.toFixed(1)}%`,
        {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsedPercent: heapUsedPercent.toFixed(1),
        }
      );
    }
  }

  async clear(status?: JobStatus): Promise<number> {
    if (this.supabase && this.config.useDatabase) {
      let query = this.supabase.from('job_queue').delete();
      if (status) {
        query = query.eq('status', status);
      }
      const { count } = await query;
      return count || 0;
    }

    let cleared = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (!status || job.status === status) {
        this.jobs.delete(id);
        cleared++;
      }
    }
    this.saveToDisk();
    return cleared;
  }

  getStats(): {
    total: number;
    byStatus: Record<JobStatus, number>;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.jobs.size,
      byStatus: {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        scheduled: 0,
        cancelled: 0,
      } as Record<JobStatus, number>,
      byType: {} as Record<string, number>
    };

    for (const job of this.jobs.values()) {
      stats.byStatus[job.status]++;
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    }

    return stats;
  }

  private dbRowToJob(row: any): Job {
    return {
      id: row.id,
      type: row.type as JobType,
      data: row.data,
      status: row.status as JobStatus,
      priority: row.priority,
      createdAt: row.created_at,
      scheduledFor: row.scheduled_for,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      error: row.error,
      result: row.result,
      retries: row.attempts || 0,
      maxRetries: row.max_attempts || 3,
    };
  }

  private canProcessNow(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps
    this.lastProcessedTimes = this.lastProcessedTimes.filter(t => t > oneMinuteAgo);

    return this.lastProcessedTimes.length < this.config.rateLimitPerMinute;
  }

  private recordProcessTime(): void {
    this.lastProcessedTimes.push(Date.now());
  }

  private generateId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private saveToDisk(): void {
    if (this.config.useDatabase || !this.config.persistPath) return;

    try {
      const dir = path.dirname(this.config.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = JSON.stringify(Array.from(this.jobs.entries()), null, 2);
      fs.writeFileSync(this.config.persistPath, data);
    } catch (err) {
      // Ignore save errors
    }
  }

  private loadFromDisk(): void {
    if (!this.config.persistPath || !fs.existsSync(this.config.persistPath)) {
      return;
    }

    try {
      const data = fs.readFileSync(this.config.persistPath, 'utf-8');
      const entries = JSON.parse(data) as [string, Job][];
      this.jobs = new Map(entries);

      // Reset running jobs to pending (in case of crash)
      for (const job of this.jobs.values()) {
        if (job.status === 'running') {
          job.status = 'pending';
        }
      }

      logger.info(`Loaded ${this.jobs.size} jobs from disk`);
    } catch (err) {
      // Ignore load errors
    }
  }
}

// Singleton instance
let queueInstance: JobQueue | null = null;

export function getQueue(config?: Partial<QueueConfig>): JobQueue {
  if (!queueInstance) {
    queueInstance = new JobQueue(config);
  }
  return queueInstance;
}

// CLI entry point
if (require.main === module) {
  const action = process.argv[2] || 'stats';
  const queue = getQueue();

  switch (action) {
    case 'stats':
      const stats = queue.getStats();
      console.log('\n📊 Queue Stats:\n');
      console.log(`  Total: ${stats.total}`);
      console.log('\n  By Status:');
      for (const [status, count] of Object.entries(stats.byStatus)) {
        if (count > 0) console.log(`    ${status}: ${count}`);
      }
      console.log('\n  By Type:');
      for (const [type, count] of Object.entries(stats.byType)) {
        console.log(`    ${type}: ${count}`);
      }
      break;

    case 'clear':
      const status = process.argv[3] as JobStatus | undefined;
      queue.clear(status).then(cleared => {
        console.log(`🗑️ Cleared ${cleared} jobs`);
      });
      break;

    case 'pending':
      const pending = queue.getPendingJobs();
      console.log(`\n📋 Pending Jobs (${pending.length}):\n`);
      for (const job of pending.slice(0, 20)) {
        console.log(`  ${job.id.slice(0, 8)} | ${job.type.padEnd(10)} | pri:${job.priority}`);
      }
      break;

    default:
      console.log('Usage: npx tsx src/scheduler/queue.ts [stats|clear|pending]');
  }
}
