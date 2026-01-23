import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IndustryType } from '../ai/industry-templates';

export type PipelineStage =
  | 'new'
  | 'qualified'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost';

export const PIPELINE_STAGES: PipelineStage[] = [
  'new',
  'qualified',
  'contacted',
  'proposal_sent',
  'negotiating',
  'won',
  'lost',
];

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic info
  business_name: string;
  website_url: string;
  industry: IndustryType;

  // Contact info
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  contact_title: string | null;

  // Business details
  company_size: 'solo' | 'small' | 'medium' | 'large' | null;
  budget_range: 'low' | 'medium' | 'high' | 'enterprise' | null;
  decision_maker: boolean;

  // Location
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;

  // Pipeline
  pipeline_stage: PipelineStage;
  stage_changed_at: string;
  assigned_to: string | null;

  // Scoring
  website_score: number | null;
  lead_score: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Analysis
  ai_analysis: Record<string, any> | null;
  issues_found: string[] | null;
  recommendations: string[] | null;

  // Assets
  screenshot_url: string | null;
  gallery_url: string | null;
  proposal_url: string | null;

  // Engagement
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  last_contacted_at: string | null;
  last_response_at: string | null;

  // Custom fields
  tags: string[];
  custom_fields: Record<string, any>;
  notes: string | null;

  // Status
  is_unsubscribed: boolean;
  unsubscribed_at: string | null;
  lost_reason: string | null;
  won_value: number | null;
}

export interface CreateLeadInput {
  business_name: string;
  website_url: string;
  industry?: IndustryType;
  email?: string;
  phone?: string;
  contact_name?: string;
  contact_title?: string;
  company_size?: Lead['company_size'];
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website_score?: number;
  ai_analysis?: Record<string, any>;
  issues_found?: string[];
  recommendations?: string[];
  screenshot_url?: string;
  gallery_url?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  pipeline_stage?: PipelineStage;
  budget_range?: Lead['budget_range'];
  decision_maker?: boolean;
  priority?: Lead['priority'];
  lead_score?: number;
  proposal_url?: string;
  assigned_to?: string;
  lost_reason?: string;
  won_value?: number;
}

export interface LeadFilter {
  pipeline_stage?: PipelineStage | PipelineStage[];
  industry?: IndustryType | IndustryType[];
  priority?: Lead['priority'] | Lead['priority'][];
  min_website_score?: number;
  max_website_score?: number;
  min_lead_score?: number;
  has_email?: boolean;
  has_gallery?: boolean;
  is_unsubscribed?: boolean;
  assigned_to?: string;
  tags?: string[];
  search?: string;
  created_after?: string;
  created_before?: string;
  contacted_after?: string;
  not_contacted_since?: string;
}

export interface LeadStats {
  total: number;
  by_stage: Record<PipelineStage, number>;
  by_industry: Record<string, number>;
  by_priority: Record<string, number>;
  avg_website_score: number;
  with_email: number;
  contacted_today: number;
  won_this_month: number;
  won_value_this_month: number;
}

export class LeadModel {
  private supabase: SupabaseClient;
  private tableName = 'leads';

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    this.supabase = createClient(url, key);
  }

  async create(input: CreateLeadInput): Promise<Lead> {
    const now = new Date().toISOString();

    const lead = {
      business_name: input.business_name,
      website_url: input.website_url,
      industry: input.industry || 'other',
      email: input.email || null,
      phone: input.phone || null,
      contact_name: input.contact_name || null,
      contact_title: input.contact_title || null,
      company_size: input.company_size || null,
      budget_range: null,
      decision_maker: false,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      country: input.country || 'US',
      pipeline_stage: 'new' as PipelineStage,
      stage_changed_at: now,
      assigned_to: null,
      website_score: input.website_score || null,
      lead_score: null,
      priority: 'medium' as Lead['priority'],
      ai_analysis: input.ai_analysis || null,
      issues_found: input.issues_found || null,
      recommendations: input.recommendations || null,
      screenshot_url: input.screenshot_url || null,
      gallery_url: input.gallery_url || null,
      proposal_url: null,
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      last_contacted_at: null,
      last_response_at: null,
      tags: input.tags || [],
      custom_fields: input.custom_fields || {},
      notes: input.notes || null,
      is_unsubscribed: false,
      unsubscribed_at: null,
      lost_reason: null,
      won_value: null,
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(lead)
      .select()
      .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return data;
  }

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get lead: ${error.message}`);
    }

    return data;
  }

  async getByUrl(url: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('website_url', url)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get lead: ${error.message}`);
    }

    return data;
  }

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const updateData: any = { ...input, updated_at: new Date().toISOString() };

    // Track stage changes
    if (input.pipeline_stage) {
      updateData.stage_changed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update lead: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete lead: ${error.message}`);
  }

  async list(
    filter: LeadFilter = {},
    options: { limit?: number; offset?: number; orderBy?: string; ascending?: boolean } = {}
  ): Promise<{ leads: Lead[]; total: number }> {
    const { limit = 50, offset = 0, orderBy = 'created_at', ascending = false } = options;

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

    // Apply filters
    if (filter.pipeline_stage) {
      const stages = Array.isArray(filter.pipeline_stage) ? filter.pipeline_stage : [filter.pipeline_stage];
      query = query.in('pipeline_stage', stages);
    }

    if (filter.industry) {
      const industries = Array.isArray(filter.industry) ? filter.industry : [filter.industry];
      query = query.in('industry', industries);
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      query = query.in('priority', priorities);
    }

    if (filter.min_website_score !== undefined) {
      query = query.gte('website_score', filter.min_website_score);
    }

    if (filter.max_website_score !== undefined) {
      query = query.lte('website_score', filter.max_website_score);
    }

    if (filter.min_lead_score !== undefined) {
      query = query.gte('lead_score', filter.min_lead_score);
    }

    if (filter.has_email !== undefined) {
      query = filter.has_email
        ? query.not('email', 'is', null)
        : query.is('email', null);
    }

    if (filter.has_gallery !== undefined) {
      query = filter.has_gallery
        ? query.not('gallery_url', 'is', null)
        : query.is('gallery_url', null);
    }

    if (filter.is_unsubscribed !== undefined) {
      query = query.eq('is_unsubscribed', filter.is_unsubscribed);
    }

    if (filter.assigned_to) {
      query = query.eq('assigned_to', filter.assigned_to);
    }

    if (filter.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    if (filter.search) {
      query = query.or(`business_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,website_url.ilike.%${filter.search}%`);
    }

    if (filter.created_after) {
      query = query.gte('created_at', filter.created_after);
    }

    if (filter.created_before) {
      query = query.lte('created_at', filter.created_before);
    }

    if (filter.contacted_after) {
      query = query.gte('last_contacted_at', filter.contacted_after);
    }

    if (filter.not_contacted_since) {
      query = query.or(`last_contacted_at.is.null,last_contacted_at.lt.${filter.not_contacted_since}`);
    }

    // Apply pagination and ordering
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list leads: ${error.message}`);

    return { leads: data || [], total: count || 0 };
  }

  async getStats(): Promise<LeadStats> {
    const { data: leads, error } = await this.supabase
      .from(this.tableName)
      .select('pipeline_stage, industry, priority, website_score, email, last_contacted_at, won_value, created_at');

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const stats: LeadStats = {
      total: leads.length,
      by_stage: {
        new: 0,
        qualified: 0,
        contacted: 0,
        proposal_sent: 0,
        negotiating: 0,
        won: 0,
        lost: 0,
      },
      by_industry: {},
      by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      avg_website_score: 0,
      with_email: 0,
      contacted_today: 0,
      won_this_month: 0,
      won_value_this_month: 0,
    };

    let scoreSum = 0;
    let scoreCount = 0;

    for (const lead of leads) {
      // By stage
      if (lead.pipeline_stage) {
        stats.by_stage[lead.pipeline_stage as PipelineStage]++;
      }

      // By industry
      if (lead.industry) {
        stats.by_industry[lead.industry] = (stats.by_industry[lead.industry] || 0) + 1;
      }

      // By priority
      if (lead.priority) {
        stats.by_priority[lead.priority]++;
      }

      // Website score
      if (lead.website_score !== null) {
        scoreSum += lead.website_score;
        scoreCount++;
      }

      // Has email
      if (lead.email) {
        stats.with_email++;
      }

      // Contacted today
      if (lead.last_contacted_at?.startsWith(today)) {
        stats.contacted_today++;
      }

      // Won this month
      if (lead.pipeline_stage === 'won' && lead.created_at >= monthStart) {
        stats.won_this_month++;
        stats.won_value_this_month += lead.won_value || 0;
      }
    }

    stats.avg_website_score = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;

    return stats;
  }

  async recordEmailSent(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_emails_sent', { lead_id: id });

    if (error) {
      // Fallback to direct update
      const lead = await this.getById(id);
      if (lead) {
        await this.update(id, {});
        await this.supabase
          .from(this.tableName)
          .update({
            emails_sent: lead.emails_sent + 1,
            last_contacted_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    }
  }

  async recordEmailOpened(id: string): Promise<void> {
    const lead = await this.getById(id);
    if (lead) {
      await this.supabase
        .from(this.tableName)
        .update({ emails_opened: lead.emails_opened + 1 })
        .eq('id', id);
    }
  }

  async recordEmailClicked(id: string): Promise<void> {
    const lead = await this.getById(id);
    if (lead) {
      await this.supabase
        .from(this.tableName)
        .update({ emails_clicked: lead.emails_clicked + 1 })
        .eq('id', id);
    }
  }

  async unsubscribe(id: string): Promise<void> {
    await this.supabase
      .from(this.tableName)
      .update({
        is_unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async markWon(id: string, value: number): Promise<Lead> {
    return this.update(id, {
      pipeline_stage: 'won',
      won_value: value,
    });
  }

  async markLost(id: string, reason: string): Promise<Lead> {
    return this.update(id, {
      pipeline_stage: 'lost',
      lost_reason: reason,
    });
  }

  async addTag(id: string, tag: string): Promise<void> {
    const lead = await this.getById(id);
    if (lead && !lead.tags.includes(tag)) {
      await this.update(id, { tags: [...lead.tags, tag] });
    }
  }

  async removeTag(id: string, tag: string): Promise<void> {
    const lead = await this.getById(id);
    if (lead) {
      await this.update(id, { tags: lead.tags.filter(t => t !== tag) });
    }
  }

  async bulkUpdateStage(ids: string[], stage: PipelineStage): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        pipeline_stage: stage,
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) throw new Error(`Failed to bulk update: ${error.message}`);
  }

  async bulkAddTag(ids: string[], tag: string): Promise<void> {
    for (const id of ids) {
      await this.addTag(id, tag);
    }
  }
}

export function createLeadModel(): LeadModel {
  return new LeadModel();
}
