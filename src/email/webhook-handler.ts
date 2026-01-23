import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeadModel } from '../crm/lead-model';
import { ActivityLogger } from '../crm/activity-logger';
import { SequenceEngine } from './sequence-engine';
import * as crypto from 'crypto';

export type SendGridEventType =
  | 'processed'
  | 'deferred'
  | 'delivered'
  | 'bounce'
  | 'dropped'
  | 'open'
  | 'click'
  | 'spamreport'
  | 'unsubscribe'
  | 'group_unsubscribe'
  | 'group_resubscribe';

export interface SendGridEvent {
  email: string;
  timestamp: number;
  'smtp-id'?: string;
  event: SendGridEventType;
  category?: string[];
  sg_event_id: string;
  sg_message_id: string;
  useragent?: string;
  ip?: string;
  url?: string;
  response?: string;
  reason?: string;
  status?: string;
  asm_group_id?: number;
  // Custom arguments
  lead_id?: string;
  sequence_id?: string;
  email_type?: string;
}

export interface WebhookHandlerConfig {
  webhookVerificationKey?: string;
  leadModel?: LeadModel;
  activityLogger?: ActivityLogger;
  sequenceEngine?: SequenceEngine;
}

export class WebhookHandler {
  private supabase: SupabaseClient;
  private leadModel: LeadModel;
  private activityLogger: ActivityLogger;
  private sequenceEngine?: SequenceEngine;
  private verificationKey?: string;

  constructor(config: WebhookHandlerConfig = {}) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required');
    }

    this.supabase = createClient(url, key);
    this.leadModel = config.leadModel || new LeadModel();
    this.activityLogger = config.activityLogger || new ActivityLogger();
    this.sequenceEngine = config.sequenceEngine;
    this.verificationKey = config.webhookVerificationKey || process.env.SENDGRID_WEBHOOK_KEY;
  }

  verifySignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    if (!this.verificationKey) {
      console.warn('No webhook verification key configured');
      return true; // Allow in dev mode
    }

    const timestampPayload = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', this.verificationKey)
      .update(timestampPayload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async handleEvents(events: SendGridEvent[]): Promise<{
    processed: number;
    errors: number;
  }> {
    let processed = 0;
    let errors = 0;

    for (const event of events) {
      try {
        await this.handleSingleEvent(event);
        processed++;
      } catch (err) {
        console.error('Error processing webhook event:', err);
        errors++;
      }
    }

    return { processed, errors };
  }

  private async handleSingleEvent(event: SendGridEvent): Promise<void> {
    // Store raw event
    await this.storeEvent(event);

    // Find associated lead
    const leadId = event.lead_id || await this.findLeadByEmail(event.email);
    if (!leadId) {
      console.log(`No lead found for email: ${event.email}`);
      return;
    }

    // Map SendGrid event to our event type
    const eventType = this.mapEventType(event.event);

    switch (eventType) {
      case 'delivered':
        // Just log - email was successfully delivered
        await this.activityLogger.log({
          lead_id: leadId,
          type: 'custom',
          title: 'Email delivered',
          metadata: { email_id: event.sg_message_id },
        });
        break;

      case 'opened':
        await this.handleOpened(leadId, event);
        break;

      case 'clicked':
        await this.handleClicked(leadId, event);
        break;

      case 'bounced':
        await this.handleBounced(leadId, event);
        break;

      case 'spam':
        await this.handleSpamReport(leadId, event);
        break;

      case 'unsubscribed':
        await this.handleUnsubscribe(leadId, event);
        break;
    }
  }

  private async handleOpened(leadId: string, event: SendGridEvent): Promise<void> {
    // Update lead
    await this.leadModel.recordEmailOpened(leadId);

    // Log activity
    await this.activityLogger.logEmailOpened(leadId, event.sg_message_id);
  }

  private async handleClicked(leadId: string, event: SendGridEvent): Promise<void> {
    // Update lead
    await this.leadModel.recordEmailClicked(leadId);

    // Log activity
    await this.activityLogger.logEmailClicked(leadId, event.url || 'unknown', event.sg_message_id);
  }

  private async handleBounced(leadId: string, event: SendGridEvent): Promise<void> {
    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'email_bounced',
      title: 'Email bounced',
      description: event.reason || 'Unknown reason',
      metadata: {
        email_id: event.sg_message_id,
        bounce_type: event.status,
        reason: event.reason,
      },
    });

    // Notify sequence engine
    if (this.sequenceEngine) {
      await this.sequenceEngine.handleEmailEvent(leadId, 'bounced');
    }
  }

  private async handleSpamReport(leadId: string, event: SendGridEvent): Promise<void> {
    // Auto-unsubscribe
    await this.leadModel.unsubscribe(leadId);

    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'custom',
      title: 'Marked as spam',
      metadata: { email_id: event.sg_message_id },
    });

    // Add to global unsubscribe list
    await this.addToUnsubscribeList(event.email, leadId, 'spam');

    // Notify sequence engine
    if (this.sequenceEngine) {
      await this.sequenceEngine.handleEmailEvent(leadId, 'unsubscribed');
    }
  }

  private async handleUnsubscribe(leadId: string, event: SendGridEvent): Promise<void> {
    // Update lead
    await this.leadModel.unsubscribe(leadId);

    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'custom',
      title: 'Unsubscribed',
      metadata: { email_id: event.sg_message_id },
    });

    // Add to global unsubscribe list
    await this.addToUnsubscribeList(event.email, leadId, 'link_click');

    // Notify sequence engine
    if (this.sequenceEngine) {
      await this.sequenceEngine.handleEmailEvent(leadId, 'unsubscribed');
    }
  }

  private async storeEvent(event: SendGridEvent): Promise<void> {
    const leadId = event.lead_id || await this.findLeadByEmail(event.email);

    await this.supabase.from('email_events').insert({
      lead_id: leadId,
      email_id: event.sg_message_id,
      event_type: this.mapEventType(event.event),
      email_to: event.email,
      url_clicked: event.url,
      bounce_reason: event.reason,
      ip_address: event.ip,
      user_agent: event.useragent,
      sendgrid_event_id: event.sg_event_id,
      raw_payload: event,
    });
  }

  private async findLeadByEmail(email: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    return data?.id || null;
  }

  private async addToUnsubscribeList(
    email: string,
    leadId: string | null,
    source: string
  ): Promise<void> {
    await this.supabase
      .from('unsubscribes')
      .upsert({
        email,
        lead_id: leadId,
        source,
      }, {
        onConflict: 'email',
      });
  }

  private mapEventType(
    sendgridEvent: SendGridEventType
  ): 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'unsubscribed' | 'dropped' | 'deferred' {
    const mapping: Record<SendGridEventType, string> = {
      processed: 'sent',
      deferred: 'deferred',
      delivered: 'delivered',
      bounce: 'bounced',
      dropped: 'dropped',
      open: 'opened',
      click: 'clicked',
      spamreport: 'spam',
      unsubscribe: 'unsubscribed',
      group_unsubscribe: 'unsubscribed',
      group_resubscribe: 'delivered',
    };

    return (mapping[sendgridEvent] || sendgridEvent) as any;
  }

  // Check if email is in unsubscribe list
  async isUnsubscribed(email: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('unsubscribes')
      .select('id')
      .eq('email', email)
      .single();

    return !!data;
  }

  // Get email events for a lead
  async getEventsForLead(
    leadId: string,
    options: { limit?: number; eventTypes?: string[] } = {}
  ): Promise<any[]> {
    let query = this.supabase
      .from('email_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      query = query.in('event_type', options.eventTypes);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get events: ${error.message}`);
    return data || [];
  }

  // Get aggregated stats
  async getEmailStats(dateRange?: { start: string; end: string }): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    spam: number;
    openRate: number;
    clickRate: number;
  }> {
    let query = this.supabase
      .from('email_events')
      .select('event_type');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.event_type] = (counts[row.event_type] || 0) + 1;
    }

    const sent = counts.sent || 0;
    const delivered = counts.delivered || 0;
    const opened = counts.opened || 0;
    const clicked = counts.clicked || 0;
    const bounced = counts.bounced || 0;
    const spam = counts.spam || 0;

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      spam,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
    };
  }
}

export function createWebhookHandler(config?: WebhookHandlerConfig): WebhookHandler {
  return new WebhookHandler(config);
}
