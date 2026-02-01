import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase';

export type ActivityType =
  | 'stage_change'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'email_bounced'
  | 'call_made'
  | 'call_received'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'contract_sent'
  | 'contract_signed'
  | 'payment_received'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'deal_won'
  | 'deal_lost'
  | 'custom';

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  user_id: string | null;
  created_at: string;
}

export interface CreateActivityInput {
  lead_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  user_id?: string;
}

export interface ActivityFilter {
  lead_id?: string;
  type?: ActivityType | ActivityType[];
  user_id?: string;
  created_after?: string;
  created_before?: string;
}

export class ActivityLogger {
  private supabase: SupabaseClient;
  private tableName = 'activities';

  constructor() {
    this.supabase = getSupabaseClient();
  }

  async log(input: CreateActivityInput): Promise<Activity> {
    const activity = {
      lead_id: input.lead_id,
      type: input.type,
      title: input.title,
      description: input.description || null,
      metadata: input.metadata || {},
      user_id: input.user_id || null,
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(activity)
      .select()
      .single();

    if (error) throw new Error(`Failed to log activity: ${error.message}`);
    return data;
  }

  async getById(id: string): Promise<Activity | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get activity: ${error.message}`);
    }

    return data;
  }

  async getTimeline(
    leadId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Activity[]> {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to get timeline: ${error.message}`);
    return data || [];
  }

  async list(
    filter: ActivityFilter = {},
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ activities: Activity[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

    if (filter.lead_id) {
      query = query.eq('lead_id', filter.lead_id);
    }

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      query = query.in('type', types);
    }

    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }

    if (filter.created_after) {
      query = query.gte('created_at', filter.created_after);
    }

    if (filter.created_before) {
      query = query.lte('created_at', filter.created_before);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list activities: ${error.message}`);

    return { activities: data || [], total: count || 0 };
  }

  async getRecentActivity(options: { limit?: number; types?: ActivityType[] } = {}): Promise<Activity[]> {
    const { limit = 20, types } = options;

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get recent activity: ${error.message}`);
    return data || [];
  }

  async getActivityStats(
    leadId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<Record<ActivityType, number>> {
    let query = this.supabase.from(this.tableName).select('type');

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get activity stats: ${error.message}`);

    const stats: Record<string, number> = {};
    for (const row of data || []) {
      stats[row.type] = (stats[row.type] || 0) + 1;
    }

    return stats as Record<ActivityType, number>;
  }

  // Convenience methods for common activity types

  async logEmailSent(
    leadId: string,
    options: { subject?: string; emailId?: string; userId?: string } = {}
  ): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'email_sent',
      title: options.subject ? `Email sent: ${options.subject}` : 'Email sent',
      metadata: { email_id: options.emailId, subject: options.subject },
      user_id: options.userId,
    });
  }

  async logEmailOpened(leadId: string, emailId?: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'email_opened',
      title: 'Email opened',
      metadata: { email_id: emailId },
    });
  }

  async logEmailClicked(leadId: string, url: string, emailId?: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'email_clicked',
      title: 'Email link clicked',
      metadata: { url, email_id: emailId },
    });
  }

  async logEmailReplied(leadId: string, snippet?: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'email_replied',
      title: 'Reply received',
      description: snippet,
    });
  }

  async logNote(leadId: string, note: string, userId?: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'note_added',
      title: 'Note added',
      description: note,
      user_id: userId,
    });
  }

  async logProposalCreated(leadId: string, proposalUrl: string, userId?: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'proposal_created',
      title: 'Proposal created',
      metadata: { url: proposalUrl },
      user_id: userId,
    });
  }

  async logProposalViewed(leadId: string, proposalId: string): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'proposal_viewed',
      title: 'Proposal viewed',
      metadata: { proposal_id: proposalId },
    });
  }

  async logPaymentReceived(
    leadId: string,
    amount: number,
    paymentId: string
  ): Promise<Activity> {
    return this.log({
      lead_id: leadId,
      type: 'payment_received',
      title: `Payment received: $${amount.toLocaleString()}`,
      metadata: { amount, payment_id: paymentId },
    });
  }

  async deleteForLead(leadId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('lead_id', leadId);

    if (error) throw new Error(`Failed to delete activities: ${error.message}`);
  }
}

export function createActivityLogger(): ActivityLogger {
  return new ActivityLogger();
}
