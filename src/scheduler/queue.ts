import * as fs from 'fs';
import * as path from 'path';

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
  retries: number;
  maxRetries: number;
}

export type JobType = 'discover' | 'capture' | 'generate' | 'deploy' | 'email' | 'followup' | 'score';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface QueueConfig {
  maxConcurrent: number;
  rateLimitPerMinute: number;
  retryDelayMs: number;
  persistPath?: string;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 2,
  rateLimitPerMinute: 30,
  retryDelayMs: 5000,
  persistPath: 'tmp/autowebsites/queue.json'
};

export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processing: Set<string> = new Set();
  private handlers: Map<JobType, (job: Job) => Promise<any>> = new Map();
  private config: QueueConfig;
  private lastProcessedTimes: number[] = [];
  private isRunning = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromDisk();
  }

  registerHandler(type: JobType, handler: (job: Job) => Promise<any>): void {
    this.handlers.set(type, handler);
  }

  addJob(type: JobType, data: any, options?: {
    priority?: number;
    scheduledFor?: string;
    maxRetries?: number;
  }): Job {
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

    this.jobs.set(job.id, job);
    this.saveToDisk();

    console.log(`📥 Job added: ${job.type} (${job.id.slice(0, 8)})`);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getJobsByStatus(status: JobStatus): Job[] {
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

    // Get next pending job
    const pendingJobs = this.getPendingJobs();
    const job = pendingJobs.find(j => !this.processing.has(j.id));

    if (!job) {
      return null;
    }

    // Get handler
    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`No handler registered for job type: ${job.type}`);
      job.status = 'failed';
      job.error = 'No handler registered';
      this.saveToDisk();
      return job;
    }

    // Mark as running
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.processing.add(job.id);
    this.recordProcessTime();
    this.saveToDisk();

    console.log(`⚙️ Processing: ${job.type} (${job.id.slice(0, 8)})`);

    try {
      await handler(job);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      console.log(`✅ Completed: ${job.type} (${job.id.slice(0, 8)})`);
    } catch (err: any) {
      job.error = err.message;
      job.retries++;

      if (job.retries < job.maxRetries) {
        job.status = 'scheduled';
        job.scheduledFor = new Date(Date.now() + this.config.retryDelayMs * job.retries).toISOString();
        console.log(`⚠️ Retry scheduled: ${job.type} (${job.id.slice(0, 8)}) - attempt ${job.retries}/${job.maxRetries}`);
      } else {
        job.status = 'failed';
        console.log(`❌ Failed: ${job.type} (${job.id.slice(0, 8)}) - ${err.message}`);
      }
    } finally {
      this.processing.delete(job.id);
      this.saveToDisk();
    }

    return job;
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

    console.log('🚀 Queue started');

    const tick = async () => {
      if (!this.isRunning) return;

      try {
        await this.processNext();
      } catch (err) {
        console.error('Queue tick error:', err);
      }

      // Continue processing
      setTimeout(tick, 500);
    };

    tick();
  }

  stop(): void {
    this.isRunning = false;
    console.log('⏹️ Queue stopped');
  }

  clear(status?: JobStatus): number {
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
        scheduled: 0
      } as Record<JobStatus, number>,
      byType: {} as Record<string, number>
    };

    for (const job of this.jobs.values()) {
      stats.byStatus[job.status]++;
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    }

    return stats;
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
    if (!this.config.persistPath) return;

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

      console.log(`📂 Loaded ${this.jobs.size} jobs from disk`);
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
      const cleared = queue.clear(status);
      console.log(`🗑️ Cleared ${cleared} jobs`);
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
