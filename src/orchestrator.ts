import { LeadModel, Lead, CreateLeadInput } from './crm/lead-model';
import { PipelineManager } from './crm/pipeline-manager';
import { ActivityLogger } from './crm/activity-logger';
import { WebsiteAnalyzer, WebsiteAnalysis } from './ai/website-analyzer';
import { PitchGenerator, PitchEmail } from './ai/pitch-generator';
import { ProposalGenerator, ProposalConfig } from './crm/proposal-generator';
import { EmailComposer } from './email/composer';
import { SequenceEngine, SendEmailFunction } from './email/sequence-engine';
import { config, features } from './utils/config';
import { logger } from './utils/logger';

export interface OrchestratorConfig {
  senderName: string;
  senderCompany: string;
  senderEmail: string;
  sendEmail?: SendEmailFunction;
}

export interface DiscoveredBusiness {
  name: string;
  website: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface ProcessingResult {
  leadId: string;
  businessName: string;
  status: 'success' | 'partial' | 'failed';
  steps: {
    step: string;
    success: boolean;
    message?: string;
    data?: any;
  }[];
}

export class Orchestrator {
  private leadModel: LeadModel;
  private pipelineManager: PipelineManager;
  private activityLogger: ActivityLogger;
  private websiteAnalyzer?: WebsiteAnalyzer;
  private pitchGenerator?: PitchGenerator;
  private emailComposer: EmailComposer;
  private sequenceEngine?: SequenceEngine;
  private proposalConfig: ProposalConfig;
  private sendEmail?: SendEmailFunction;

  constructor(orchestratorConfig: OrchestratorConfig) {
    this.leadModel = new LeadModel();
    this.activityLogger = new ActivityLogger();
    this.pipelineManager = new PipelineManager(this.leadModel, this.activityLogger);

    this.emailComposer = new EmailComposer({
      senderName: orchestratorConfig.senderName,
      senderCompany: orchestratorConfig.senderCompany,
    });

    this.proposalConfig = {
      companyName: orchestratorConfig.senderCompany,
      companyEmail: orchestratorConfig.senderEmail,
      companyPhone: config.COMPANY_PHONE || '',
      companyAddress: config.COMPANY_ADDRESS || '',
    };

    this.sendEmail = orchestratorConfig.sendEmail;

    // Initialize AI features if available
    if (features.ai) {
      this.websiteAnalyzer = new WebsiteAnalyzer();
      this.pitchGenerator = new PitchGenerator();
    }

    // Initialize sequence engine if email is available
    if (this.sendEmail) {
      this.sequenceEngine = new SequenceEngine({
        emailComposer: this.emailComposer,
        sendEmail: this.sendEmail,
        leadModel: this.leadModel,
        activityLogger: this.activityLogger,
      });
    }
  }

  /**
   * Full pipeline: discover -> capture -> analyze -> personalize -> reach out
   */
  async processBusinesses(
    businesses: DiscoveredBusiness[],
    options: {
      analyzeWithAI?: boolean;
      generateGallery?: boolean;
      enrollInSequence?: string;
      sendInitialEmail?: boolean;
    } = {}
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (const business of businesses) {
      const result = await this.processSingleBusiness(business, options);
      results.push(result);

      // Small delay between businesses to be respectful
      await this.sleep(1000);
    }

    return results;
  }

  /**
   * Process a single business through the pipeline
   */
  async processSingleBusiness(
    business: DiscoveredBusiness,
    options: {
      analyzeWithAI?: boolean;
      generateGallery?: boolean;
      enrollInSequence?: string;
      sendInitialEmail?: boolean;
    } = {}
  ): Promise<ProcessingResult> {
    const steps: ProcessingResult['steps'] = [];
    let leadId: string | null = null;

    try {
      // Step 1: Check if lead already exists
      const existingLead = await this.leadModel.getByUrl(business.website);

      if (existingLead) {
        steps.push({
          step: 'check_existing',
          success: true,
          message: 'Lead already exists',
          data: { leadId: existingLead.id },
        });
        leadId = existingLead.id;
      } else {
        // Step 2: Create lead
        const leadInput: CreateLeadInput = {
          business_name: business.name,
          website_url: business.website,
          email: business.email,
          phone: business.phone,
          address: business.address,
          city: business.city,
          state: business.state,
        };

        const lead = await this.leadModel.create(leadInput);
        leadId = lead.id;

        steps.push({
          step: 'create_lead',
          success: true,
          message: 'Lead created',
          data: { leadId: lead.id },
        });
      }

      // Step 3: AI Analysis (if enabled)
      if (options.analyzeWithAI && this.websiteAnalyzer) {
        try {
          const analysis = await this.websiteAnalyzer.analyze({
            url: business.website,
          });

          await this.leadModel.update(leadId, {
            industry: analysis.industry,
            website_score: analysis.overallScore,
            ai_analysis: analysis,
            issues_found: analysis.issues.map(i => i.title),
            recommendations: analysis.recommendations.map(r => r.title),
          });

          steps.push({
            step: 'ai_analysis',
            success: true,
            message: `Analyzed: score ${analysis.overallScore}/10, ${analysis.issues.length} issues found`,
            data: { score: analysis.overallScore, industry: analysis.industry },
          });

          // Auto-qualify if score indicates opportunity
          await this.pipelineManager.autoQualify(leadId);
        } catch (error: any) {
          steps.push({
            step: 'ai_analysis',
            success: false,
            message: error.message,
          });
        }
      }

      // Step 4: Generate pitch (if AI available and email exists)
      let pitch: PitchEmail | null = null;
      if (this.pitchGenerator && business.email) {
        try {
          const lead = await this.leadModel.getById(leadId);
          if (lead?.ai_analysis) {
            pitch = await this.pitchGenerator.generatePitch({
              analysis: lead.ai_analysis as WebsiteAnalysis,
              senderName: this.proposalConfig.companyName,
              senderCompany: this.proposalConfig.companyName,
              previewUrl: lead.gallery_url || undefined,
            });

            steps.push({
              step: 'generate_pitch',
              success: true,
              message: 'Personalized pitch generated',
              data: { subjectLines: pitch.subjectLines },
            });
          }
        } catch (error: any) {
          steps.push({
            step: 'generate_pitch',
            success: false,
            message: error.message,
          });
        }
      }

      // Step 5: Send initial email or enroll in sequence
      if (business.email) {
        if (options.enrollInSequence && this.sequenceEngine) {
          try {
            await this.sequenceEngine.enrollLead(leadId, options.enrollInSequence);
            steps.push({
              step: 'enroll_sequence',
              success: true,
              message: 'Enrolled in email sequence',
            });
          } catch (error: any) {
            steps.push({
              step: 'enroll_sequence',
              success: false,
              message: error.message,
            });
          }
        } else if (options.sendInitialEmail && this.sendEmail && pitch) {
          try {
            const lead = await this.leadModel.getById(leadId);
            const composed = this.emailComposer.composeFromPitch(lead!, pitch);

            await this.sendEmail(
              business.email,
              composed.subject,
              composed.html,
              composed.text
            );

            await this.pipelineManager.markContacted(leadId);

            steps.push({
              step: 'send_email',
              success: true,
              message: 'Initial email sent',
            });
          } catch (error: any) {
            steps.push({
              step: 'send_email',
              success: false,
              message: error.message,
            });
          }
        }
      }

      // Determine overall status
      const hasFailures = steps.some(s => !s.success);
      const allFailed = steps.every(s => !s.success);

      return {
        leadId: leadId!,
        businessName: business.name,
        status: allFailed ? 'failed' : hasFailures ? 'partial' : 'success',
        steps,
      };
    } catch (error: any) {
      logger.error('Pipeline error', { business: business.name, error: error.message });

      return {
        leadId: leadId || 'unknown',
        businessName: business.name,
        status: 'failed',
        steps: [
          ...steps,
          { step: 'pipeline', success: false, message: error.message },
        ],
      };
    }
  }

  /**
   * Run a full E2E test
   */
  async runE2ETest(searchQuery: string): Promise<{
    success: boolean;
    steps: { name: string; status: string; details?: any }[];
  }> {
    const steps: { name: string; status: string; details?: any }[] = [];

    try {
      // Step 1: Create a test lead
      const testBusiness: DiscoveredBusiness = {
        name: 'E2E Test Business',
        website: 'https://example.com',
        email: 'test@example.com',
        city: searchQuery.split(' in ')[1]?.split(',')[0] || 'Austin',
        state: 'TX',
      };

      steps.push({ name: 'Create test data', status: 'pass' });

      // Step 2: Process through pipeline
      const result = await this.processSingleBusiness(testBusiness, {
        analyzeWithAI: features.ai,
      });

      steps.push({
        name: 'Process pipeline',
        status: result.status === 'failed' ? 'fail' : 'pass',
        details: result.steps,
      });

      // Step 3: Verify lead exists
      const lead = await this.leadModel.getById(result.leadId);
      steps.push({
        name: 'Verify lead created',
        status: lead ? 'pass' : 'fail',
        details: lead ? { id: lead.id, stage: lead.pipeline_stage } : undefined,
      });

      // Step 4: Check activity logged
      const activities = await this.activityLogger.getTimeline(result.leadId, { limit: 5 });
      steps.push({
        name: 'Verify activity logged',
        status: activities.length > 0 ? 'pass' : 'fail',
        details: { activityCount: activities.length },
      });

      // Clean up test lead
      await this.leadModel.delete(result.leadId);
      steps.push({ name: 'Cleanup test data', status: 'pass' });

      const allPassed = steps.every(s => s.status === 'pass');

      return { success: allPassed, steps };
    } catch (error: any) {
      steps.push({ name: 'E2E Test', status: 'fail', details: error.message });
      return { success: false, steps };
    }
  }

  /**
   * Get pipeline stats
   */
  async getStats() {
    const leadStats = await this.leadModel.getStats();
    const pipelineSummary = await this.pipelineManager.getPipelineSummary();
    const staleLeads = await this.pipelineManager.getStaleLeads();

    return {
      leads: leadStats,
      pipeline: pipelineSummary,
      staleCount: staleLeads.length,
      features: {
        ai: features.ai,
        email: features.email,
        payments: features.payments,
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createOrchestrator(config: OrchestratorConfig): Orchestrator {
  return new Orchestrator(config);
}
