import { SupabaseClient } from '@supabase/supabase-js';
import { LeadModel } from '../crm/lead-model';
import { ActivityLogger } from '../crm/activity-logger';
import { getSupabaseClient } from '../utils/supabase';

export interface UnsubscribeRecord {
  id: string;
  email: string;
  lead_id: string | null;
  created_at: string;
  reason: string | null;
  source: 'link_click' | 'manual' | 'bounce' | 'spam' | 'preference';
}

export interface EmailPreferences {
  email: string;
  lead_id?: string;
  marketing_emails: boolean;
  product_updates: boolean;
  tips_and_resources: boolean;
  weekly_digest: boolean;
  unsubscribed_all: boolean;
  updated_at: string;
}

export interface UnsubscribePageData {
  email: string;
  businessName?: string;
  currentPreferences?: EmailPreferences;
  isAlreadyUnsubscribed: boolean;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return text.replace(/[&<>"'`=/]/g, (char) => map[char]);
}

export class UnsubscribeHandler {
  private supabase: SupabaseClient;
  private leadModel: LeadModel;
  private activityLogger: ActivityLogger;

  constructor(config?: { leadModel?: LeadModel; activityLogger?: ActivityLogger }) {
    this.supabase = getSupabaseClient();
    this.leadModel = config?.leadModel || new LeadModel();
    this.activityLogger = config?.activityLogger || new ActivityLogger();
  }

  async getUnsubscribePageData(leadId: string): Promise<UnsubscribePageData | null> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead || !lead.email) return null;

    const preferences = await this.getPreferences(lead.email);

    return {
      email: this.maskEmail(lead.email),
      businessName: lead.business_name,
      currentPreferences: preferences || undefined,
      isAlreadyUnsubscribed: lead.is_unsubscribed,
    };
  }

  async processUnsubscribe(
    leadId: string,
    options: {
      reason?: string;
      source?: UnsubscribeRecord['source'];
      feedback?: string;
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      return { success: false, message: 'Invalid unsubscribe link' };
    }

    if (lead.is_unsubscribed) {
      return { success: true, message: 'You are already unsubscribed' };
    }

    // Update lead
    await this.leadModel.unsubscribe(leadId);

    // Add to global unsubscribe list
    if (lead.email) {
      await this.addToUnsubscribeList(lead.email, leadId, {
        reason: options.reason || options.feedback,
        source: options.source || 'link_click',
      });
    }

    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'custom',
      title: 'Unsubscribed',
      description: options.feedback || options.reason,
      metadata: { source: options.source || 'link_click' },
    });

    return {
      success: true,
      message: 'You have been unsubscribed successfully. We\'re sorry to see you go!',
    };
  }

  async updatePreferences(
    email: string,
    preferences: Partial<Omit<EmailPreferences, 'email' | 'updated_at'>>
  ): Promise<EmailPreferences> {
    const existing = await this.getPreferences(email);

    const updated: EmailPreferences = {
      email,
      marketing_emails: preferences.marketing_emails ?? existing?.marketing_emails ?? true,
      product_updates: preferences.product_updates ?? existing?.product_updates ?? true,
      tips_and_resources: preferences.tips_and_resources ?? existing?.tips_and_resources ?? true,
      weekly_digest: preferences.weekly_digest ?? existing?.weekly_digest ?? false,
      unsubscribed_all: preferences.unsubscribed_all ?? false,
      updated_at: new Date().toISOString(),
    };

    // Store in a preferences table (we'll create this if it doesn't exist)
    await this.supabase
      .from('email_preferences')
      .upsert(updated, { onConflict: 'email' });

    // If unsubscribed from all, add to unsubscribe list
    if (updated.unsubscribed_all) {
      await this.addToUnsubscribeList(email, null, {
        reason: 'Unsubscribed via preference center',
        source: 'preference',
      });

      // Update lead if exists
      const { data: lead } = await this.supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single();

      if (lead) {
        await this.leadModel.unsubscribe(lead.id);
      }
    }

    return updated;
  }

  async getPreferences(email: string): Promise<EmailPreferences | null> {
    const { data, error } = await this.supabase
      .from('email_preferences')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist, return null silently
      if (error.message.includes('does not exist')) {
        return null;
      }
      throw new Error(`Failed to get preferences: ${error.message}`);
    }

    return data;
  }

  async addToUnsubscribeList(
    email: string,
    leadId: string | null,
    options: { reason?: string; source: UnsubscribeRecord['source'] }
  ): Promise<void> {
    await this.supabase
      .from('unsubscribes')
      .upsert({
        email,
        lead_id: leadId,
        reason: options.reason,
        source: options.source,
      }, {
        onConflict: 'email',
      });
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('unsubscribes')
      .select('id')
      .eq('email', email)
      .single();

    return !!data;
  }

  async resubscribe(email: string): Promise<{ success: boolean; message: string }> {
    // Remove from unsubscribe list
    await this.supabase
      .from('unsubscribes')
      .delete()
      .eq('email', email);

    // Update lead if exists
    const { data: lead } = await this.supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (lead) {
      await this.supabase
        .from('leads')
        .update({
          is_unsubscribed: false,
          unsubscribed_at: null,
        })
        .eq('id', lead.id);
    }

    // Update preferences
    await this.supabase
      .from('email_preferences')
      .update({
        unsubscribed_all: false,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    return {
      success: true,
      message: 'You have been resubscribed successfully!',
    };
  }

  async getUnsubscribeStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byReason: { reason: string; count: number }[];
    recentUnsubscribes: number;
  }> {
    const { data, error } = await this.supabase
      .from('unsubscribes')
      .select('source, reason, created_at');

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const records = data || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bySource: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};
    let recentCount = 0;

    for (const record of records) {
      // By source
      bySource[record.source] = (bySource[record.source] || 0) + 1;

      // By reason
      if (record.reason) {
        reasonCounts[record.reason] = (reasonCounts[record.reason] || 0) + 1;
      }

      // Recent
      if (new Date(record.created_at) > thirtyDaysAgo) {
        recentCount++;
      }
    }

    return {
      total: records.length,
      bySource,
      byReason: Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentUnsubscribes: recentCount,
    };
  }

  // Generate HTML for unsubscribe page
  generateUnsubscribePage(data: UnsubscribePageData, leadId: string): string {
    if (data.isAlreadyUnsubscribed) {
      return this.generateAlreadyUnsubscribedPage(data);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; width: 100%; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .email { font-weight: 500; color: #2563eb; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 14px; color: #333; margin-bottom: 6px; }
    textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical; min-height: 80px; }
    .buttons { display: flex; gap: 12px; margin-top: 24px; }
    button { flex: 1; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.2s; }
    .btn-unsubscribe { background: #ef4444; color: white; border: none; }
    .btn-unsubscribe:hover { background: #dc2626; }
    .btn-cancel { background: white; color: #333; border: 1px solid #ddd; }
    .btn-cancel:hover { background: #f4f4f5; }
    .note { font-size: 13px; color: #888; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Unsubscribe</h1>
    <p class="subtitle">
      We're sorry to see you go, <span class="email">${escapeHtml(data.email)}</span>
    </p>

    <form action="/api/unsubscribe" method="POST">
      <input type="hidden" name="lead_id" value="${escapeHtml(leadId)}">

      <div class="form-group">
        <label>Why are you unsubscribing? (optional)</label>
        <textarea name="feedback" placeholder="Your feedback helps us improve..."></textarea>
      </div>

      <div class="buttons">
        <button type="button" class="btn-cancel" onclick="window.close()">Cancel</button>
        <button type="submit" class="btn-unsubscribe">Unsubscribe</button>
      </div>
    </form>

    <p class="note">You can update your email preferences instead of fully unsubscribing.</p>
  </div>
</body>
</html>`;
  }

  generateSuccessPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; width: 100%; padding: 40px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
    p { color: #666; margin-bottom: 24px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>You've been unsubscribed</h1>
    <p>You will no longer receive emails from us.</p>
    <p>Changed your mind? <a href="/resubscribe">Resubscribe</a></p>
  </div>
</body>
</html>`;
  }

  private generateAlreadyUnsubscribedPage(data: UnsubscribePageData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Already Unsubscribed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; width: 100%; padding: 40px; text-align: center; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
    p { color: #666; margin-bottom: 24px; }
    .email { font-weight: 500; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Already Unsubscribed</h1>
    <p>
      <span class="email">${escapeHtml(data.email)}</span> is not receiving any emails from us.
    </p>
  </div>
</body>
</html>`;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local[0] + '*';
    return `${maskedLocal}@${domain}`;
  }
}

export function createUnsubscribeHandler(): UnsubscribeHandler {
  return new UnsubscribeHandler();
}
