/**
 * Overnight Scheduler
 *
 * Manages cron scheduling for the overnight runner.
 * Uses node-cron for reliable scheduling.
 */

import * as cron from 'node-cron';
import AsyncLock from 'async-lock';
import { OvernightConfig, OvernightEvent, OvernightEventCallback } from './types';
import { loadOvernightConfig, isWithinRunHours, getQuotas, configSummary } from './config';
import { OvernightRunner } from './runner';
import { acquireOvernightLock, releaseOvernightLock } from './lock';
import { logger } from '../utils/logger';

export interface SchedulerOptions {
  /** Cron expression for when to start (default: "0 22 * * *" = 10 PM daily) */
  cronExpression?: string;
  /** Override config */
  config?: Partial<OvernightConfig>;
  /** Event callback */
  onEvent?: OvernightEventCallback;
  /** Run immediately on start (for testing) */
  runImmediately?: boolean;
}

export class OvernightScheduler {
  private config: OvernightConfig;
  private cronTask: cron.ScheduledTask | null = null;
  private runner: OvernightRunner | null = null;
  private isRunning = false;
  private cronExpression: string;
  private onEvent?: OvernightEventCallback;
  private lastRunId: string | null = null;
  private lockOwner: string | null = null;
  private localLock = new AsyncLock();

  constructor(options: SchedulerOptions = {}) {
    this.config = loadOvernightConfig(options.config);
    this.cronExpression = options.cronExpression || '0 22 * * *'; // 10 PM daily
    this.onEvent = options.onEvent;

    if (options.runImmediately) {
      this.runNow();
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.cronTask) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info('Starting overnight scheduler', {
      cron: this.cronExpression,
      config: {
        industries: this.config.industries,
        locations: this.config.locations,
        maxLeads: this.config.maxLeads,
      },
    });

    this.cronTask = cron.schedule(this.cronExpression, async () => {
      await this.runCycle();
    });

    console.log(`\n⏰ Overnight scheduler started`);
    console.log(`   Cron: ${this.cronExpression}`);
    console.log(`   Next run: ${this.getNextRunTime()}`);
    console.log(`\n   Configuration:`);
    console.log(configSummary(this.config).split('\n').map(l => `   ${l}`).join('\n'));
    console.log('');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('Overnight scheduler stopped');
    }

    if (this.runner) {
      this.runner.cancel();
      this.runner = null;
    }
  }

  /**
   * Run a cycle immediately (for testing or manual trigger)
   */
  async runNow(configOverrides?: Partial<OvernightConfig>): Promise<string> {
    const config = configOverrides
      ? { ...this.config, ...configOverrides }
      : this.config;

    return this.runCycle(config);
  }

  /**
   * Run a single overnight cycle
   */
  private async runCycle(config?: OvernightConfig): Promise<string> {
    // Use local lock to ensure atomic check-then-act before distributed lock
    return this.localLock.acquire('overnight-run', async () => {
      if (this.isRunning) {
        logger.warn('Overnight run already in progress, skipping');
        return this.lastRunId || 'skipped';
      }

      const runConfig = config || this.config;

      // Check if within run hours (unless running immediately)
      if (!isWithinRunHours(runConfig.runHours)) {
        logger.info('Outside run hours, skipping cycle', {
          runHours: runConfig.runHours,
          currentHour: new Date().getHours(),
        });
        return 'skipped-hours';
      }

      // Check quotas
      const quotas = await getQuotas();
      if (quotas.gmail_remaining <= 0) {
        logger.warn('Gmail quota exhausted, skipping cycle', { quotas });
        return 'skipped-quota';
      }

      const lockOwner = await acquireOvernightLock();
      if (!lockOwner) {
        logger.warn('Overnight run already locked by another instance, skipping');
        return this.lastRunId || 'skipped-locked';
      }

      this.lockOwner = lockOwner;
      this.isRunning = true;

      try {
        logger.info('Starting overnight cycle', {
          industries: runConfig.industries,
          locations: runConfig.locations,
          maxLeads: runConfig.maxLeads,
        });

        this.runner = new OvernightRunner(runConfig, this.onEvent);
        const result = await this.runner.execute();
        this.lastRunId = result.id;

        logger.info('Overnight cycle completed', {
          runId: result.id,
          status: result.status,
          stats: result.stats,
        });

        return result.id;
      } catch (error: any) {
        logger.error('Overnight cycle failed', { error: error.message });
        throw error;
      } finally {
        this.isRunning = false;
        this.runner = null;
        if (this.lockOwner) {
          await releaseOvernightLock(this.lockOwner);
          this.lockOwner = null;
        }
      }
    });
  }

  /**
   * Get the status of the scheduler
   */
  getStatus(): {
    isScheduled: boolean;
    isRunning: boolean;
    cronExpression: string;
    nextRunTime: string | null;
    lastRunId: string | null;
    config: OvernightConfig;
  } {
    return {
      isScheduled: this.cronTask !== null,
      isRunning: this.isRunning,
      cronExpression: this.cronExpression,
      nextRunTime: this.getNextRunTime(),
      lastRunId: this.lastRunId,
      config: this.config,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OvernightConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Overnight config updated', { config: this.config });
  }

  /**
   * Get the next scheduled run time
   */
  private getNextRunTime(): string | null {
    if (!this.cronTask) return null;

    try {
      // Parse cron expression to get next run
      const interval = cron.validate(this.cronExpression);
      if (!interval) return null;

      // Simple next run calculation based on cron expression
      const now = new Date();
      const [minute, hour] = this.cronExpression.split(' ');

      const nextRun = new Date();
      nextRun.setHours(parseInt(hour, 10) || 0);
      nextRun.setMinutes(parseInt(minute, 10) || 0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);

      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return nextRun.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Cancel the current run (if running)
   */
  cancelCurrentRun(): void {
    if (this.runner) {
      this.runner.cancel();
      logger.info('Current overnight run cancelled');
    }
  }
}

// Singleton instance
let schedulerInstance: OvernightScheduler | null = null;

/**
 * Get the scheduler singleton
 */
export function getOvernightScheduler(options?: SchedulerOptions): OvernightScheduler {
  if (!schedulerInstance || options) {
    schedulerInstance = new OvernightScheduler(options);
  }
  return schedulerInstance;
}

/**
 * Start the overnight scheduler
 */
export function startOvernightScheduler(options?: SchedulerOptions): OvernightScheduler {
  const scheduler = getOvernightScheduler(options);
  scheduler.start();
  return scheduler;
}

/**
 * Stop the overnight scheduler
 */
export function stopOvernightScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
