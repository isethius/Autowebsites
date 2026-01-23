import { LeadModel, Lead, PipelineStage, PIPELINE_STAGES } from './lead-model';
import { ActivityLogger, ActivityType } from './activity-logger';

export interface StageTransition {
  from: PipelineStage;
  to: PipelineStage;
  allowedConditions?: TransitionCondition[];
  autoActions?: AutoAction[];
}

export interface TransitionCondition {
  type: 'has_email' | 'has_analysis' | 'has_gallery' | 'has_proposal' | 'emails_sent_min' | 'custom';
  value?: any;
  customCheck?: (lead: Lead) => boolean;
}

export interface AutoAction {
  type: 'send_email' | 'create_task' | 'add_tag' | 'notify' | 'custom';
  config?: any;
  customAction?: (lead: Lead) => Promise<void>;
}

export interface PipelineConfig {
  transitions: StageTransition[];
  stageTimeouts: Partial<Record<PipelineStage, number>>; // Days before alert
  autoQualifyScore: number; // Auto-qualify leads above this score
}

const DEFAULT_TRANSITIONS: StageTransition[] = [
  // From new
  { from: 'new', to: 'qualified' },
  { from: 'new', to: 'lost' },

  // From qualified
  {
    from: 'qualified',
    to: 'contacted',
    allowedConditions: [{ type: 'has_email' }],
  },
  { from: 'qualified', to: 'lost' },

  // From contacted
  { from: 'contacted', to: 'proposal_sent' },
  { from: 'contacted', to: 'qualified' }, // Back to qualified if no response
  { from: 'contacted', to: 'lost' },

  // From proposal_sent
  { from: 'proposal_sent', to: 'negotiating' },
  { from: 'proposal_sent', to: 'won' },
  { from: 'proposal_sent', to: 'lost' },

  // From negotiating
  { from: 'negotiating', to: 'won' },
  { from: 'negotiating', to: 'lost' },

  // Allow reactivation
  { from: 'lost', to: 'new' },
];

const DEFAULT_STAGE_TIMEOUTS: Partial<Record<PipelineStage, number>> = {
  new: 7, // 7 days to qualify
  qualified: 3, // 3 days to contact
  contacted: 7, // 7 days for response
  proposal_sent: 14, // 14 days for decision
  negotiating: 30, // 30 days to close
};

export class PipelineManager {
  private leadModel: LeadModel;
  private activityLogger: ActivityLogger;
  private config: PipelineConfig;

  constructor(
    leadModel?: LeadModel,
    activityLogger?: ActivityLogger,
    config?: Partial<PipelineConfig>
  ) {
    this.leadModel = leadModel || new LeadModel();
    this.activityLogger = activityLogger || new ActivityLogger();
    this.config = {
      transitions: config?.transitions || DEFAULT_TRANSITIONS,
      stageTimeouts: config?.stageTimeouts || DEFAULT_STAGE_TIMEOUTS,
      autoQualifyScore: config?.autoQualifyScore || 4, // Score 4 or below = opportunity
    };
  }

  async moveToStage(
    leadId: string,
    newStage: PipelineStage,
    options: { reason?: string; userId?: string; skipValidation?: boolean } = {}
  ): Promise<Lead> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const oldStage = lead.pipeline_stage;

    // Validate transition
    if (!options.skipValidation && !this.isValidTransition(oldStage, newStage)) {
      throw new Error(`Invalid transition from ${oldStage} to ${newStage}`);
    }

    // Check conditions
    const transition = this.getTransition(oldStage, newStage);
    if (transition?.allowedConditions) {
      const unmetConditions = this.checkConditions(lead, transition.allowedConditions);
      if (unmetConditions.length > 0) {
        throw new Error(`Transition conditions not met: ${unmetConditions.join(', ')}`);
      }
    }

    // Update lead
    const updatedLead = await this.leadModel.update(leadId, {
      pipeline_stage: newStage,
    });

    // Log activity
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'stage_change',
      title: `Stage changed: ${oldStage} → ${newStage}`,
      description: options.reason || `Lead moved from ${oldStage} to ${newStage}`,
      metadata: { from_stage: oldStage, to_stage: newStage },
      user_id: options.userId,
    });

    // Execute auto actions
    if (transition?.autoActions) {
      await this.executeAutoActions(updatedLead, transition.autoActions);
    }

    return updatedLead;
  }

  async autoQualify(leadId: string): Promise<Lead | null> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) return null;

    // Check if should auto-qualify
    if (
      lead.pipeline_stage === 'new' &&
      lead.website_score !== null &&
      lead.website_score <= this.config.autoQualifyScore
    ) {
      return this.moveToStage(leadId, 'qualified', {
        reason: `Auto-qualified: website score ${lead.website_score}/10 indicates opportunity`,
      });
    }

    return lead;
  }

  async markContacted(leadId: string, emailId?: string): Promise<Lead> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Move to contacted if currently qualified
    if (lead.pipeline_stage === 'qualified') {
      return this.moveToStage(leadId, 'contacted', {
        reason: emailId ? `Email sent: ${emailId}` : 'Contacted via email',
      });
    }

    // Just log the contact if already contacted
    await this.activityLogger.log({
      lead_id: leadId,
      type: 'email_sent',
      title: 'Follow-up email sent',
      metadata: { email_id: emailId },
    });

    await this.leadModel.recordEmailSent(leadId);
    return lead;
  }

  async markProposalSent(leadId: string, proposalUrl: string): Promise<Lead> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Update with proposal URL
    await this.leadModel.update(leadId, { proposal_url: proposalUrl });

    // Move to proposal_sent
    if (['qualified', 'contacted'].includes(lead.pipeline_stage)) {
      return this.moveToStage(leadId, 'proposal_sent', {
        reason: `Proposal sent: ${proposalUrl}`,
      });
    }

    return lead;
  }

  async closeWon(leadId: string, value: number, notes?: string): Promise<Lead> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const updatedLead = await this.leadModel.markWon(leadId, value);

    await this.activityLogger.log({
      lead_id: leadId,
      type: 'deal_won',
      title: `Deal won: $${value.toLocaleString()}`,
      description: notes,
      metadata: { value },
    });

    return updatedLead;
  }

  async closeLost(leadId: string, reason: string): Promise<Lead> {
    const lead = await this.leadModel.getById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const updatedLead = await this.leadModel.markLost(leadId, reason);

    await this.activityLogger.log({
      lead_id: leadId,
      type: 'deal_lost',
      title: 'Deal lost',
      description: reason,
      metadata: { reason },
    });

    return updatedLead;
  }

  async getStaleLeads(): Promise<{ lead: Lead; daysInStage: number; timeoutDays: number }[]> {
    const staleLeads: { lead: Lead; daysInStage: number; timeoutDays: number }[] = [];

    for (const [stage, timeoutDays] of Object.entries(this.config.stageTimeouts)) {
      if (!timeoutDays) continue;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeoutDays);

      const { leads } = await this.leadModel.list({
        pipeline_stage: stage as PipelineStage,
      });

      for (const lead of leads) {
        const stageDate = new Date(lead.stage_changed_at);
        if (stageDate < cutoffDate) {
          const daysInStage = Math.floor(
            (Date.now() - stageDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          staleLeads.push({ lead, daysInStage, timeoutDays });
        }
      }
    }

    return staleLeads.sort((a, b) => b.daysInStage - a.daysInStage);
  }

  async getPipelineSummary(): Promise<{
    stages: { stage: PipelineStage; count: number; value: number }[];
    totalValue: number;
    conversionRate: number;
    avgTimeToClose: number;
  }> {
    const stats = await this.leadModel.getStats();

    const stages = PIPELINE_STAGES.map(stage => ({
      stage,
      count: stats.by_stage[stage],
      value: 0, // Would need to calculate from won_value projections
    }));

    const wonCount = stats.by_stage.won;
    const lostCount = stats.by_stage.lost;
    const totalClosed = wonCount + lostCount;

    return {
      stages,
      totalValue: stats.won_value_this_month,
      conversionRate: totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0,
      avgTimeToClose: 0, // Would need historical data
    };
  }

  getNextStages(currentStage: PipelineStage): PipelineStage[] {
    return this.config.transitions
      .filter(t => t.from === currentStage)
      .map(t => t.to);
  }

  isValidTransition(from: PipelineStage, to: PipelineStage): boolean {
    return this.config.transitions.some(t => t.from === from && t.to === to);
  }

  private getTransition(from: PipelineStage, to: PipelineStage): StageTransition | undefined {
    return this.config.transitions.find(t => t.from === from && t.to === to);
  }

  private checkConditions(lead: Lead, conditions: TransitionCondition[]): string[] {
    const unmet: string[] = [];

    for (const condition of conditions) {
      switch (condition.type) {
        case 'has_email':
          if (!lead.email) unmet.push('Email required');
          break;
        case 'has_analysis':
          if (!lead.ai_analysis) unmet.push('AI analysis required');
          break;
        case 'has_gallery':
          if (!lead.gallery_url) unmet.push('Theme gallery required');
          break;
        case 'has_proposal':
          if (!lead.proposal_url) unmet.push('Proposal required');
          break;
        case 'emails_sent_min':
          if (lead.emails_sent < (condition.value || 1)) {
            unmet.push(`At least ${condition.value} emails must be sent`);
          }
          break;
        case 'custom':
          if (condition.customCheck && !condition.customCheck(lead)) {
            unmet.push('Custom condition not met');
          }
          break;
      }
    }

    return unmet;
  }

  private async executeAutoActions(lead: Lead, actions: AutoAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'add_tag':
            if (action.config?.tag) {
              await this.leadModel.addTag(lead.id, action.config.tag);
            }
            break;
          case 'custom':
            if (action.customAction) {
              await action.customAction(lead);
            }
            break;
          // Other actions would be implemented with their respective services
        }
      } catch (error) {
        console.error(`Failed to execute auto action ${action.type}:`, error);
      }
    }
  }
}

export function createPipelineManager(
  leadModel?: LeadModel,
  activityLogger?: ActivityLogger
): PipelineManager {
  return new PipelineManager(leadModel, activityLogger);
}
