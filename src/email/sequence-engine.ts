import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, LeadModel } from '../crm/lead-model';
import { EmailComposer, TemplateVariables } from './composer';
import { ActivityLogger } from '../crm/activity-logger';

export interface SequenceStep {
  delay_days: number;
  subject: string;
  template: string;
  condition?: 'not_opened' | 'not_clicked' | 'not_replied' | 'opened' | 'clicked' | 'always';
  custom_variables?: Record<string, string>;
}

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  steps: SequenceStep[];
  total_enrolled: number;
  total_completed: number;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  lead_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  next_email_at: string | null;
  last_email_at: string | null;
  completed_at: string | null;
  stop_reason?: string;
  created_at: string;
}

export interface SendEmailFunction {
  (to: string, subject: string, html: string, text: string): Promise<{ messageId: string }>;
}

export class SequenceEngine {
  private supabase: SupabaseClient;
  private leadModel: LeadModel;
  private emailComposer: EmailComposer;
  private activityLogger: ActivityLogger;
  private sendEmail: SendEmailFunction;

  constructor(config: {
    leadModel?: LeadModel;
    emailComposer: EmailComposer;
    activityLogger?: ActivityLogger;
    sendEmail: SendEmailFunction;
  }) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required');
    }

    this.supabase = createClient(url, key);
    this.leadModel = config.leadModel || new LeadModel();
    this.emailComposer = config.emailComposer;
    this.activityLogger = config.activityLogger || new ActivityLogger();
    this.sendEmail = config.sendEmail;
  }

  async createSequence(
    name: string,
    steps: SequenceStep[],
    description?: string
  ): Promise<EmailSequence> {
    const { data, error } = await this.supabase
      .from('email_sequences')
      .insert({
        name,
        description,
        steps,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create sequence: ${error.message}`);
    return data;
  }

  async getSequence(id: string): Promise<EmailSequence | null> {
    const { data, error } = await this.supabase
      .from('email_sequences')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get sequence: ${error.message}`);
    }

    return data;
  }

  async listSequences(): Promise<EmailSequence[]> {
    const { data, error } = await this.supabase
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list sequences: ${error.message}`);
    return data || [];
  }

  async enrollLead(
    leadId: string,
    sequenceId: string,
    options: { startImmediately?: boolean; timezone?: string } = {}
  ): Promise<SequenceEnrollment> {
    const { startImmediately = true } = options;

    // Check if already enrolled
    const existing = await this.getEnrollment(sequenceId, leadId);
    if (existing && existing.status === 'active') {
      throw new Error('Lead is already enrolled in this sequence');
    }

    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    if (!lead.email) {
      throw new Error('Lead has no email address');
    }

    const sequence = await this.getSequence(sequenceId);
    if (!sequence || !sequence.is_active) {
      throw new Error('Sequence not found or inactive');
    }

    // Calculate first email time
    const firstStep = sequence.steps[0];
    const nextEmailAt = startImmediately && firstStep.delay_days === 0
      ? new Date()
      : this.calculateNextEmailTime(firstStep.delay_days, options.timezone);

    const { data, error } = await this.supabase
      .from('sequence_enrollments')
      .insert({
        sequence_id: sequenceId,
        lead_id: leadId,
        current_step: 0,
        status: 'active',
        next_email_at: nextEmailAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to enroll lead: ${error.message}`);

    // Update sequence stats
    await this.supabase
      .from('email_sequences')
      .update({ total_enrolled: sequence.total_enrolled + 1 })
      .eq('id', sequenceId);

    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'custom',
      title: `Enrolled in sequence: ${sequence.name}`,
      metadata: { sequence_id: sequenceId },
    });

    return data;
  }

  async getEnrollment(sequenceId: string, leadId: string): Promise<SequenceEnrollment | null> {
    const { data, error } = await this.supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .eq('lead_id', leadId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get enrollment: ${error.message}`);
    }

    return data;
  }

  async pauseEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    await this.supabase
      .from('sequence_enrollments')
      .update({
        status: 'paused',
        stop_reason: reason,
      })
      .eq('id', enrollmentId);
  }

  async resumeEnrollment(enrollmentId: string): Promise<void> {
    const { data: enrollment } = await this.supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) return;

    const nextEmailAt = this.calculateNextEmailTime(0);

    await this.supabase
      .from('sequence_enrollments')
      .update({
        status: 'active',
        next_email_at: nextEmailAt.toISOString(),
        stop_reason: null,
      })
      .eq('id', enrollmentId);
  }

  async cancelEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    await this.supabase
      .from('sequence_enrollments')
      .update({
        status: 'cancelled',
        stop_reason: reason || 'Manually cancelled',
      })
      .eq('id', enrollmentId);
  }

  async processNextEmails(batchSize: number = 50): Promise<number> {
    // Get enrollments ready to send
    const now = new Date().toISOString();

    const { data: enrollments, error } = await this.supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_email_at', now)
      .limit(batchSize);

    if (error) {
      console.error('Failed to fetch enrollments:', error);
      return 0;
    }

    let sentCount = 0;

    for (const enrollment of enrollments || []) {
      try {
        const sent = await this.processEnrollmentStep(enrollment);
        if (sent) sentCount++;
      } catch (err) {
        console.error(`Failed to process enrollment ${enrollment.id}:`, err);
      }
    }

    return sentCount;
  }

  async processEnrollmentStep(enrollment: SequenceEnrollment): Promise<boolean> {
    const sequence = await this.getSequence(enrollment.sequence_id);
    if (!sequence) return false;

    const lead = await this.leadModel.getById(enrollment.lead_id);
    if (!lead || !lead.email) return false;

    // Check if lead unsubscribed
    if (lead.is_unsubscribed) {
      await this.cancelEnrollment(enrollment.id, 'Lead unsubscribed');
      return false;
    }

    // Check if lead replied (auto-pause)
    if (lead.last_response_at && enrollment.last_email_at) {
      const responseTime = new Date(lead.last_response_at);
      const lastEmail = new Date(enrollment.last_email_at);
      if (responseTime > lastEmail) {
        await this.pauseEnrollment(enrollment.id, 'Lead replied');
        return false;
      }
    }

    const step = sequence.steps[enrollment.current_step];
    if (!step) {
      await this.completeEnrollment(enrollment, sequence);
      return false;
    }

    // Check step condition
    if (step.condition && !this.checkCondition(step.condition, lead)) {
      // Skip to next step
      await this.advanceToNextStep(enrollment, sequence, lead);
      return false;
    }

    // Send email
    const variables: TemplateVariables = {
      contact_name: lead.contact_name || 'there',
      business_name: lead.business_name,
      preview_url: lead.gallery_url || '',
      sender_name: 'Your Name', // Would come from config
      sender_company: 'Your Company',
      ...step.custom_variables,
    };

    const email = this.emailComposer.composeFromTemplate(step.template, variables, {
      subject: this.interpolateSubject(step.subject, lead),
    });

    try {
      const result = await this.sendEmail(lead.email, email.subject, email.html, email.text);

      // Log activity
      await this.activityLogger.logEmailSent(lead.id, {
        subject: email.subject,
        emailId: result.messageId,
      });

      // Update lead
      await this.leadModel.recordEmailSent(lead.id);

      // Advance enrollment
      await this.advanceToNextStep(enrollment, sequence, lead);

      return true;
    } catch (err) {
      console.error(`Failed to send email to ${lead.email}:`, err);
      return false;
    }
  }

  async handleEmailEvent(
    leadId: string,
    eventType: 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed'
  ): Promise<void> {
    if (eventType === 'replied') {
      // Pause all active enrollments for this lead
      const { data: enrollments } = await this.supabase
        .from('sequence_enrollments')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'active');

      for (const enrollment of enrollments || []) {
        await this.pauseEnrollment(enrollment.id, 'Lead replied');
      }

      // Log the reply
      await this.activityLogger.logEmailReplied(leadId);
    } else if (eventType === 'bounced' || eventType === 'unsubscribed') {
      // Cancel all enrollments
      const { data: enrollments } = await this.supabase
        .from('sequence_enrollments')
        .select('*')
        .eq('lead_id', leadId)
        .in('status', ['active', 'paused']);

      for (const enrollment of enrollments || []) {
        await this.cancelEnrollment(enrollment.id, `Email ${eventType}`);
      }
    }
  }

  private async advanceToNextStep(
    enrollment: SequenceEnrollment,
    sequence: EmailSequence,
    lead: Lead
  ): Promise<void> {
    const nextStepIndex = enrollment.current_step + 1;

    if (nextStepIndex >= sequence.steps.length) {
      await this.completeEnrollment(enrollment, sequence);
      return;
    }

    const nextStep = sequence.steps[nextStepIndex];
    const nextEmailAt = this.calculateNextEmailTime(nextStep.delay_days);

    await this.supabase
      .from('sequence_enrollments')
      .update({
        current_step: nextStepIndex,
        next_email_at: nextEmailAt.toISOString(),
        last_email_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);
  }

  private async completeEnrollment(
    enrollment: SequenceEnrollment,
    sequence: EmailSequence
  ): Promise<void> {
    await this.supabase
      .from('sequence_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        next_email_at: null,
      })
      .eq('id', enrollment.id);

    // Update sequence stats
    await this.supabase
      .from('email_sequences')
      .update({ total_completed: sequence.total_completed + 1 })
      .eq('id', sequence.id);
  }

  private checkCondition(
    condition: SequenceStep['condition'],
    lead: Lead
  ): boolean {
    switch (condition) {
      case 'always':
        return true;
      case 'not_opened':
        return lead.emails_opened === 0;
      case 'not_clicked':
        return lead.emails_clicked === 0;
      case 'not_replied':
        return !lead.last_response_at;
      case 'opened':
        return lead.emails_opened > 0;
      case 'clicked':
        return lead.emails_clicked > 0;
      default:
        return true;
    }
  }

  private calculateNextEmailTime(delayDays: number, timezone?: string): Date {
    const now = new Date();
    const nextTime = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);

    // Adjust to business hours (9 AM - 5 PM)
    const hours = nextTime.getHours();
    if (hours < 9) {
      nextTime.setHours(9, 0, 0, 0);
    } else if (hours >= 17) {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(9, 0, 0, 0);
    }

    // Skip weekends
    const day = nextTime.getDay();
    if (day === 0) { // Sunday
      nextTime.setDate(nextTime.getDate() + 1);
    } else if (day === 6) { // Saturday
      nextTime.setDate(nextTime.getDate() + 2);
    }

    return nextTime;
  }

  private interpolateSubject(subject: string, lead: Lead): string {
    return subject
      .replace(/{{business_name}}/g, lead.business_name)
      .replace(/{{contact_name}}/g, lead.contact_name || 'there');
  }
}

export function createSequenceEngine(config: {
  emailComposer: EmailComposer;
  sendEmail: SendEmailFunction;
  leadModel?: LeadModel;
  activityLogger?: ActivityLogger;
}): SequenceEngine {
  return new SequenceEngine(config);
}
