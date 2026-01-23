import { getClaudeClient, ClaudeClient } from './claude-client';
import { getIndustryTemplate, IndustryType, INDUSTRIES } from './industry-templates';

export interface WebsiteAnalysis {
  // Business identification
  businessName: string;
  industry: IndustryType;
  industryConfidence: number; // 0-100
  businessType: 'local' | 'regional' | 'national' | 'ecommerce';
  targetAudience: string;

  // Website quality assessment
  overallScore: number; // 1-10

  // Specific issues found
  issues: WebsiteIssue[];

  // Strengths to acknowledge
  strengths: string[];

  // Recommendations
  recommendations: Recommendation[];

  // Estimated business impact
  estimatedImpact: {
    currentMonthlyVisitors: string;
    potentialIncrease: string;
    estimatedRevenueLoss: string;
  };

  // Key talking points for outreach
  talkingPoints: string[];

  // Raw analysis metadata
  analyzedAt: string;
  analysisVersion: string;
}

export interface WebsiteIssue {
  category: 'design' | 'mobile' | 'performance' | 'seo' | 'ux' | 'content' | 'trust' | 'conversion';
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  businessImpact: string;
  fixDifficulty: 'easy' | 'medium' | 'hard';
}

export interface Recommendation {
  priority: number; // 1-5, 1 being highest
  title: string;
  description: string;
  expectedOutcome: string;
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

interface AnalyzeOptions {
  html?: string;
  screenshotBase64?: string;
  url: string;
  existingScores?: {
    design: number;
    mobile: number;
    performance: number;
    seo: number;
  };
}

export class WebsiteAnalyzer {
  private client: ClaudeClient;

  constructor(client?: ClaudeClient) {
    this.client = client || getClaudeClient();
  }

  async analyze(options: AnalyzeOptions): Promise<WebsiteAnalysis> {
    const { html, url, existingScores } = options;

    // Build context for Claude
    const htmlSnippet = html ? this.extractRelevantHTML(html) : 'HTML not provided';
    const scoresContext = existingScores
      ? `Existing automated scores: Design: ${existingScores.design}/10, Mobile: ${existingScores.mobile}/10, Performance: ${existingScores.performance}/10, SEO: ${existingScores.seo}/10`
      : '';

    const systemPrompt = `You are an expert website analyst and digital marketing consultant. Analyze websites to identify business opportunities and issues that affect their online success.

Your analysis should be:
- Specific and actionable, not generic
- Focused on business impact, not just technical issues
- Empathetic to small business owners who may not understand tech jargon
- Honest but constructive - acknowledge strengths too

Industries you commonly see: ${INDUSTRIES.join(', ')}`;

    const prompt = `Analyze this website and provide a detailed assessment.

URL: ${url}
${scoresContext}

HTML Content (excerpt):
${htmlSnippet}

Provide your analysis as a JSON object with this structure:
{
  "businessName": "detected business name",
  "industry": "one of: ${INDUSTRIES.join(', ')}",
  "industryConfidence": 0-100,
  "businessType": "local|regional|national|ecommerce",
  "targetAudience": "description of their target customers",
  "overallScore": 1-10,
  "issues": [
    {
      "category": "design|mobile|performance|seo|ux|content|trust|conversion",
      "severity": "critical|major|minor",
      "title": "short title",
      "description": "detailed description",
      "businessImpact": "how this affects their business",
      "fixDifficulty": "easy|medium|hard"
    }
  ],
  "strengths": ["list of positive things about the site"],
  "recommendations": [
    {
      "priority": 1-5,
      "title": "recommendation title",
      "description": "what to do",
      "expectedOutcome": "what will improve",
      "timeframe": "immediate|short-term|long-term"
    }
  ],
  "estimatedImpact": {
    "currentMonthlyVisitors": "estimate based on site quality",
    "potentialIncrease": "percentage potential improvement",
    "estimatedRevenueLoss": "rough estimate of missed revenue due to issues"
  },
  "talkingPoints": ["3-5 key points to mention when reaching out to this business"]
}

Be specific to THIS business - reference their actual content, services, and industry. Identify at least 3-5 issues and 3-5 recommendations.`;

    const analysis = await this.client.analyzeJSON<Omit<WebsiteAnalysis, 'analyzedAt' | 'analysisVersion'>>(prompt, {
      systemPrompt,
      maxTokens: 3000,
    });

    // Validate and enhance with industry template
    const validatedIndustry = this.validateIndustry(analysis.industry);
    const template = getIndustryTemplate(validatedIndustry);

    // Add industry-specific insights if missing
    const enhancedAnalysis: WebsiteAnalysis = {
      ...analysis,
      industry: validatedIndustry,
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.0',
      // Ensure we have talking points
      talkingPoints: analysis.talkingPoints?.length
        ? analysis.talkingPoints
        : template.keyTalkingPoints.slice(0, 5),
    };

    return enhancedAnalysis;
  }

  async detectIndustry(html: string, url: string): Promise<{ industry: IndustryType; confidence: number }> {
    const snippet = this.extractRelevantHTML(html, 2000);

    const prompt = `Based on this website content, identify the business industry.

URL: ${url}
Content: ${snippet}

Respond with JSON: { "industry": "one of: ${INDUSTRIES.join(', ')}", "confidence": 0-100 }`;

    return this.client.analyzeJSON<{ industry: IndustryType; confidence: number }>(prompt, {
      maxTokens: 100,
    });
  }

  async generateQuickSummary(analysis: WebsiteAnalysis): Promise<string> {
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
    const majorIssues = analysis.issues.filter(i => i.severity === 'major');

    const prompt = `Write a 2-3 sentence summary of this website analysis for a busy business owner:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Score: ${analysis.overallScore}/10
Critical issues: ${criticalIssues.length}
Major issues: ${majorIssues.length}
Top issues: ${analysis.issues.slice(0, 3).map(i => i.title).join(', ')}

Keep it friendly, non-technical, and focused on business impact.`;

    const result = await this.client.complete(prompt, { maxTokens: 200 });
    return result.content;
  }

  private extractRelevantHTML(html: string, maxLength: number = 5000): string {
    // Remove script and style content
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ');

    // Extract key sections
    const sections: string[] = [];

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) sections.push(`Title: ${titleMatch[1]}`);

    // Meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) sections.push(`Description: ${descMatch[1]}`);

    // H1s
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
    if (h1Matches) sections.push(`H1s: ${h1Matches.slice(0, 3).map(h => h.replace(/<[^>]+>/g, '')).join(', ')}`);

    // Navigation links
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
    if (navMatch) {
      const links = navMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi);
      if (links) sections.push(`Navigation: ${links.slice(0, 10).map(l => l.replace(/<[^>]+>/g, '')).join(', ')}`);
    }

    // Footer (often has business info)
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    if (footerMatch) {
      const footerText = footerMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push(`Footer: ${footerText.substring(0, 500)}`);
    }

    // Main content
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<div[^>]+(?:class|id)=["'][^"']*(?:content|main)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (mainMatch) {
      const mainText = mainMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push(`Main Content: ${mainText.substring(0, 2000)}`);
    }

    const result = sections.join('\n\n');
    return result.substring(0, maxLength);
  }

  private validateIndustry(detected: string): IndustryType {
    const normalized = detected.toLowerCase().trim();

    // Direct match
    if (INDUSTRIES.includes(normalized as IndustryType)) {
      return normalized as IndustryType;
    }

    // Fuzzy matching
    const mappings: Record<string, IndustryType> = {
      'plumbing': 'plumbers',
      'legal': 'lawyers',
      'law': 'lawyers',
      'attorney': 'lawyers',
      'dental': 'dentists',
      'dentistry': 'dentists',
      'food': 'restaurants',
      'dining': 'restaurants',
      'hair': 'salons',
      'beauty': 'salons',
      'spa': 'salons',
      'medical': 'doctors',
      'healthcare': 'doctors',
      'physician': 'doctors',
      'construction': 'contractors',
      'builder': 'contractors',
      'building': 'contractors',
      'heating': 'hvac',
      'cooling': 'hvac',
      'air conditioning': 'hvac',
      'accounting': 'accountants',
      'tax': 'accountants',
      'cpa': 'accountants',
      'real estate': 'realtors',
      'realtor': 'realtors',
      'property': 'realtors',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return 'other';
  }
}

export function createWebsiteAnalyzer(client?: ClaudeClient): WebsiteAnalyzer {
  return new WebsiteAnalyzer(client);
}
