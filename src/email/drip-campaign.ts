import { sendEmail, SendResult } from './sendgrid-client';
import { generateEmail, generateFollowUpEmail, EmailTemplate } from '../outreach/email-generator';
import { getLeadDatabase, Lead, LeadStatus } from '../outreach/lead-database';
import { WebsiteScore } from '../outreach/website-scorer';

export interface CampaignConfig {
  // Days after initial email to send follow-ups
  followUpDays: number[];
  // Max follow-ups to send
  maxFollowUps: number;
  // Sender info
  senderName: string;
  senderEmail: string;
  senderCompany: string;
  // Rate limiting
  maxEmailsPerHour: number;
  delayBetweenEmailsMs: number;
}

export interface CampaignStatus {
  leadId: string;
  emailsSent: number;
  lastSentAt?: string;
  nextScheduledAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'responded';
}

const DEFAULT_CONFIG: CampaignConfig = {
  followUpDays: [3, 7],  // Follow up at day 3 and day 7
  maxFollowUps: 2,
  senderName: 'Alex',
  senderEmail: process.env.SENDGRID_FROM_EMAIL || 'hello@example.com',
  senderCompany: 'WebDesign Pro',
  maxEmailsPerHour: 50,
  delayBetweenEmailsMs: 2000
};

// In-memory campaign state (in production, store in database)
const campaignStates: Map<string, CampaignStatus> = new Map();

export async function startCampaign(
  lead: Lead,
  previewUrl: string,
  score?: WebsiteScore,
  config: Partial<CampaignConfig> = {}
): Promise<SendResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  if (!lead.email) {
    return { success: false, error: 'Lead has no email address' };
  }

  // Generate initial email
  const emailTemplate = generateEmail({
    lead,
    score,
    previewUrl,
    senderName: fullConfig.senderName,
    senderCompany: fullConfig.senderCompany
  });

  // Send initial email
  const result = await sendEmail({
    to: lead.email,
    from: fullConfig.senderEmail,
    fromName: fullConfig.senderName,
    subject: emailTemplate.subject,
    text: emailTemplate.body,
    html: emailTemplate.html,
    categories: ['autowebsites', 'initial'],
    customArgs: {
      lead_id: lead.id || 'unknown',
      campaign_type: 'initial'
    }
  });

  if (result.success) {
    // Update campaign state
    const status: CampaignStatus = {
      leadId: lead.id!,
      emailsSent: 1,
      lastSentAt: new Date().toISOString(),
      nextScheduledAt: calculateNextFollowUp(fullConfig.followUpDays, 0),
      status: 'in_progress'
    };
    campaignStates.set(lead.id!, status);

    // Update lead status in database
    try {
      const db = getLeadDatabase();
      await db.updateLeadStatus(lead.id!, 'contacted');
    } catch (e) {
      // Database might not be configured
    }

    console.log(`✅ Campaign started for ${lead.business_name || lead.website_url}`);
  }

  return result;
}

export async function sendFollowUp(
  lead: Lead,
  previewUrl: string,
  attemptNumber: number,
  config: Partial<CampaignConfig> = {}
): Promise<SendResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  if (!lead.email) {
    return { success: false, error: 'Lead has no email address' };
  }

  if (attemptNumber > fullConfig.maxFollowUps) {
    return { success: false, error: 'Max follow-ups reached' };
  }

  // Generate follow-up email
  const emailTemplate = generateFollowUpEmail(
    {
      lead,
      previewUrl,
      senderName: fullConfig.senderName,
      senderCompany: fullConfig.senderCompany
    },
    attemptNumber
  );

  // Send follow-up
  const result = await sendEmail({
    to: lead.email,
    from: fullConfig.senderEmail,
    fromName: fullConfig.senderName,
    subject: emailTemplate.subject,
    text: emailTemplate.body,
    html: emailTemplate.html,
    categories: ['autowebsites', 'followup', `followup-${attemptNumber}`],
    customArgs: {
      lead_id: lead.id || 'unknown',
      campaign_type: 'followup',
      followup_number: attemptNumber.toString()
    }
  });

  if (result.success) {
    // Update campaign state
    const status = campaignStates.get(lead.id!) || {
      leadId: lead.id!,
      emailsSent: 0,
      status: 'in_progress' as const
    };

    status.emailsSent++;
    status.lastSentAt = new Date().toISOString();

    if (attemptNumber >= fullConfig.maxFollowUps) {
      status.status = 'completed';
      status.nextScheduledAt = undefined;
    } else {
      status.nextScheduledAt = calculateNextFollowUp(fullConfig.followUpDays, attemptNumber);
    }

    campaignStates.set(lead.id!, status);

    console.log(`✅ Follow-up #${attemptNumber} sent to ${lead.business_name || lead.website_url}`);
  }

  return result;
}

export async function processPendingFollowUps(config: Partial<CampaignConfig> = {}): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const db = getLeadDatabase();
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let errors = 0;

  console.log('\n📬 Processing pending follow-ups...\n');

  for (const [leadId, status] of campaignStates.entries()) {
    if (status.status !== 'in_progress' || !status.nextScheduledAt) {
      continue;
    }

    const scheduledTime = new Date(status.nextScheduledAt);
    if (scheduledTime > now) {
      continue;
    }

    processed++;

    try {
      const lead = await db.getLead(leadId);
      if (!lead) {
        console.log(`  ⚠️ Lead ${leadId} not found`);
        continue;
      }

      // Check if lead has responded (status would be updated externally)
      if (lead.status === 'responded' || lead.status === 'converted') {
        status.status = 'responded';
        console.log(`  ⏭️ ${lead.business_name} has responded, skipping`);
        continue;
      }

      const attemptNumber = status.emailsSent;
      const result = await sendFollowUp(
        lead,
        lead.gallery_url || 'https://example.com/preview',
        attemptNumber,
        fullConfig
      );

      if (result.success) {
        sent++;
      } else {
        errors++;
        console.log(`  ❌ Failed: ${result.error}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, fullConfig.delayBetweenEmailsMs));

    } catch (err: any) {
      errors++;
      console.error(`  ❌ Error processing ${leadId}: ${err.message}`);
    }
  }

  console.log(`\n📊 Follow-up Summary: ${processed} processed, ${sent} sent, ${errors} errors`);

  return { processed, sent, errors };
}

export function getCampaignStatus(leadId: string): CampaignStatus | undefined {
  return campaignStates.get(leadId);
}

export function getAllCampaignStatuses(): CampaignStatus[] {
  return Array.from(campaignStates.values());
}

export function pauseCampaign(leadId: string): boolean {
  const status = campaignStates.get(leadId);
  if (status && status.status === 'in_progress') {
    status.status = 'paused';
    return true;
  }
  return false;
}

export function resumeCampaign(leadId: string): boolean {
  const status = campaignStates.get(leadId);
  if (status && status.status === 'paused') {
    status.status = 'in_progress';
    return true;
  }
  return false;
}

export function markAsResponded(leadId: string): boolean {
  const status = campaignStates.get(leadId);
  if (status) {
    status.status = 'responded';
    return true;
  }
  return false;
}

function calculateNextFollowUp(followUpDays: number[], currentAttempt: number): string | undefined {
  if (currentAttempt >= followUpDays.length) {
    return undefined;
  }

  const daysUntilNext = followUpDays[currentAttempt];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysUntilNext);

  return nextDate.toISOString();
}

export async function runCampaignForLeads(
  leads: Lead[],
  getPreviewUrl: (lead: Lead) => string,
  config: Partial<CampaignConfig> = {}
): Promise<{ started: number; failed: number }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let started = 0;
  let failed = 0;

  console.log(`\n🚀 Starting campaigns for ${leads.length} leads...\n`);

  for (const lead of leads) {
    if (!lead.email) {
      console.log(`  ⏭️ ${lead.business_name || lead.website_url}: No email, skipping`);
      failed++;
      continue;
    }

    const previewUrl = getPreviewUrl(lead);
    const result = await startCampaign(lead, previewUrl, undefined, fullConfig);

    if (result.success) {
      started++;
    } else {
      failed++;
      console.log(`  ❌ ${lead.business_name || lead.website_url}: ${result.error}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, fullConfig.delayBetweenEmailsMs));
  }

  console.log(`\n📊 Campaign Summary: ${started} started, ${failed} failed`);

  return { started, failed };
}

// CLI entry point
if (require.main === module) {
  const action = process.argv[2] || 'status';

  switch (action) {
    case 'status':
      const statuses = getAllCampaignStatuses();
      console.log(`\n📊 Campaign Statuses (${statuses.length} active):\n`);
      for (const s of statuses) {
        console.log(`  ${s.leadId.slice(0, 8)}: ${s.status} (${s.emailsSent} sent)`);
        if (s.nextScheduledAt) {
          console.log(`    Next: ${s.nextScheduledAt}`);
        }
      }
      break;

    case 'process':
      processPendingFollowUps().then(result => {
        console.log('\nDone!');
      });
      break;

    default:
      console.log('Usage: npx tsx src/email/drip-campaign.ts [status|process]');
  }
}
