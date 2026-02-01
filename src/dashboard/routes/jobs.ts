import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth';
import { getQueue, Job, JobStatus, JobType } from '../../scheduler/queue';
import { getSupabaseServiceClient } from '../../utils/supabase';
import { uuidSchema } from '../../utils/validation';
import { asyncHandler, ValidationError, NotFoundError } from '../../utils/error-handler';

// Validation schemas
const jobQuerySchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'scheduled', 'cancelled']).optional(),
  type: z.enum(['discover', 'capture', 'generate', 'deploy', 'email', 'followup', 'score']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const bulkActionSchema = z.object({
  job_ids: z.array(z.string()).min(1).max(100),
  action: z.enum(['cancel', 'retry']),
});

const jobLogSchema = z.object({
  level: z.enum(['info', 'warn', 'error']),
  message: z.string().max(1000),
  data: z.record(z.any()).optional(),
});

export function createJobsRouter(): Router {
  const router = Router();
  const queue = getQueue();

  // Initialize Supabase client if configured
  let supabase: ReturnType<typeof getSupabaseServiceClient> | null = null;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    // Supabase not configured, jobs will use in-memory queue
  }

  // GET /api/jobs - List jobs with filters
  router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = jobQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters');
    }

    const { status, type, page, limit, sortBy, sortOrder } = parsed.data;

    if (supabase) {
      // Database-backed job listing
      let query = supabase
        .from('job_queue')
        .select('*', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);

      // Map sortBy to database columns
      const dbSortColumn = {
        createdAt: 'created_at',
        priority: 'priority',
        status: 'status',
        type: 'type',
      }[sortBy];

      query = query
        .order(dbSortColumn, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        jobs: (data || []).map(dbRowToJob),
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } else {
      // In-memory job listing
      let jobs = Array.from(queue['jobs'].values()) as Job[];

      // Apply filters
      if (status) jobs = jobs.filter(j => j.status === status);
      if (type) jobs = jobs.filter(j => j.type === type);

      // Sort
      jobs.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortBy) {
          case 'priority': aVal = a.priority; bVal = b.priority; break;
          case 'status': aVal = a.status; bVal = b.status; break;
          case 'type': aVal = a.type; bVal = b.type; break;
          default: aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime();
        }
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      // Paginate
      const total = jobs.length;
      const start = (page - 1) * limit;
      jobs = jobs.slice(start, start + limit);

      res.json({
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  }));

  // GET /api/jobs/stats - Queue statistics
  router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (supabase) {
      // Get stats from database
      const { data, error } = await supabase.rpc('get_queue_stats');

      if (error) {
        // Fallback to manual query if RPC doesn't exist
        const { data: jobs } = await supabase.from('job_queue').select('status, type');

        const stats = {
          total: jobs?.length || 0,
          byStatus: { pending: 0, running: 0, completed: 0, failed: 0, scheduled: 0, cancelled: 0 },
          byType: {} as Record<string, number>,
        };

        for (const job of jobs || []) {
          stats.byStatus[job.status as JobStatus]++;
          stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
        }

        return res.json(stats);
      }

      res.json(data);
    } else {
      res.json(queue.getStats());
    }
  }));

  // GET /api/jobs/:id - Get job details with logs
  router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundError('Job');
    }

    // Get logs if using database
    let logs: any[] = [];
    if (supabase) {
      const { data } = await supabase
        .from('job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      logs = data || [];
    }

    res.json({ job, logs });
  }));

  // POST /api/jobs/:id/retry - Retry a failed job
  router.post('/:id/retry', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundError('Job');
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new ValidationError('Can only retry failed or cancelled jobs');
    }

    if (supabase) {
      // Reset job in database
      const { error } = await supabase
        .from('job_queue')
        .update({
          status: 'pending',
          error: null,
          attempts: 0,
          started_at: null,
          completed_at: null,
          scheduled_for: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      // Log the retry
      await supabase.from('job_logs').insert({
        job_id: jobId,
        level: 'info',
        message: 'Job manually retried',
        data: { retried_by: req.user?.id },
      });
    } else {
      // Update in-memory job
      const jobs = queue['jobs'] as Map<string, Job>;
      const existingJob = jobs.get(jobId);
      if (existingJob) {
        existingJob.status = 'pending';
        existingJob.error = undefined;
        existingJob.retries = 0;
        existingJob.startedAt = undefined;
        existingJob.completedAt = undefined;
        queue['saveToDisk']();
      }
    }

    res.json({ success: true, message: 'Job queued for retry' });
  }));

  // POST /api/jobs/:id/cancel - Cancel a pending/running job
  router.post('/:id/cancel', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundError('Job');
    }

    if (job.status !== 'pending' && job.status !== 'scheduled' && job.status !== 'running') {
      throw new ValidationError('Can only cancel pending, scheduled, or running jobs');
    }

    if (supabase) {
      const { error } = await supabase
        .from('job_queue')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      // Log the cancellation
      await supabase.from('job_logs').insert({
        job_id: jobId,
        level: 'info',
        message: 'Job manually cancelled',
        data: { cancelled_by: req.user?.id },
      });
    } else {
      const jobs = queue['jobs'] as Map<string, Job>;
      const existingJob = jobs.get(jobId);
      if (existingJob) {
        existingJob.status = 'cancelled';
        existingJob.completedAt = new Date().toISOString();
        queue['saveToDisk']();
      }
    }

    res.json({ success: true, message: 'Job cancelled' });
  }));

  // POST /api/jobs/bulk - Bulk operations on jobs
  router.post('/bulk', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = bulkActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body');
    }

    const { job_ids, action } = parsed.data;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const jobId of job_ids) {
      try {
        const job = await queue.getJob(jobId);
        if (!job) {
          results.errors.push(`${jobId}: Job not found`);
          results.failed++;
          continue;
        }

        if (action === 'cancel') {
          if (!['pending', 'scheduled', 'running'].includes(job.status)) {
            results.errors.push(`${jobId}: Cannot cancel ${job.status} job`);
            results.failed++;
            continue;
          }
        } else if (action === 'retry') {
          if (!['failed', 'cancelled'].includes(job.status)) {
            results.errors.push(`${jobId}: Cannot retry ${job.status} job`);
            results.failed++;
            continue;
          }
        }

        if (supabase) {
          const updates = action === 'cancel'
            ? { status: 'cancelled', completed_at: new Date().toISOString() }
            : { status: 'pending', error: null, attempts: 0, started_at: null, completed_at: null };

          await supabase.from('job_queue').update(updates).eq('id', jobId);
        } else {
          const jobs = queue['jobs'] as Map<string, Job>;
          const existingJob = jobs.get(jobId);
          if (existingJob) {
            if (action === 'cancel') {
              existingJob.status = 'cancelled';
              existingJob.completedAt = new Date().toISOString();
            } else {
              existingJob.status = 'pending';
              existingJob.error = undefined;
              existingJob.retries = 0;
              existingJob.startedAt = undefined;
              existingJob.completedAt = undefined;
            }
          }
        }

        results.success++;
      } catch (err: any) {
        results.errors.push(`${jobId}: ${err.message}`);
        results.failed++;
      }
    }

    if (!supabase) {
      queue['saveToDisk']();
    }

    res.json(results);
  }));

  // DELETE /api/jobs/clear - Clear completed/failed jobs
  router.delete('/clear', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = req.query.status as JobStatus | undefined;

    if (status && !['completed', 'failed', 'cancelled'].includes(status)) {
      throw new ValidationError('Can only clear completed, failed, or cancelled jobs');
    }

    let cleared = 0;

    if (supabase) {
      let query = supabase.from('job_queue').delete();

      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.in('status', ['completed', 'failed', 'cancelled']);
      }

      const { count } = await query;
      cleared = count || 0;
    } else {
      if (status) {
        cleared = await queue.clear(status);
      } else {
        cleared = await queue.clear('completed');
        cleared += await queue.clear('failed');
        cleared += await queue.clear('cancelled');
      }
    }

    res.json({ success: true, cleared });
  }));

  // GET /api/jobs/workers - Worker status (placeholder for future)
  router.get('/workers', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Return basic worker info - could be expanded with actual worker tracking
    res.json({
      workers: [
        {
          id: queue['config'].workerId,
          status: queue['isRunning'] ? 'active' : 'idle',
          currentJobs: Array.from(queue['processing']).length,
        },
      ],
    });
  }));

  // POST /api/jobs/:id/logs - Add a log entry to a job
  router.post('/:id/logs', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.params.id;

    const parsed = jobLogSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid log entry');
    }

    if (!supabase) {
      throw new ValidationError('Job logging requires database configuration');
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundError('Job');
    }

    const { level, message, data } = parsed.data;

    await supabase.from('job_logs').insert({
      job_id: jobId,
      level,
      message,
      data,
    });

    res.json({ success: true });
  }));

  // GET /api/jobs/dlq - Get dead letter queue items
  router.get('/dlq', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!supabase) {
      return res.json({ items: [], total: 0 });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const showResolved = req.query.resolved === 'true';

    let query = supabase
      .from('dead_letter_queue')
      .select('*', { count: 'exact' });

    if (!showResolved) {
      query = query.is('resolved_at', null);
    }

    query = query
      .order('failed_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      items: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  }));

  // POST /api/jobs/dlq/:id/resolve - Resolve a DLQ item
  router.post('/dlq/:id/resolve', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!supabase) {
      throw new ValidationError('DLQ requires database configuration');
    }

    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid DLQ item ID');
    }

    const notes = typeof req.body.notes === 'string' ? req.body.notes.slice(0, 1000) : undefined;

    const { error } = await supabase
      .from('dead_letter_queue')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  }));

  // POST /api/jobs/dlq/:id/retry - Retry a DLQ item (create new job)
  router.post('/dlq/:id/retry', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!supabase) {
      throw new ValidationError('DLQ requires database configuration');
    }

    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid DLQ item ID');
    }

    // Get the DLQ item
    const { data: dlqItem, error: fetchError } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !dlqItem) {
      throw new NotFoundError('DLQ item');
    }

    // Create a new job from the DLQ item
    const newJob = await queue.addJob(dlqItem.job_type as JobType, dlqItem.job_data);

    // Mark the DLQ item as resolved
    await supabase
      .from('dead_letter_queue')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: `Retried as job ${newJob.id}`,
      })
      .eq('id', req.params.id);

    res.json({ success: true, newJobId: newJob.id });
  }));

  return router;
}

// Helper to convert database row to Job interface
function dbRowToJob(row: any): Job {
  return {
    id: row.id,
    type: row.type,
    data: row.data,
    status: row.status,
    priority: row.priority || 0,
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
