import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase';
import * as dotenv from 'dotenv';

dotenv.config();

export interface Lead {
  id?: string;
  website_url: string;
  business_name?: string;
  email?: string;
  phone?: string;
  score?: number;
  score_breakdown?: ScoreBreakdown;
  status: LeadStatus;
  notes?: string;
  gallery_url?: string;
  contacted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScoreBreakdown {
  overall: number;
  design: number;
  mobile: number;
  performance: number;
  seo: number;
}

export type LeadStatus = 'new' | 'scored' | 'themes_generated' | 'deployed' | 'contacted' | 'responded' | 'converted' | 'rejected';

export class LeadDatabase {
  private supabase: SupabaseClient;
  private tableName = 'leads';

  constructor() {
    this.supabase = getSupabaseClient();
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert([{
        ...lead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return data as Lead;
  }

  async getLead(id: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get lead: ${error.message}`);
    }

    return data as Lead;
  }

  async getLeadByUrl(websiteUrl: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('website_url', websiteUrl)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get lead: ${error.message}`);
    }

    return data as Lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }

    return data as Lead;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  async listLeads(options?: {
    status?: LeadStatus;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  }): Promise<Lead[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.minScore !== undefined) {
      query = query.gte('score', options.minScore);
    }

    if (options?.maxScore !== undefined) {
      query = query.lte('score', options.maxScore);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list leads: ${error.message}`);
    }

    return data as Lead[];
  }

  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    avgScore: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status, score');

    if (error) {
      throw new Error(`Failed to get lead stats: ${error.message}`);
    }

    const leads = data as Pick<Lead, 'status' | 'score'>[];

    const byStatus: Record<LeadStatus, number> = {
      new: 0,
      scored: 0,
      themes_generated: 0,
      deployed: 0,
      contacted: 0,
      responded: 0,
      converted: 0,
      rejected: 0
    };

    let totalScore = 0;
    let scoreCount = 0;

    for (const lead of leads) {
      byStatus[lead.status]++;
      if (lead.score !== undefined && lead.score !== null) {
        totalScore += lead.score;
        scoreCount++;
      }
    }

    return {
      total: leads.length,
      byStatus,
      avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount * 10) / 10 : 0
    };
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    const updates: Partial<Lead> = { status };

    if (status === 'contacted') {
      updates.contacted_at = new Date().toISOString();
    }

    return this.updateLead(id, updates);
  }

  async setLeadScore(id: string, score: number, breakdown: ScoreBreakdown): Promise<Lead> {
    return this.updateLead(id, {
      score,
      score_breakdown: breakdown,
      status: 'scored'
    });
  }

  async setGalleryUrl(id: string, galleryUrl: string): Promise<Lead> {
    return this.updateLead(id, {
      gallery_url: galleryUrl,
      status: 'deployed'
    });
  }
}

// Singleton instance
let dbInstance: LeadDatabase | null = null;

export function getLeadDatabase(): LeadDatabase {
  if (!dbInstance) {
    dbInstance = new LeadDatabase();
  }
  return dbInstance;
}

// CLI test
if (require.main === module) {
  const db = getLeadDatabase();

  db.getLeadStats()
    .then(stats => {
      console.log('Lead Database Stats:', JSON.stringify(stats, null, 2));
    })
    .catch(err => {
      console.error('Error:', err.message);
    });
}
