import { SupabaseClient } from '@supabase/supabase-js';
import { IndustryType } from '../ai/industry-templates';
import { getSupabaseClient } from '../utils/supabase';

const SAFE_SEARCH_PATTERN = /[a-z0-9@.\- ]/g;

function sanitizeSearchTerm(term: string): string | null {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return null;
  const matches = trimmed.match(SAFE_SEARCH_PATTERN);
  if (!matches) return null;
  const sanitized = matches.join('').replace(/\s+/g, ' ').trim();
  if (!sanitized) return null;
  return sanitized.slice(0, 100);
}

function normalizeDateFilter(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

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

  // Media assets (Phase 1 & 2)
  before_after_gif_url: string | null;
  gallery_video_url: string | null;
  video_thumbnail_url: string | null;

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
  before_after_gif_url?: string;
  gallery_video_url?: string;
  video_thumbnail_url?: string;
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
  before_after_gif_url?: string;
  gallery_video_url?: string;
  video_thumbnail_url?: string;
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
  has_media?: boolean;
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

  constructor() {
    this.supabase = getSupabaseClient();
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
      before_after_gif_url: input.before_after_gif_url || null,
      gallery_video_url: input.gallery_video_url || null,
      video_thumbnail_url: input.video_thumbnail_url || null,
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

    if (filter.has_media !== undefined) {
      query = filter.has_media
        ? query.not('before_after_gif_url', 'is', null)
        : query.is('before_after_gif_url', null);
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
      const safeSearch = sanitizeSearchTerm(filter.search);
      if (safeSearch) {
        query = query.or(
          `business_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,website_url.ilike.%${safeSearch}%`
        );
      }
    }

    const createdAfter = normalizeDateFilter(filter.created_after);
    if (createdAfter) {
      query = query.gte('created_at', createdAfter);
    }

    const createdBefore = normalizeDateFilter(filter.created_before);
    if (createdBefore) {
      query = query.lte('created_at', createdBefore);
    }

    const contactedAfter = normalizeDateFilter(filter.contacted_after);
    if (contactedAfter) {
      query = query.gte('last_contacted_at', contactedAfter);
    }

    const notContactedSince = normalizeDateFilter(filter.not_contacted_since);
    if (notContactedSince) {
      query = query.or(`last_contacted_at.is.null,last_contacted_at.lt.${notContactedSince}`);
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
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Initialize stats
    const stats: LeadStats = {
      total: 0,
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

    // Run multiple aggregation queries in parallel for efficiency
    const [
      totalResult,
      stageResult,
      industryResult,
      priorityResult,
      scoreResult,
      emailResult,
      contactedTodayResult,
      wonThisMonthResult
    ] = await Promise.all([
      // Total count
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }),

      // Count by stage
      this.supabase.from(this.tableName).select('pipeline_stage'),

      // Count by industry
      this.supabase.from(this.tableName).select('industry'),

      // Count by priority
      this.supabase.from(this.tableName).select('priority'),

      // Average website score
      this.supabase.from(this.tableName).select('website_score').not('website_score', 'is', null),

      // Count with email
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).not('email', 'is', null),

      // Contacted today
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('last_contacted_at', today),

      // Won this month (with value)
      this.supabase.from(this.tableName).select('won_value').eq('pipeline_stage', 'won').gte('stage_changed_at', monthStart)
    ]);

    // Process results
    stats.total = totalResult.count || 0;

    // Process stage counts
    if (stageResult.data) {
      for (const lead of stageResult.data) {
        if (lead.pipeline_stage && stats.by_stage.hasOwnProperty(lead.pipeline_stage)) {
          stats.by_stage[lead.pipeline_stage as PipelineStage]++;
        }
      }
    }

    // Process industry counts
    if (industryResult.data) {
      for (const lead of industryResult.data) {
        if (lead.industry) {
          stats.by_industry[lead.industry] = (stats.by_industry[lead.industry] || 0) + 1;
        }
      }
    }

    // Process priority counts
    if (priorityResult.data) {
      for (const lead of priorityResult.data) {
        if (lead.priority && stats.by_priority.hasOwnProperty(lead.priority)) {
          stats.by_priority[lead.priority]++;
        }
      }
    }

    // Calculate average website score
    if (scoreResult.data && scoreResult.data.length > 0) {
      const scores = scoreResult.data.map(d => d.website_score).filter((s): s is number => s !== null);
      if (scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        stats.avg_website_score = Math.round((sum / scores.length) * 10) / 10;
      }
    }

    stats.with_email = emailResult.count || 0;
    stats.contacted_today = contactedTodayResult.count || 0;

    // Won this month stats
    if (wonThisMonthResult.data) {
      stats.won_this_month = wonThisMonthResult.data.length;
      stats.won_value_this_month = wonThisMonthResult.data.reduce((sum, d) => sum + (d.won_value || 0), 0);
    }

    return stats;
  }

  async recordEmailSent(id: string): Promise<void> {
    // Use atomic RPC increment (migration 006_atomic_counters.sql required)
    const { error } = await this.supabase.rpc('increment_emails_sent', { lead_id: id });
    if (error) {
      console.error('Failed to increment emails_sent:', error.message);
    }
  }

  async recordEmailOpened(id: string): Promise<void> {
    // Use atomic RPC increment (migration 006_atomic_counters.sql required)
    const { error } = await this.supabase.rpc('increment_emails_opened', { lead_id: id });
    if (error) {
      console.error('Failed to increment emails_opened:', error.message);
    }
  }

  async recordEmailClicked(id: string): Promise<void> {
    // Use atomic RPC increment (migration 006_atomic_counters.sql required)
    const { error } = await this.supabase.rpc('increment_emails_clicked', { lead_id: id });
    if (error) {
      console.error('Failed to increment emails_clicked:', error.message);
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
    if (ids.length === 0) return;

    // Fetch all leads that don't already have the tag in a single query
    const { data: leads, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('id, tags')
      .in('id', ids);

    if (fetchError || !leads?.length) return;

    // Filter to only leads that need the tag and prepare batch updates
    const updates = leads
      .filter(lead => !(lead.tags || []).includes(tag))
      .map(lead => ({
        id: lead.id,
        tags: [...(lead.tags || []), tag],
        updated_at: new Date().toISOString()
      }));

    if (updates.length === 0) return;

    // Batch upsert all updates in a single query
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(updates, { onConflict: 'id' });

    if (error) throw new Error(`Failed to bulk add tag: ${error.message}`);
  }
}

export function createLeadModel(): LeadModel {
  return new LeadModel();
}
