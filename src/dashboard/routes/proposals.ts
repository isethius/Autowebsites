import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth';
import { ProposalGenerator, ProposalConfig } from '../../crm/proposal-generator';
import { ContractGenerator, ContractConfig } from '../../crm/contract-generator';
import { LeadModel } from '../../crm/lead-model';
import { ActivityLogger } from '../../crm/activity-logger';
import { WebsiteAnalysis } from '../../ai/website-analyzer';
import { createClient } from '@supabase/supabase-js';

export function createProposalsRouter(): Router {
  const router = Router();

  const leadModel = new LeadModel();
  const activityLogger = new ActivityLogger();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

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
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_id, status, page = '1', limit = '50' } = req.query;

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

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      query = query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        proposals: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
        },
      });
    } catch (error: any) {
      console.error('List proposals error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get proposal
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, leads(*)')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Proposal not found' });

      res.json(data);
    } catch (error: any) {
      console.error('Get proposal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create proposal
  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_id, discount_percent, custom_pricing } = req.body;

      if (!lead_id) {
        return res.status(400).json({ error: 'lead_id required' });
      }

      const lead = await leadModel.getById(lead_id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
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

      if (error) throw error;

      // Log activity
      await activityLogger.logProposalCreated(lead_id, pdfPath, req.user?.id);

      res.status(201).json({ proposal: data, pdfPath });
    } catch (error: any) {
      console.error('Create proposal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send proposal
  router.post('/:id/send', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Update status
      const { data, error } = await supabase
        .from('proposals')
        .update({ status: 'sent' })
        .eq('id', req.params.id)
        .select('*, leads(*)')
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Proposal not found' });

      // Log activity
      await activityLogger.log({
        lead_id: data.lead_id,
        type: 'proposal_sent',
        title: 'Proposal sent',
        metadata: { proposal_id: req.params.id },
        user_id: req.user?.id,
      });

      // Update lead stage
      await leadModel.update(data.lead_id, {
        pipeline_stage: 'proposal_sent',
        proposal_url: data.pdf_url,
      });

      res.json(data);
    } catch (error: any) {
      console.error('Send proposal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Record proposal view
  router.post('/:id/view', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('lead_id, viewed_count')
        .eq('id', req.params.id)
        .single();

      if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

      await supabase
        .from('proposals')
        .update({
          viewed_at: new Date().toISOString(),
          viewed_count: (proposal.viewed_count || 0) + 1,
          status: 'viewed',
        })
        .eq('id', req.params.id);

      // Log activity
      await activityLogger.logProposalViewed(proposal.lead_id, req.params.id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('View proposal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept proposal (create contract)
  router.post('/:id/accept', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { selected_tier, start_date } = req.body;

      const { data: proposal } = await supabase
        .from('proposals')
        .select('*, leads(*)')
        .eq('id', req.params.id)
        .single();

      if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

      // Update proposal
      await supabase
        .from('proposals')
        .update({
          status: 'accepted',
          selected_tier,
        })
        .eq('id', req.params.id);

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

      if (error) throw error;

      // Update lead stage
      await leadModel.update(proposal.lead_id, {
        pipeline_stage: 'negotiating',
      });

      res.json({ proposal, contract: contractData });
    } catch (error: any) {
      console.error('Accept proposal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // List contracts
  router.get('/contracts/list', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_id, status } = req.query;

      let query = supabase
        .from('contracts')
        .select('*, leads(business_name, email)')
        .order('created_at', { ascending: false });

      if (lead_id) query = query.eq('lead_id', lead_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error: any) {
      console.error('List contracts error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get contract
  router.get('/contracts/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, leads(*), proposals(*)')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Contract not found' });

      res.json(data);
    } catch (error: any) {
      console.error('Get contract error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send contract
  router.post('/contracts/:id/send', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'sent' })
        .eq('id', req.params.id)
        .select('*, leads(*)')
        .single();

      if (error) throw error;

      // Log activity
      await activityLogger.log({
        lead_id: data.lead_id,
        type: 'contract_sent',
        title: 'Contract sent',
        metadata: { contract_id: req.params.id },
        user_id: req.user?.id,
      });

      res.json(data);
    } catch (error: any) {
      console.error('Send contract error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sign contract
  router.post('/contracts/:id/sign', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { signed_by } = req.body;

      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by,
          signature_ip: req.ip,
        })
        .eq('id', req.params.id)
        .select('*, leads(*)')
        .single();

      if (error) throw error;

      // Log activity
      await activityLogger.log({
        lead_id: data.lead_id,
        type: 'contract_signed',
        title: 'Contract signed',
        metadata: { contract_id: req.params.id, signed_by },
      });

      res.json(data);
    } catch (error: any) {
      console.error('Sign contract error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get quick quote
  router.post('/quick-quote', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_id, tier, discount_percent } = req.body;

      const lead = await leadModel.getById(lead_id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
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
    } catch (error: any) {
      console.error('Quick quote error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
