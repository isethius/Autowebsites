import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, requireRole } from '../auth';
import { LeadModel, LeadFilter } from '../../crm/lead-model';
import { PipelineManager } from '../../crm/pipeline-manager';
import { ActivityLogger } from '../../crm/activity-logger';
import { validateBody, validateQuery, createLeadSchema, updateLeadSchema, paginationSchema, uuidSchema } from '../../utils/validation';
import { AppError, NotFoundError, ValidationError, asyncHandler } from '../../utils/error-handler';

// Query schemas
const listLeadsQuerySchema = paginationSchema.extend({
  stage: z.enum(['new', 'qualified', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost']).optional(),
  industry: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().max(200).optional(),
  min_score: z.coerce.number().min(0).max(10).optional(),
  max_score: z.coerce.number().min(0).max(10).optional(),
  has_email: z.enum(['true', 'false']).optional(),
});

const stageChangeSchema = z.object({
  stage: z.enum(['new', 'qualified', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost']),
  reason: z.string().max(500).optional(),
});

const wonSchema = z.object({
  value: z.number().positive(),
  notes: z.string().max(1000).optional(),
});

const lostSchema = z.object({
  reason: z.string().max(500),
});

const noteSchema = z.object({
  note: z.string().min(1).max(5000),
});

const tagSchema = z.object({
  tag: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-_]+$/, 'Tag must contain only alphanumeric characters, hyphens, and underscores'),
});

const bulkStageSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
  stage: z.enum(['new', 'qualified', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost']),
});

const bulkTagSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
  tag: z.string().min(1).max(50),
});

export function createLeadsRouter(): Router {
  const router = Router();
  const leadModel = new LeadModel();
  const pipelineManager = new PipelineManager(leadModel);
  const activityLogger = new ActivityLogger();
  const adminOnly = requireRole('admin');

  // List leads
  router.get('/', validateQuery(listLeadsQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 50,
      stage,
      industry,
      priority,
      search,
      min_score,
      max_score,
      has_email,
      sort = 'created_at',
      order = 'desc',
    } = req.query as z.infer<typeof listLeadsQuerySchema>;

    const filter: LeadFilter = {};

    if (stage) filter.pipeline_stage = stage;
    if (industry) filter.industry = industry as any;
    if (priority) filter.priority = priority;
    if (search) filter.search = search;
    if (min_score !== undefined) filter.min_website_score = min_score;
    if (max_score !== undefined) filter.max_website_score = max_score;
    if (has_email === 'true') filter.has_email = true;
    if (has_email === 'false') filter.has_email = false;

    const { leads, total } = await leadModel.list(filter, {
      limit,
      offset: (page - 1) * limit,
      orderBy: sort,
      ascending: order === 'asc',
    });

    res.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }));

  // Get lead stats
  router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await leadModel.getStats();
    res.json(stats);
  }));

  // Get pipeline summary
  router.get('/pipeline', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const summary = await pipelineManager.getPipelineSummary();
    res.json(summary);
  }));

  // Get stale leads
  router.get('/stale', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const staleLeads = await pipelineManager.getStaleLeads();
    res.json(staleLeads);
  }));

  // Get single lead
  router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    // Validate UUID format
    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const lead = await leadModel.getById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Get activity timeline
    const timeline = await activityLogger.getTimeline(lead.id, { limit: 20 });

    res.json({ lead, timeline });
  }));

  // Create lead
  router.post('/', adminOnly, validateBody(createLeadSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const lead = await leadModel.create(req.body);

    // Log activity
    await activityLogger.log({
      lead_id: lead.id,
      type: 'custom',
      title: 'Lead created',
      user_id: req.user?.id,
    });

    res.status(201).json(lead);
  }));

  // Update lead
  router.patch('/:id', adminOnly, validateBody(updateLeadSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const existingLead = await leadModel.getById(leadId);
    if (!existingLead) {
      throw new NotFoundError('Lead');
    }

    const lead = await leadModel.update(leadId, req.body);
    res.json(lead);
  }));

  // Change pipeline stage
  router.post('/:id/stage', adminOnly, validateBody(stageChangeSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const { stage, reason } = req.body;
    const lead = await pipelineManager.moveToStage(leadId, stage, {
      reason,
      userId: req.user?.id,
    });
    res.json(lead);
  }));

  // Mark as won
  router.post('/:id/won', adminOnly, validateBody(wonSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const { value, notes } = req.body;
    const lead = await pipelineManager.closeWon(leadId, value, notes);
    res.json(lead);
  }));

  // Mark as lost
  router.post('/:id/lost', adminOnly, validateBody(lostSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const { reason } = req.body;
    const lead = await pipelineManager.closeLost(leadId, reason);
    res.json(lead);
  }));

  // Add note
  router.post('/:id/notes', adminOnly, validateBody(noteSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const { note } = req.body;
    await activityLogger.logNote(leadId, note, req.user?.id);

    // Also update lead notes field
    const lead = await leadModel.getById(leadId);
    if (lead) {
      const existingNotes = lead.notes || '';
      const timestamp = new Date().toISOString().split('T')[0];
      const newNotes = `${existingNotes}\n\n[${timestamp}] ${note}`.trim();
      await leadModel.update(leadId, { notes: newNotes });
    }

    res.json({ success: true });
  }));

  // Add tag
  router.post('/:id/tags', adminOnly, validateBody(tagSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const { tag } = req.body;
    await leadModel.addTag(leadId, tag);
    const lead = await leadModel.getById(leadId);
    res.json({ tags: lead?.tags || [] });
  }));

  // Remove tag
  router.delete('/:id/tags/:tag', adminOnly, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;
    const tag = req.params.tag;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    if (!tag || tag.length > 50) {
      throw new ValidationError('Invalid tag');
    }

    await leadModel.removeTag(leadId, tag);
    const lead = await leadModel.getById(leadId);
    res.json({ tags: lead?.tags || [] });
  }));

  // Bulk update stage
  router.post('/bulk/stage', adminOnly, validateBody(bulkStageSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { ids, stage } = req.body;
    await leadModel.bulkUpdateStage(ids, stage);
    res.json({ success: true, updated: ids.length });
  }));

  // Bulk add tag
  router.post('/bulk/tag', adminOnly, validateBody(bulkTagSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { ids, tag } = req.body;
    await leadModel.bulkAddTag(ids, tag);
    res.json({ success: true, updated: ids.length });
  }));

  // Delete lead
  router.delete('/:id', adminOnly, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;

    if (!uuidSchema.safeParse(leadId).success) {
      throw new ValidationError('Invalid lead ID format');
    }

    const existingLead = await leadModel.getById(leadId);
    if (!existingLead) {
      throw new NotFoundError('Lead');
    }

    await leadModel.delete(leadId);
    res.json({ success: true });
  }));

  return router;
}
