/**
 * Overnight Runs API Routes
 *
 * Dashboard endpoints for viewing and managing overnight outreach runs.
 */

import { Router, Request, Response } from 'express';
import { requireRole } from '../auth';
import { getSupabaseClient } from '../../utils/supabase';
import { loadOvernightConfig, getQuotas } from '../../overnight/config';
import { acquireOvernightLock, releaseOvernightLock } from '../../overnight/lock';
import { OvernightRunner } from '../../overnight/runner';
import { logger } from '../../utils/logger';

export function createOvernightRouter(): Router {
  const router = Router();
  const supabase = getSupabaseClient();
  const adminOnly = requireRole('admin');

  /**
   * GET /api/overnight/runs - List overnight runs
   */
  router.get('/runs', async (req: Request, res: Response) => {
    try {
      const { limit = '20', offset = '0', status } = req.query;

      let query = supabase
        .from('overnight_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string, 10))
        .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: runs, error, count } = await query;

      if (error) throw error;

      res.json({
        runs: runs || [],
        total: count || runs?.length || 0,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
    } catch (error: any) {
      logger.error('Error fetching overnight runs', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch overnight runs' }
      });
    }
  });

  /**
   * GET /api/overnight/runs/:id - Get single overnight run details
   */
  router.get('/runs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data: run, error } = await supabase
        .from('overnight_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Overnight run not found' }
          });
        }
        throw error;
      }

      // Get leads associated with this run
      const { data: leads } = await supabase
        .from('leads')
        .select('id, business_name, email, website_url, pipeline_stage, gallery_url, created_at')
        .eq('overnight_run_id', id)
        .order('created_at', { ascending: false })
        .limit(100);

      res.json({
        ...run,
        leads: leads || [],
      });
    } catch (error: any) {
      logger.error('Error fetching overnight run', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch overnight run' }
      });
    }
  });

  /**
   * GET /api/overnight/stats - Get overnight run statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const { days = '7' } = req.query;
      const daysBack = parseInt(days as string, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get runs from the period
      const { data: runs, error } = await supabase
        .from('overnight_runs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalRuns = runs?.length || 0;
      const completedRuns = runs?.filter(r => r.status === 'completed').length || 0;
      const failedRuns = runs?.filter(r => r.status === 'failed').length || 0;

      let totalLeadsDiscovered = 0;
      let totalEmailsSent = 0;
      let totalPreviewsGenerated = 0;

      for (const run of runs || []) {
        const stats = run.stats as any;
        totalLeadsDiscovered += stats?.leads_discovered || 0;
        totalEmailsSent += stats?.emails_sent || 0;
        totalPreviewsGenerated += stats?.previews_generated || 0;
      }

      // Calculate success rate
      const avgSuccessRate = totalLeadsDiscovered > 0
        ? ((totalEmailsSent / totalLeadsDiscovered) * 100).toFixed(1)
        : '0';

      res.json({
        period: { days: daysBack, startDate: startDate.toISOString() },
        runs: {
          total: totalRuns,
          completed: completedRuns,
          failed: failedRuns,
          successRate: totalRuns > 0 ? ((completedRuns / totalRuns) * 100).toFixed(1) : '0',
        },
        totals: {
          leadsDiscovered: totalLeadsDiscovered,
          previewsGenerated: totalPreviewsGenerated,
          emailsSent: totalEmailsSent,
        },
        averages: {
          leadsPerRun: totalRuns > 0 ? (totalLeadsDiscovered / totalRuns).toFixed(1) : '0',
          emailsPerRun: totalRuns > 0 ? (totalEmailsSent / totalRuns).toFixed(1) : '0',
          emailSuccessRate: avgSuccessRate,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching overnight stats', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch overnight stats' }
      });
    }
  });

  /**
   * GET /api/overnight/config - Get current overnight configuration
   */
  router.get('/config', async (req: Request, res: Response) => {
    try {
      const config = loadOvernightConfig();
      res.json(config);
    } catch (error: any) {
      logger.error('Error fetching overnight config', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch config' }
      });
    }
  });

  /**
   * GET /api/overnight/quotas - Get current quotas
   */
  router.get('/quotas', async (req: Request, res: Response) => {
    try {
      const quotas = await getQuotas();
      res.json(quotas);
    } catch (error: any) {
      logger.error('Error fetching quotas', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch quotas' }
      });
    }
  });

  /**
   * POST /api/overnight/trigger - Manually trigger an overnight run
   */
  router.post('/trigger', adminOnly, async (req: Request, res: Response) => {
    try {
      const { industries, locations, maxLeads, dryRun } = req.body;

      // Load base config with overrides
      const baseConfig = loadOvernightConfig();
      const config = {
        ...baseConfig,
        ...(industries && { industries }),
        ...(locations && { locations }),
        ...(maxLeads && { maxLeads }),
        sendEmails: !dryRun,
      };

      const lockOwner = await acquireOvernightLock();
      if (!lockOwner) {
        return res.status(409).json({
          error: { code: 'LOCKED', message: 'Overnight run already in progress' }
        });
      }

      // Create and run
      const runner = new OvernightRunner(config);

      // Start the run asynchronously (don't wait for completion)
      runner.execute().then((result) => {
        logger.info('Manual overnight run completed', {
          runId: result.id,
          status: result.status,
          stats: result.stats,
        });
      }).catch((error) => {
        logger.error('Manual overnight run failed', { error: error.message });
      }).finally(() => {
        releaseOvernightLock(lockOwner).catch(() => {
          // Best effort lock release
        });
      });

      res.json({
        message: 'Overnight run started',
        config: {
          industries: config.industries,
          locations: config.locations,
          maxLeads: config.maxLeads,
          dryRun: !!dryRun,
        },
      });
    } catch (error: any) {
      logger.error('Error triggering overnight run', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to trigger overnight run' }
      });
    }
  });

  /**
   * GET /api/overnight/leads - Get leads from overnight runs
   */
  router.get('/leads', async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0', run_id } = req.query;

      let query = supabase
        .from('leads')
        .select(`
          id, business_name, email, website_url, phone,
          city, state, industry, pipeline_stage,
          gallery_url, website_score, discovery_source,
          overnight_run_id, created_at
        `)
        .not('overnight_run_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string, 10))
        .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

      if (run_id) {
        query = query.eq('overnight_run_id', run_id);
      }

      const { data: leads, error, count } = await query;

      if (error) throw error;

      res.json({
        leads: leads || [],
        total: count || leads?.length || 0,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
    } catch (error: any) {
      logger.error('Error fetching overnight leads', { error: error.message });
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch leads' }
      });
    }
  });

  return router;
}
