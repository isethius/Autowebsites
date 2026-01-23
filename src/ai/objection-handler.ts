import { getClaudeClient, ClaudeClient } from './claude-client';
import { WebsiteAnalysis } from './website-analyzer';
import { IndustryType } from './industry-templates';

export interface ObjectionResponse {
  objection: string;
  category: ObjectionCategory;
  response: string;
  followUpQuestion: string;
  proofPoints: string[];
  alternativeAngle: string;
}

export type ObjectionCategory =
  | 'price'
  | 'timing'
  | 'need'
  | 'trust'
  | 'competition'
  | 'satisfaction'
  | 'authority'
  | 'priority';

export interface CommonObjections {
  price: ObjectionResponse[];
  timing: ObjectionResponse[];
  need: ObjectionResponse[];
  trust: ObjectionResponse[];
  competition: ObjectionResponse[];
  satisfaction: ObjectionResponse[];
  authority: ObjectionResponse[];
  priority: ObjectionResponse[];
}

const COMMON_OBJECTIONS: Record<ObjectionCategory, string[]> = {
  price: [
    "It's too expensive",
    "We don't have the budget right now",
    "Can you do it for less?",
    "We got a cheaper quote elsewhere",
  ],
  timing: [
    "We're too busy right now",
    "Maybe next quarter",
    "This isn't a good time",
    "We have other priorities",
  ],
  need: [
    "We're happy with our current website",
    "Our website works fine",
    "We don't really need a new site",
    "We just updated our site recently",
  ],
  trust: [
    "How do I know you'll deliver?",
    "I've been burned by web designers before",
    "Can I see references?",
    "Why should I trust you?",
  ],
  competition: [
    "We're talking to other agencies",
    "We have an in-house person for this",
    "Our nephew does websites",
    "We use a DIY platform",
  ],
  satisfaction: [
    "What if I don't like it?",
    "What's your revision policy?",
    "What if it doesn't work out?",
    "Do you offer a guarantee?",
  ],
  authority: [
    "I need to talk to my partner",
    "I'm not the decision maker",
    "Let me discuss with my team",
    "I need to check with my boss",
  ],
  priority: [
    "It's not a priority right now",
    "We have bigger fish to fry",
    "Maybe when things slow down",
    "We're focused on other things",
  ],
};

export class ObjectionHandler {
  private client: ClaudeClient;
  private cachedResponses: Map<string, CommonObjections> = new Map();

  constructor(client?: ClaudeClient) {
    this.client = client || getClaudeClient();
  }

  async generateObjectionResponses(
    analysis: WebsiteAnalysis,
    senderCompany: string
  ): Promise<CommonObjections> {
    const cacheKey = `${analysis.businessName}-${analysis.industry}`;

    if (this.cachedResponses.has(cacheKey)) {
      return this.cachedResponses.get(cacheKey)!;
    }

    const systemPrompt = `You are a sales expert who handles objections with empathy and value-focused responses.

Key principles:
- Acknowledge the objection sincerely
- Don't be pushy or salesy
- Refocus on their specific business value
- Use their own issues against objections
- Ask smart follow-up questions
- Provide social proof when relevant

Business context:
- Name: ${analysis.businessName}
- Industry: ${analysis.industry}
- Score: ${analysis.overallScore}/10
- Top issues: ${analysis.issues.slice(0, 3).map(i => i.title).join(', ')}
- Potential impact: ${analysis.estimatedImpact.estimatedRevenueLoss}`;

    const allResponses: CommonObjections = {
      price: [],
      timing: [],
      need: [],
      trust: [],
      competition: [],
      satisfaction: [],
      authority: [],
      priority: [],
    };

    // Generate responses for each category in parallel
    const categories = Object.keys(COMMON_OBJECTIONS) as ObjectionCategory[];

    await Promise.all(
      categories.map(async (category) => {
        const objections = COMMON_OBJECTIONS[category];
        const responses = await this.generateCategoryResponses(
          category,
          objections,
          analysis,
          senderCompany,
          systemPrompt
        );
        allResponses[category] = responses;
      })
    );

    this.cachedResponses.set(cacheKey, allResponses);
    return allResponses;
  }

  async handleSpecificObjection(
    objection: string,
    analysis: WebsiteAnalysis,
    conversationContext?: string
  ): Promise<ObjectionResponse> {
    const systemPrompt = `You handle sales objections for web design services with empathy and value focus.

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Their issues: ${analysis.issues.slice(0, 3).map(i => i.title).join(', ')}
${conversationContext ? `Previous conversation: ${conversationContext}` : ''}`;

    const prompt = `The prospect just said: "${objection}"

Respond with JSON:
{
  "objection": "the objection restated",
  "category": "price|timing|need|trust|competition|satisfaction|authority|priority",
  "response": "empathetic, value-focused response (2-3 sentences)",
  "followUpQuestion": "smart question to keep conversation going",
  "proofPoints": ["2-3 relevant proof points or stats"],
  "alternativeAngle": "different way to approach if first response doesn't work"
}`;

    return this.client.analyzeJSON<ObjectionResponse>(prompt, {
      systemPrompt,
      maxTokens: 800,
    });
  }

  async generateROICalculator(analysis: WebsiteAnalysis): Promise<{
    currentState: string;
    projectedImprovement: string;
    monthlyValue: string;
    yearlyValue: string;
    paybackPeriod: string;
    assumptions: string[];
  }> {
    const prompt = `Create a simple ROI calculation for a website redesign for:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Current issues: ${analysis.issues.slice(0, 3).map(i => i.title).join(', ')}
Estimated impact: ${JSON.stringify(analysis.estimatedImpact)}

Return JSON with realistic but compelling numbers:
{
  "currentState": "what they're losing now (estimate)",
  "projectedImprovement": "% improvement expected",
  "monthlyValue": "monthly value of improvement",
  "yearlyValue": "yearly value",
  "paybackPeriod": "how fast investment pays off",
  "assumptions": ["list assumptions for credibility"]
}`;

    return this.client.analyzeJSON(prompt, { maxTokens: 600 });
  }

  getQuickResponse(category: ObjectionCategory, industry: IndustryType): string {
    const quickResponses: Record<ObjectionCategory, string> = {
      price: `I understand budget is always a consideration. What if I could show you how this pays for itself in the first few months through increased leads? Many ${industry} see 30-50% more inquiries after improving their online presence.`,

      timing: `Totally get it - you're busy running your business. The thing is, every month with an underperforming website is another month of potential customers going to competitors. What if we started with just a quick call to see what's possible?`,

      need: `That's fair, and I appreciate the directness. I actually found a few specific things that might be costing you customers - would you be open to a quick 10-minute call to share what I found? No obligation.`,

      trust: `Great question - you should definitely vet anyone you work with. I'd be happy to share some examples of other ${industry} we've helped, along with their contact info if you'd like to speak with them directly.`,

      competition: `Makes sense to explore options. What I can tell you is that we specialize specifically in ${industry} websites, so we understand your customers and what makes them convert. Would a quick comparison of approaches be helpful?`,

      satisfaction: `Absolutely - you should have confidence in what you're getting. We do unlimited revisions until you're happy, and we don't charge the final payment until you approve everything. Does that address your concern?`,

      authority: `Of course - important decisions should involve the right people. Would it help if I put together a quick one-page summary they could review? I can include the specific issues I found and projected ROI.`,

      priority: `I hear you - there's always a lot on the plate. Quick question though: if your website is currently turning away potential customers, isn't that worth 15 minutes to explore? The issues I found suggest you might be losing business to competitors.`,
    };

    return quickResponses[category];
  }

  private async generateCategoryResponses(
    category: ObjectionCategory,
    objections: string[],
    analysis: WebsiteAnalysis,
    senderCompany: string,
    systemPrompt: string
  ): Promise<ObjectionResponse[]> {
    const prompt = `Generate responses for these "${category}" objections:

${objections.map((o, i) => `${i + 1}. "${o}"`).join('\n')}

Company responding: ${senderCompany}
Their top 3 issues: ${analysis.issues.slice(0, 3).map(i => `${i.title}: ${i.businessImpact}`).join('; ')}

Return JSON array:
[
  {
    "objection": "the objection",
    "category": "${category}",
    "response": "empathetic response referencing their specific issues",
    "followUpQuestion": "question to advance conversation",
    "proofPoints": ["2 relevant stats or examples"],
    "alternativeAngle": "backup approach"
  }
]`;

    return this.client.analyzeJSON<ObjectionResponse[]>(prompt, {
      systemPrompt,
      maxTokens: 1500,
    });
  }
}

export function createObjectionHandler(client?: ClaudeClient): ObjectionHandler {
  return new ObjectionHandler(client);
}
