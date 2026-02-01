import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth';
import { SequenceEngine, EmailSequence, SequenceStep } from '../../email/sequence-engine';
import { EmailComposer } from '../../email/composer';
import { LeadModel } from '../../crm/lead-model';
import { getSupabaseClient } from '../../utils/supabase';
import { validateBody, createSequenceSchema, uuidSchema, emailSchema } from '../../utils/validation';
import { asyncHandler, ValidationError, NotFoundError } from '../../utils/error-handler';

// Additional schemas for campaigns routes
const updateSequenceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    delay_days: z.number().int().min(0).max(90),
    subject: z.string().min(1).max(200),
    template: z.string(),
    condition: z.enum(['always', 'not_opened', 'not_clicked', 'not_replied', 'opened', 'clicked']).optional(),
    custom_variables: z.record(z.string()).optional(),
  })).min(1).max(10).optional(),
  is_active: z.boolean().optional(),
});

const enrollLeadSchema = z.object({
  lead_id: uuidSchema,
  start_immediately: z.boolean().default(true),
});

const bulkEnrollSchema = z.object({
  lead_ids: z.array(uuidSchema).min(1).max(100),
});

const enrollmentActionSchema = z.object({
  reason: z.string().max(500).optional(),
});

const emailPreviewSchema = z.object({
  template: z.string().min(1),
  variables: z.record(z.string()).default({}),
  subject: z.string().max(200).optional(),
  preheader: z.string().max(150).optional(),
});

const testEmailSchema = z.object({
  to: emailSchema,
  template: z.string().min(1),
  variables: z.record(z.string()).default({}),
  subject: z.string().max(200).optional(),
});

// Visual sequence builder schemas
const visualNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['email', 'delay', 'condition', 'end']),
  x: z.number(),
  y: z.number(),
  data: z.record(z.any()).optional(),
});

const visualConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  condition: z.string().optional(),
  label: z.string().optional(),
});

const visualLayoutSchema = z.object({
  nodes: z.array(visualNodeSchema),
  connections: z.array(visualConnectionSchema),
});

const simulateSequenceSchema = z.object({
  lead_id: uuidSchema.optional(),
  sample_data: z.object({
    business_name: z.string().optional(),
    email: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
});

// Mock send function for now - would integrate with Gmail
const mockSendEmail = async (to: string, subject: string, html: string, text: string) => {
  console.log(`[Mock] Sending email to ${to}: ${subject}`);
  return { messageId: `mock_${Date.now()}` };
};

export function createCampaignsRouter(): Router {
  const router = Router();

  const emailComposer = new EmailComposer({
    senderName: process.env.GMAIL_FROM_NAME || 'AutoWebsites',
    senderCompany: 'AutoWebsites Pro',
  });

  const sequenceEngine = new SequenceEngine({
    emailComposer,
    sendEmail: mockSendEmail,
  });

  const leadModel = new LeadModel();

  const supabase = getSupabaseClient();

  // List sequences
  router.get('/sequences', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sequences = await sequenceEngine.listSequences();
    res.json(sequences);
  }));

  // Get sequence details
  router.get('/sequences/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const sequence = await sequenceEngine.getSequence(req.params.id);
    if (!sequence) {
      throw new NotFoundError('Sequence');
    }

    // Get enrollments
    const { data: enrollments } = await supabase
      .from('sequence_enrollments')
      .select('*, leads(business_name, email)')
      .eq('sequence_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ sequence, enrollments: enrollments || [] });
  }));

  // Create sequence
  router.post('/sequences', validateBody(createSequenceSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, steps } = req.body;
    const sequence = await sequenceEngine.createSequence(name, steps, description);
    res.status(201).json(sequence);
  }));

  // Update sequence
  router.patch('/sequences/:id', validateBody(updateSequenceSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { name, description, steps, is_active } = req.body;

    const { data, error } = await supabase
      .from('email_sequences')
      .update({
        name,
        description,
        steps,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  }));

  // Delete sequence
  router.delete('/sequences/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    // First cancel all enrollments
    await supabase
      .from('sequence_enrollments')
      .update({ status: 'cancelled', stop_reason: 'Sequence deleted' })
      .eq('sequence_id', req.params.id)
      .in('status', ['active', 'paused']);

    // Delete sequence
    const { error } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  }));

  // Enroll lead in sequence
  router.post('/sequences/:id/enroll', validateBody(enrollLeadSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { lead_id, start_immediately } = req.body;

    const enrollment = await sequenceEngine.enrollLead(lead_id, req.params.id, {
      startImmediately: start_immediately,
    });

    res.status(201).json(enrollment);
  }));

  // Bulk enroll leads
  router.post('/sequences/:id/enroll-bulk', validateBody(bulkEnrollSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { lead_ids } = req.body;

    const results = { enrolled: 0, errors: [] as string[] };

    for (const leadId of lead_ids) {
      try {
        await sequenceEngine.enrollLead(leadId, req.params.id);
        results.enrolled++;
      } catch (err: any) {
        results.errors.push(`${leadId}: ${err.message}`);
      }
    }

    res.json(results);
  }));

  // Pause enrollment
  router.post('/enrollments/:id/pause', validateBody(enrollmentActionSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid enrollment ID format');
    }

    const { reason } = req.body;
    await sequenceEngine.pauseEnrollment(req.params.id, reason);
    res.json({ success: true });
  }));

  // Resume enrollment
  router.post('/enrollments/:id/resume', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid enrollment ID format');
    }

    await sequenceEngine.resumeEnrollment(req.params.id);
    res.json({ success: true });
  }));

  // Cancel enrollment
  router.post('/enrollments/:id/cancel', validateBody(enrollmentActionSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid enrollment ID format');
    }

    const { reason } = req.body;
    await sequenceEngine.cancelEnrollment(req.params.id, reason);
    res.json({ success: true });
  }));

  // Get available templates
  router.get('/templates', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const templates = emailComposer.getAvailableTemplates();
    res.json(templates);
  }));

  // Preview email
  router.post('/preview', validateBody(emailPreviewSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { template, variables, subject, preheader } = req.body;

    const composed = emailComposer.composeFromTemplate(
      template,
      variables,
      { subject, preheader }
    );

    res.json(composed);
  }));

  // Send test email
  router.post('/test', validateBody(testEmailSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { to, template, variables, subject } = req.body;

    const composed = emailComposer.composeFromTemplate(
      template,
      variables,
      { subject }
    );

    const result = await mockSendEmail(to, composed.subject, composed.html, composed.text);

    res.json({ success: true, messageId: result.messageId });
  }));

  // Process pending emails (would be called by worker)
  router.post('/process', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sentCount = await sequenceEngine.processNextEmails();
    res.json({ processed: sentCount });
  }));

  // ======== Visual Sequence Builder Endpoints ========

  // GET /api/campaigns/sequences/:id/visual - Get visual layout
  router.get('/sequences/:id/visual', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { data, error } = await supabase
      .from('email_sequences')
      .select('id, name, visual_layout, steps')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Sequence');
    }

    // If no visual layout exists, generate one from steps
    if (!data.visual_layout && data.steps) {
      const generatedLayout = generateVisualLayoutFromSteps(data.steps);
      res.json({
        sequence_id: data.id,
        name: data.name,
        layout: generatedLayout,
        generated: true,
      });
      return;
    }

    res.json({
      sequence_id: data.id,
      name: data.name,
      layout: data.visual_layout || { nodes: [], connections: [] },
      generated: false,
    });
  }));

  // PUT /api/campaigns/sequences/:id/visual - Save visual layout
  router.put('/sequences/:id/visual', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const parsed = visualLayoutSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid visual layout: ' + parsed.error.message);
    }

    const { nodes, connections } = parsed.data;

    // Convert visual layout to sequence steps
    // Type assertion is safe here since Zod has validated the data
    const steps = convertVisualLayoutToSteps(nodes as VisualNode[], connections as VisualConnection[]);

    const { data, error } = await supabase
      .from('email_sequences')
      .update({
        visual_layout: { nodes, connections },
        steps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      sequence: data,
    });
  }));

  // POST /api/campaigns/sequences/:id/validate - Validate sequence structure
  router.post('/sequences/:id/validate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { data, error } = await supabase
      .from('email_sequences')
      .select('visual_layout, steps')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Sequence');
    }

    const layout = data.visual_layout || { nodes: [], connections: [] };
    const validationResult = validateSequenceLayout(layout);

    res.json(validationResult);
  }));

  // POST /api/campaigns/sequences/:id/simulate - Dry-run for sample lead
  router.post('/sequences/:id/simulate', validateBody(simulateSequenceSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!uuidSchema.safeParse(req.params.id).success) {
      throw new ValidationError('Invalid sequence ID format');
    }

    const { lead_id, sample_data } = req.body;

    // Get sequence
    const { data: sequence, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !sequence) {
      throw new NotFoundError('Sequence');
    }

    // Get lead data if lead_id provided
    let leadData = sample_data || {};
    if (lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();
      if (lead) {
        leadData = {
          business_name: lead.business_name,
          email: lead.email,
          industry: lead.industry,
          ...lead,
        };
      }
    }

    // Simulate sequence execution
    const simulation = simulateSequenceExecution(sequence, leadData);

    res.json(simulation);
  }));

  // POST /api/campaigns/sequences/create-visual - Create a new sequence with visual layout
  router.post('/sequences/create-visual', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      layout: visualLayoutSchema,
    }).safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError('Invalid request: ' + parsed.error.message);
    }

    const { name, description, layout } = parsed.data;

    // Convert visual layout to steps
    // Type assertion is safe here since Zod has validated the data
    const steps = convertVisualLayoutToSteps(layout.nodes as VisualNode[], layout.connections as VisualConnection[]);

    const { data, error } = await supabase
      .from('email_sequences')
      .insert({
        name,
        description,
        steps,
        visual_layout: layout,
        is_active: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  }));

  return router;
}

// ======== Helper Functions for Visual Sequence Builder ========

interface VisualNode {
  id: string;
  type: 'email' | 'delay' | 'condition' | 'end';
  x: number;
  y: number;
  data?: Record<string, any>;
}

interface VisualConnection {
  from: string;
  to: string;
  condition?: string;
  label?: string;
}

interface VisualLayout {
  nodes: VisualNode[];
  connections: VisualConnection[];
}

/**
 * Generate visual layout from existing sequence steps
 */
function generateVisualLayoutFromSteps(steps: any[]): VisualLayout {
  const nodes: VisualNode[] = [];
  const connections: VisualConnection[] = [];

  let y = 100;
  const xCenter = 400;

  steps.forEach((step, index) => {
    // Add email node
    const nodeId = `email-${index}`;
    nodes.push({
      id: nodeId,
      type: 'email',
      x: xCenter,
      y,
      data: {
        subject: step.subject,
        template: step.template,
        condition: step.condition,
        custom_variables: step.custom_variables,
      },
    });

    // Add delay node if not the first step
    if (index > 0 && step.delay_days > 0) {
      const delayId = `delay-${index}`;
      nodes.push({
        id: delayId,
        type: 'delay',
        x: xCenter,
        y: y - 60,
        data: { days: step.delay_days },
      });

      // Connect previous email to delay
      const prevEmailId = `email-${index - 1}`;
      connections.push({ from: prevEmailId, to: delayId });
      connections.push({ from: delayId, to: nodeId });
    } else if (index > 0) {
      // Direct connection
      const prevEmailId = `email-${index - 1}`;
      connections.push({ from: prevEmailId, to: nodeId });
    }

    y += 150;
  });

  // Add end node
  if (nodes.length > 0) {
    const endId = 'end-1';
    nodes.push({
      id: endId,
      type: 'end',
      x: xCenter,
      y,
    });
    connections.push({
      from: `email-${steps.length - 1}`,
      to: endId,
    });
  }

  return { nodes, connections };
}

/**
 * Convert visual layout to sequence steps
 */
function convertVisualLayoutToSteps(nodes: VisualNode[], connections: VisualConnection[]): any[] {
  const steps: any[] = [];

  // Build adjacency map
  const adjacency = new Map<string, string[]>();
  connections.forEach(conn => {
    if (!adjacency.has(conn.from)) {
      adjacency.set(conn.from, []);
    }
    adjacency.get(conn.from)!.push(conn.to);
  });

  // Find starting nodes (nodes with no incoming connections)
  const hasIncoming = new Set(connections.map(c => c.to));
  const startNodes = nodes.filter(n => !hasIncoming.has(n.id) && n.type === 'email');

  // Traverse from start nodes
  const visited = new Set<string>();
  let currentDelay = 0;

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'email') {
      steps.push({
        delay_days: currentDelay,
        subject: node.data?.subject || 'Untitled Email',
        template: node.data?.template || '',
        condition: node.data?.condition || 'always',
        custom_variables: node.data?.custom_variables || {},
      });
      currentDelay = 0; // Reset after adding email
    } else if (node.type === 'delay') {
      currentDelay = node.data?.days || 0;
    }

    // Continue to next nodes
    const nextNodes = adjacency.get(nodeId) || [];
    nextNodes.forEach(nextId => traverse(nextId));
  }

  startNodes.forEach(node => traverse(node.id));

  return steps;
}

/**
 * Validate sequence layout for errors
 */
function validateSequenceLayout(layout: VisualLayout): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { nodes, connections } = layout;

  // Check for empty sequence
  if (nodes.length === 0) {
    errors.push('Sequence has no nodes');
    return { valid: false, errors, warnings };
  }

  // Check for at least one email node
  const emailNodes = nodes.filter(n => n.type === 'email');
  if (emailNodes.length === 0) {
    errors.push('Sequence must have at least one email step');
  }

  // Check for circular references
  const adjacency = new Map<string, string[]>();
  connections.forEach(conn => {
    if (!adjacency.has(conn.from)) {
      adjacency.set(conn.from, []);
    }
    adjacency.get(conn.from)!.push(conn.to);
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    inStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (hasCycle(node.id)) {
      errors.push('Sequence contains circular references');
      break;
    }
  }

  // Check for orphaned nodes (no incoming or outgoing connections)
  const hasIncoming = new Set(connections.map(c => c.to));
  const hasOutgoing = new Set(connections.map(c => c.from));

  nodes.forEach(node => {
    if (node.type !== 'end' && !hasOutgoing.has(node.id)) {
      warnings.push(`Node "${node.id}" has no outgoing connections`);
    }
    if (node.type === 'email' && !hasIncoming.has(node.id) && nodes.indexOf(node) !== 0) {
      warnings.push(`Email node "${node.id}" is not reachable`);
    }
  });

  // Check for email nodes without required data
  emailNodes.forEach(node => {
    if (!node.data?.subject) {
      errors.push(`Email node "${node.id}" is missing a subject`);
    }
    if (!node.data?.template) {
      warnings.push(`Email node "${node.id}" has no template content`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Simulate sequence execution for a lead
 */
function simulateSequenceExecution(sequence: any, leadData: any): {
  steps: Array<{
    step: number;
    type: string;
    description: string;
    scheduledDay: number;
    data?: any;
  }>;
  totalDays: number;
  emailCount: number;
} {
  const simulatedSteps: Array<{
    step: number;
    type: string;
    description: string;
    scheduledDay: number;
    data?: any;
  }> = [];

  let currentDay = 0;
  let emailCount = 0;

  const steps = sequence.steps || [];

  steps.forEach((step: any, index: number) => {
    // Add delay
    currentDay += step.delay_days || 0;

    // Check condition
    const conditionMet = evaluateCondition(step.condition, leadData);

    if (conditionMet) {
      emailCount++;

      // Interpolate subject
      const subject = interpolateTemplate(step.subject, leadData);

      simulatedSteps.push({
        step: index + 1,
        type: 'email',
        description: `Send email: "${subject}"`,
        scheduledDay: currentDay,
        data: {
          subject,
          template: step.template,
          conditionMet: true,
        },
      });
    } else {
      simulatedSteps.push({
        step: index + 1,
        type: 'skipped',
        description: `Email skipped (condition: ${step.condition})`,
        scheduledDay: currentDay,
        data: {
          subject: step.subject,
          condition: step.condition,
          conditionMet: false,
        },
      });
    }
  });

  return {
    steps: simulatedSteps,
    totalDays: currentDay,
    emailCount,
  };
}

function evaluateCondition(condition: string, leadData: any): boolean {
  // For simulation, we assume conditions are met by default
  // In real execution, this would check actual email tracking data
  switch (condition) {
    case 'always':
      return true;
    case 'not_opened':
    case 'not_clicked':
    case 'not_replied':
      return true; // Simulate as if previous email wasn't opened/clicked/replied
    case 'opened':
    case 'clicked':
      return false; // Simulate as if previous email wasn't opened/clicked
    default:
      return true;
  }
}

function interpolateTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}
