import { getClaudeClient, ClaudeClient } from './claude-client';
import { WebsiteAnalysis } from './website-analyzer';
import { getIndustryTemplate, IndustryType } from './industry-templates';

export interface PitchEmail {
  subjectLines: string[]; // Multiple options for A/B testing
  preheader: string; // Email preview text
  greeting: string;
  openingHook: string;
  problemStatement: string;
  solutionPreview: string;
  socialProof: string;
  callToAction: string;
  closing: string;
  signature: string;

  // Full composed versions
  htmlBody: string;
  plainTextBody: string;

  // Metadata
  tone: 'friendly' | 'professional' | 'urgent';
  estimatedReadTime: string;
  personalizationScore: number; // 0-100, how personalized vs template
}

export interface PitchOptions {
  analysis: WebsiteAnalysis;
  senderName: string;
  senderCompany: string;
  previewUrl?: string; // Link to theme preview gallery
  tone?: 'friendly' | 'professional' | 'urgent';
  includeDiscount?: boolean;
  discountPercent?: number;
  urgencyDeadline?: string;
}

export class PitchGenerator {
  private client: ClaudeClient;

  constructor(client?: ClaudeClient) {
    this.client = client || getClaudeClient();
  }

  async generatePitch(options: PitchOptions): Promise<PitchEmail> {
    const {
      analysis,
      senderName,
      senderCompany,
      previewUrl,
      tone = 'friendly',
      includeDiscount = false,
      discountPercent = 15,
      urgencyDeadline,
    } = options;

    const template = getIndustryTemplate(analysis.industry);
    const topIssues = analysis.issues.slice(0, 3);
    const topRecommendation = analysis.recommendations[0];

    const systemPrompt = `You are an expert copywriter specializing in B2B outreach for web design services.
Write compelling, personalized emails that get responses.

Key principles:
- Lead with THEIR problems, not your services
- Be specific - reference actual issues found on their site
- Keep it concise - busy business owners skim
- Sound human, not like a sales robot
- Create curiosity to drive clicks
- Use industry-specific language when appropriate

Industry context for ${analysis.industry}:
- Value proposition: ${template.valueProposition}
- Common pain points: ${template.painPoints.join(', ')}
- Key talking points: ${template.keyTalkingPoints.join(', ')}`;

    const prompt = `Generate a personalized outreach email for this business:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Website Score: ${analysis.overallScore}/10
Target Audience: ${analysis.targetAudience}

Top Issues Found:
${topIssues.map((issue, i) => `${i + 1}. ${issue.title} (${issue.severity}): ${issue.description}`).join('\n')}

Strengths to Acknowledge: ${analysis.strengths.slice(0, 2).join(', ')}

Key Recommendation: ${topRecommendation?.title || 'Modern redesign'}

Sender: ${senderName} from ${senderCompany}
${previewUrl ? `Preview URL: ${previewUrl}` : ''}
Tone: ${tone}
${includeDiscount ? `Include ${discountPercent}% discount offer` : ''}
${urgencyDeadline ? `Urgency deadline: ${urgencyDeadline}` : ''}

Create a JSON response:
{
  "subjectLines": ["3-4 different subject lines for A/B testing - make them curiosity-driven"],
  "preheader": "preview text that appears after subject in inbox",
  "greeting": "personalized greeting",
  "openingHook": "1-2 sentences that hook them immediately - reference something specific about their business",
  "problemStatement": "2-3 sentences identifying the specific issues on THEIR site and the business impact",
  "solutionPreview": "2-3 sentences about how you can help - mention the preview if URL provided",
  "socialProof": "1-2 sentences of credibility (use industry-specific stats)",
  "callToAction": "clear, low-commitment CTA",
  "closing": "friendly closing line",
  "signature": "professional signature with name and company",
  "tone": "${tone}",
  "estimatedReadTime": "estimated read time",
  "personalizationScore": 0-100
}

Make it sound natural and human. Reference their actual business name, issues, and industry throughout.`;

    const pitchData = await this.client.analyzeJSON<Omit<PitchEmail, 'htmlBody' | 'plainTextBody'>>(prompt, {
      systemPrompt,
      maxTokens: 2000,
    });

    // Compose full email bodies
    const plainTextBody = this.composePlainText(pitchData);
    const htmlBody = this.composeHTML(pitchData, previewUrl);

    return {
      ...pitchData,
      plainTextBody,
      htmlBody,
    };
  }

  async generateFollowUp(
    originalPitch: PitchEmail,
    analysis: WebsiteAnalysis,
    followUpNumber: number,
    daysSinceFirst: number
  ): Promise<PitchEmail> {
    const systemPrompt = `You write follow-up emails for web design outreach.
Follow-up #${followUpNumber} (${daysSinceFirst} days since first email).

Key principles:
- Don't repeat the whole pitch
- Reference the previous email briefly
- Add new value or angle
- Increase urgency slightly
- Keep it shorter than the first email`;

    const prompt = `Write follow-up email #${followUpNumber}:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Original subject: "${originalPitch.subjectLines[0]}"
Days since first email: ${daysSinceFirst}

Create shorter follow-up with same JSON structure. New angle, don't repeat yourself.`;

    const pitchData = await this.client.analyzeJSON<Omit<PitchEmail, 'htmlBody' | 'plainTextBody'>>(prompt, {
      systemPrompt,
      maxTokens: 1500,
    });

    const plainTextBody = this.composePlainText(pitchData);
    const htmlBody = this.composeHTML(pitchData);

    return {
      ...pitchData,
      plainTextBody,
      htmlBody,
    };
  }

  async generateSubjectLineVariations(
    analysis: WebsiteAnalysis,
    count: number = 5
  ): Promise<string[]> {
    const prompt = `Generate ${count} email subject lines for outreach to:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Top Issue: ${analysis.issues[0]?.title}
Score: ${analysis.overallScore}/10

Create subject lines that:
- Create curiosity
- Are personalized to this business
- Are under 50 characters when possible
- Don't sound spammy
- Avoid ALL CAPS or excessive punctuation

Return as JSON array: ["subject1", "subject2", ...]`;

    return this.client.analyzeJSON<string[]>(prompt, { maxTokens: 500 });
  }

  private composePlainText(pitch: Omit<PitchEmail, 'htmlBody' | 'plainTextBody'>): string {
    return `${pitch.greeting}

${pitch.openingHook}

${pitch.problemStatement}

${pitch.solutionPreview}

${pitch.socialProof}

${pitch.callToAction}

${pitch.closing}

${pitch.signature}`;
  }

  private composeHTML(
    pitch: Omit<PitchEmail, 'htmlBody' | 'plainTextBody'>,
    previewUrl?: string
  ): string {
    const ctaWithLink = previewUrl
      ? pitch.callToAction.replace(
          /(preview|look|see|check)/i,
          `<a href="${previewUrl}" style="color: #2563eb; text-decoration: underline;">$1</a>`
        )
      : pitch.callToAction;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p style="margin-bottom: 16px;">${pitch.greeting}</p>

  <p style="margin-bottom: 16px;">${pitch.openingHook}</p>

  <p style="margin-bottom: 16px;">${pitch.problemStatement}</p>

  <p style="margin-bottom: 16px;">${pitch.solutionPreview}</p>

  ${previewUrl ? `
  <p style="margin-bottom: 16px; text-align: center;">
    <a href="${previewUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Your Free Preview</a>
  </p>
  ` : ''}

  <p style="margin-bottom: 16px; font-style: italic; color: #666;">${pitch.socialProof}</p>

  <p style="margin-bottom: 16px;">${ctaWithLink}</p>

  <p style="margin-bottom: 16px;">${pitch.closing}</p>

  <p style="margin-bottom: 0; white-space: pre-line;">${pitch.signature}</p>
</body>
</html>`;
  }
}

export function createPitchGenerator(client?: ClaudeClient): PitchGenerator {
  return new PitchGenerator(client);
}
