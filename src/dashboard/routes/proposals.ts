import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth';
import { ProposalGenerator, ProposalConfig } from '../../crm/proposal-generator';
import { ContractGenerator, ContractConfig } from '../../crm/contract-generator';
import { LeadModel } from '../../crm/lead-model';
import { ActivityLogger } from '../../crm/activity-logger';
import { WebsiteAnalysis } from '../../ai/website-analyzer';
import { getSupabaseClient } from '../../utils/supabase';
import { validateBody, validateQuery, uuidSchema, paginationSchema, createProposalSchema } from '../../utils/validation';
import { AppError, NotFoundError, ValidationError, asyncHandler } from '../../utils/error-handler';

// Schema definitions
const listProposalsQuerySchema = paginationSchema.extend({
  lead_id: uuidSchema.optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']).optional(),
});

const acceptProposalSchema = z.object({
  selected_tier: z.string().min(1).max(100),
  start_date: z.string().optional(),
});

const quickQuoteSchema = z.object({
  lead_id: uuidSchema,
  tier: z.enum(['basic', 'professional', 'enterprise']).optional(),
  discount_percent: z.number().min(0).max(50).optional(),
});

const signContractSchema = z.object({
  signed_by: z.string().min(1).max(200),
});

export function createProposalsRouter(): Router {
  const router = Router();

  const leadModel = new LeadModel();
  const activityLogger = new ActivityLogger();

  const supabase = getSupabaseClient();

  // Default config - would come from settings
  const proposalConfig: ProposalConfig = {
    companyName: process.env.COMPANY_NAME || 'AutoWebsites Pro',
    companyEmail: process.env.COMPANY_EMAIL || 'hello@autowebsites.com',
    companyPhone: process.env.COMPANY_PHONE || '(555) 123-4567',
    companyAddress: process.env.COMPANY_ADDRESS || '123 Main St, Austin TX 78701',
  };

  const contractConfig: ContractConfig = {
    companyName: proposalConfig.companyName,
    companyLegalName: process.env.COMPANY_LEGAL_NAME || proposalConfig.companyName,
    companyEmail: proposalConfig.companyEmail,
    companyPhone: proposalConfig.companyPhone,
    companyAddress: proposalConfig.companyAddress,
  };

  const proposalGenerator = new ProposalGenerator(proposalConfig);
  const contractGenerator = new ContractGenerator(contractConfig);

  // List proposals
  router.get('/', validateQuery(listProposalsQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lead_id, status, page = 1, limit = 50 } = req.query as z.infer<typeof listProposalsQuerySchema>;

    let query = supabase
      .from('proposals')
      .select('*, leads(business_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (lead_id) {
      query = query.eq('lead_id', lead_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

    res.json({
      proposals: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    });
  }));

  // Get proposal
  router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposalId = req.params.id;

    if (!uuidSchema.safeParse(proposalId).success) {
      throw new ValidationError('Invalid proposal ID format');
    }

    const { data, error } = await supabase
      .from('proposals')
      .select('*, leads(*)')
      .eq('id', proposalId)
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
    if (!data) throw new NotFoundError('Proposal');

    res.json(data);
  }));

  // Create proposal
  router.post('/', validateBody(createProposalSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lead_id, discount_percent, custom_pricing } = req.body;

    const lead = await leadModel.getById(lead_id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Get analysis or create mock one
    const analysis = lead.ai_analysis || {
      businessName: lead.business_name,
      industry: lead.industry,
      industryConfidence: 80,
      businessType: 'local',
      targetAudience: 'Local customers',
      overallScore: lead.website_score || 5,
      issues: (lead.issues_found || []).map((title: string, i: number) => ({
        category: 'design',
        severity: i === 0 ? 'critical' : 'major',
        title,
        description: title,
        businessImpact: 'May be losing customers',
        fixDifficulty: 'medium',
      })),
      strengths: ['Has existing website'],
      recommendations: (lead.recommendations || []).map((title: string, i: number) => ({
        priority: i + 1,
        title,
        description: title,
        expectedOutcome: 'Improved performance',
        timeframe: 'short-term',
      })),
      estimatedImpact: {
        currentMonthlyVisitors: '~500',
        potentialIncrease: '30-50%',
        estimatedRevenueLoss: '$500-2000/month',
      },
      talkingPoints: [],
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.0',
    };

    const { proposal, pdfPath } = await proposalGenerator.generate(lead, analysis as WebsiteAnalysis, {
      customPricing: custom_pricing,
      discountPercent: discount_percent,
    });

    // Store in database
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        id: proposal.id,
        lead_id,
        valid_until: proposal.valid_until,
        executive_summary: proposal.executive_summary,
        problems_identified: proposal.problems_identified,
        solutions_proposed: proposal.solutions_proposed,
        pricing_tiers: proposal.pricing_tiers,
        pdf_url: pdfPath, // Would be uploaded to storage in production
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

    // Log activity
    await activityLogger.logProposalCreated(lead_id, pdfPath, req.user?.id);

    res.status(201).json({ proposal: data, pdfPath });
  }));

  // Send proposal
  router.post('/:id/send', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposalId = req.params.id;

    if (!uuidSchema.safeParse(proposalId).success) {
      throw new ValidationError('Invalid proposal ID format');
    }

    // Update status
    const { data, error } = await supabase
      .from('proposals')
      .update({ status: 'sent' })
      .eq('id', proposalId)
      .select('*, leads(*)')
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
    if (!data) throw new NotFoundError('Proposal');

    // Log activity
    await activityLogger.log({
      lead_id: data.lead_id,
      type: 'proposal_sent',
      title: 'Proposal sent',
      metadata: { proposal_id: proposalId },
      user_id: req.user?.id,
    });

    // Update lead stage
    await leadModel.update(data.lead_id, {
      pipeline_stage: 'proposal_sent',
      proposal_url: data.pdf_url,
    });

    res.json(data);
  }));

  // Record proposal view
  router.post('/:id/view', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposalId = req.params.id;

    if (!uuidSchema.safeParse(proposalId).success) {
      throw new ValidationError('Invalid proposal ID format');
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('lead_id, viewed_count')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new NotFoundError('Proposal');

    await supabase
      .from('proposals')
      .update({
        viewed_at: new Date().toISOString(),
        viewed_count: (proposal.viewed_count || 0) + 1,
        status: 'viewed',
      })
      .eq('id', proposalId);

    // Log activity
    await activityLogger.logProposalViewed(proposal.lead_id, proposalId);

    res.json({ success: true });
  }));

  // Accept proposal (create contract)
  router.post('/:id/accept', validateBody(acceptProposalSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposalId = req.params.id;

    if (!uuidSchema.safeParse(proposalId).success) {
      throw new ValidationError('Invalid proposal ID format');
    }

    const { selected_tier, start_date } = req.body;

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, leads(*)')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new NotFoundError('Proposal');

    // Update proposal
    await supabase
      .from('proposals')
      .update({
        status: 'accepted',
        selected_tier,
      })
      .eq('id', proposalId);

    // Generate contract
    const { contract, pdfPath } = await contractGenerator.generate(
      proposal.leads,
      proposal,
      selected_tier,
      { startDate: start_date }
    );

    // Store contract
    const { data: contractData, error } = await supabase
      .from('contracts')
      .insert({
        id: contract.id,
        lead_id: proposal.lead_id,
        proposal_id: proposal.id,
        client_name: contract.client_name,
        client_email: contract.client_email,
        client_address: contract.client_address,
        selected_tier: contract.selected_tier,
        total_amount: contract.total_amount,
        deposit_amount: contract.deposit_amount,
        payment_schedule: contract.payment_schedule,
        scope_of_work: contract.scope_of_work,
        deliverables: contract.deliverables,
        timeline: contract.timeline,
        start_date: contract.start_date,
        estimated_completion: contract.estimated_completion,
        pdf_url: pdfPath,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

    // Update lead stage
    await leadModel.update(proposal.lead_id, {
      pipeline_stage: 'negotiating',
    });

    res.json({ proposal, contract: contractData });
  }));

  // List contracts
  router.get('/contracts/list', validateQuery(listProposalsQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lead_id, status } = req.query as any;

    let query = supabase
      .from('contracts')
      .select('*, leads(business_name, email)')
      .order('created_at', { ascending: false });

    if (lead_id) {
      if (!uuidSchema.safeParse(lead_id).success) {
        throw new ValidationError('Invalid lead_id format');
      }
      query = query.eq('lead_id', lead_id);
    }
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

    res.json(data || []);
  }));

  // Get contract
  router.get('/contracts/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contractId = req.params.id;

    if (!uuidSchema.safeParse(contractId).success) {
      throw new ValidationError('Invalid contract ID format');
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*, leads(*), proposals(*)')
      .eq('id', contractId)
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
    if (!data) throw new NotFoundError('Contract');

    res.json(data);
  }));

  // Send contract
  router.post('/contracts/:id/send', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contractId = req.params.id;

    if (!uuidSchema.safeParse(contractId).success) {
      throw new ValidationError('Invalid contract ID format');
    }

    const { data, error } = await supabase
      .from('contracts')
      .update({ status: 'sent' })
      .eq('id', contractId)
      .select('*, leads(*)')
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
    if (!data) throw new NotFoundError('Contract');

    // Log activity
    await activityLogger.log({
      lead_id: data.lead_id,
      type: 'contract_sent',
      title: 'Contract sent',
      metadata: { contract_id: contractId },
      user_id: req.user?.id,
    });

    res.json(data);
  }));

  // Sign contract
  router.post('/contracts/:id/sign', validateBody(signContractSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contractId = req.params.id;

    if (!uuidSchema.safeParse(contractId).success) {
      throw new ValidationError('Invalid contract ID format');
    }

    const { signed_by } = req.body;

    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by,
        signature_ip: req.ip,
      })
      .eq('id', contractId)
      .select('*, leads(*)')
      .single();

    if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
    if (!data) throw new NotFoundError('Contract');

    // Log activity
    await activityLogger.log({
      lead_id: data.lead_id,
      type: 'contract_signed',
      title: 'Contract signed',
      metadata: { contract_id: contractId, signed_by },
    });

    res.json(data);
  }));

  // Get quick quote
  router.post('/quick-quote', validateBody(quickQuoteSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lead_id, tier, discount_percent } = req.body;

    const lead = await leadModel.getById(lead_id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Create mock analysis
    const analysis = {
      businessName: lead.business_name,
      industry: lead.industry,
      overallScore: lead.website_score || 5,
      issues: [],
      recommendations: [],
    } as any;

    const quote = await proposalGenerator.generateQuickQuote(analysis, {
      tier,
      discountPercent: discount_percent,
    });

    res.json(quote);
  }));

  return router;
}
