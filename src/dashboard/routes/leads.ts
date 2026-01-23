import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth';
import { LeadModel, LeadFilter } from '../../crm/lead-model';
import { PipelineManager } from '../../crm/pipeline-manager';
import { ActivityLogger } from '../../crm/activity-logger';

export function createLeadsRouter(): Router {
  const router = Router();
  const leadModel = new LeadModel();
  const pipelineManager = new PipelineManager(leadModel);
  const activityLogger = new ActivityLogger();

  // List leads
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        stage,
        industry,
        priority,
        search,
        min_score,
        max_score,
        has_email,
        sort = 'created_at',
        order = 'desc',
      } = req.query;

      const filter: LeadFilter = {};

      if (stage) filter.pipeline_stage = stage as any;
      if (industry) filter.industry = industry as any;
      if (priority) filter.priority = priority as any;
      if (search) filter.search = search as string;
      if (min_score) filter.min_website_score = parseInt(min_score as string);
      if (max_score) filter.max_website_score = parseInt(max_score as string);
      if (has_email === 'true') filter.has_email = true;
      if (has_email === 'false') filter.has_email = false;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const { leads, total } = await leadModel.list(filter, {
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        orderBy: sort as string,
        ascending: order === 'asc',
      });

      res.json({
        leads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('List leads error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get lead stats
  router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await leadModel.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get pipeline summary
  router.get('/pipeline', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await pipelineManager.getPipelineSummary();
      res.json(summary);
    } catch (error: any) {
      console.error('Get pipeline error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get stale leads
  router.get('/stale', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const staleLeads = await pipelineManager.getStaleLeads();
      res.json(staleLeads);
    } catch (error: any) {
      console.error('Get stale leads error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single lead
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lead = await leadModel.getById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Get activity timeline
      const timeline = await activityLogger.getTimeline(lead.id, { limit: 20 });

      res.json({ lead, timeline });
    } catch (error: any) {
      console.error('Get lead error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create lead
  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lead = await leadModel.create(req.body);

      // Log activity
      await activityLogger.log({
        lead_id: lead.id,
        type: 'custom',
        title: 'Lead created',
        user_id: req.user?.id,
      });

      res.status(201).json(lead);
    } catch (error: any) {
      console.error('Create lead error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update lead
  router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lead = await leadModel.update(req.params.id, req.body);
      res.json(lead);
    } catch (error: any) {
      console.error('Update lead error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Change pipeline stage
  router.post('/:id/stage', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stage, reason } = req.body;
      const lead = await pipelineManager.moveToStage(req.params.id, stage, {
        reason,
        userId: req.user?.id,
      });
      res.json(lead);
    } catch (error: any) {
      console.error('Change stage error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Mark as won
  router.post('/:id/won', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { value, notes } = req.body;
      const lead = await pipelineManager.closeWon(req.params.id, value, notes);
      res.json(lead);
    } catch (error: any) {
      console.error('Mark won error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark as lost
  router.post('/:id/lost', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const lead = await pipelineManager.closeLost(req.params.id, reason);
      res.json(lead);
    } catch (error: any) {
      console.error('Mark lost error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add note
  router.post('/:id/notes', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { note } = req.body;
      await activityLogger.logNote(req.params.id, note, req.user?.id);

      // Also update lead notes field
      const lead = await leadModel.getById(req.params.id);
      if (lead) {
        const existingNotes = lead.notes || '';
        const timestamp = new Date().toISOString().split('T')[0];
        const newNotes = `${existingNotes}\n\n[${timestamp}] ${note}`.trim();
        await leadModel.update(req.params.id, { notes: newNotes });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Add note error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add tag
  router.post('/:id/tags', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tag } = req.body;
      await leadModel.addTag(req.params.id, tag);
      const lead = await leadModel.getById(req.params.id);
      res.json({ tags: lead?.tags || [] });
    } catch (error: any) {
      console.error('Add tag error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove tag
  router.delete('/:id/tags/:tag', async (req: AuthenticatedRequest, res: Response) => {
    try {
      await leadModel.removeTag(req.params.id, req.params.tag);
      const lead = await leadModel.getById(req.params.id);
      res.json({ tags: lead?.tags || [] });
    } catch (error: any) {
      console.error('Remove tag error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk update stage
  router.post('/bulk/stage', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ids, stage } = req.body;
      await leadModel.bulkUpdateStage(ids, stage);
      res.json({ success: true, updated: ids.length });
    } catch (error: any) {
      console.error('Bulk update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk add tag
  router.post('/bulk/tag', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ids, tag } = req.body;
      await leadModel.bulkAddTag(ids, tag);
      res.json({ success: true, updated: ids.length });
    } catch (error: any) {
      console.error('Bulk tag error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete lead
  router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      await leadModel.delete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete lead error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
