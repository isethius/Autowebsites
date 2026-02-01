/**
 * Content Generator
 *
 * Uses Claude to generate personalized website content for leads.
 */

import { getClaudeClient, ClaudeClient } from '../ai/claude-client';
import { IndustryType, getIndustryTemplate } from '../ai/industry-templates';
import { PreviewContent } from '../overnight/types';
import { logger } from '../utils/logger';

export interface ContentGenerationInput {
  businessName: string;
  industry: IndustryType;
  city?: string;
  state?: string;
  services?: string[];
  existingWebsiteUrl?: string;
  phone?: string;
  address?: string;
}

export class ContentGenerator {
  private claude: ClaudeClient;

  constructor() {
    this.claude = getClaudeClient();
  }

  /**
   * Generate website content for a lead
   */
  async generate(input: ContentGenerationInput): Promise<PreviewContent> {
    const industryTemplate = getIndustryTemplate(input.industry);
    const location = [input.city, input.state].filter(Boolean).join(', ') || 'the local area';

    const prompt = this.buildPrompt(input, industryTemplate, location);

    logger.debug('Generating content', { businessName: input.businessName, industry: input.industry });

    try {
      const result = await this.claude.analyzeJSON<PreviewContent>(prompt, {
        systemPrompt: `You are a professional copywriter specializing in websites for local businesses.
Generate compelling, professional website content that is:
- Trustworthy and credible
- Local-focused and personal
- Action-oriented with clear CTAs
- Specific to the industry and location

Respond ONLY with valid JSON matching the requested schema.`,
        maxTokens: 2000,
      });

      return this.validateAndCleanContent(result, input);
    } catch (error: any) {
      logger.error('Content generation failed', { error: error.message });
      // Return fallback content
      return this.generateFallbackContent(input, industryTemplate, location);
    }
  }

  /**
   * Build the generation prompt
   */
  private buildPrompt(
    input: ContentGenerationInput,
    industryTemplate: ReturnType<typeof getIndustryTemplate>,
    location: string
  ): string {
    const services = input.services?.length
      ? input.services
      : industryTemplate.commonServices;

    return `Generate professional website content for this business:

BUSINESS DETAILS:
- Name: ${input.businessName}
- Industry: ${industryTemplate.displayName}
- Location: ${location}
- Services: ${services.join(', ')}
${input.existingWebsiteUrl ? `- Current Website: ${input.existingWebsiteUrl} (needs improvement)` : '- No current website'}
${input.phone ? `- Phone: ${input.phone}` : ''}

INDUSTRY CONTEXT:
- Value Proposition: ${industryTemplate.valueProposition}
- Key Trust Signals: ${industryTemplate.trustSignals.join(', ')}
- Conversion Factors: ${industryTemplate.conversionFactors.join(', ')}

Generate content in this exact JSON format:
{
  "headline": "A compelling headline (6-10 words) that speaks to the target customer's needs",
  "tagline": "A short tagline (10-15 words) emphasizing trust and local expertise",
  "about": "Two paragraphs about the business - first paragraph about their commitment to customers, second about their expertise and experience. Professional but warm tone. About 150 words total.",
  "services": [
    {
      "name": "Service name",
      "description": "2-3 sentences describing this service and its benefits to customers"
    }
  ],
  "cta_text": "Call-to-action button text (3-5 words)",
  "contact_text": "A brief paragraph encouraging visitors to reach out (2-3 sentences)",
  "meta_description": "SEO meta description (150-160 characters) including location and key services"
}

Generate 3-4 services based on the industry.
Make the content specific to ${input.businessName} and ${location}.
Use professional, trustworthy language without being salesy.`;
  }

  /**
   * Validate and clean generated content
   */
  private validateAndCleanContent(
    content: PreviewContent,
    input: ContentGenerationInput
  ): PreviewContent {
    // Ensure all required fields exist
    const validated: PreviewContent = {
      headline: content.headline || `Your Trusted ${input.industry} in ${input.city || 'the Area'}`,
      tagline: content.tagline || `Professional service you can count on`,
      about: content.about || this.generateDefaultAbout(input),
      services: content.services?.length ? content.services : this.generateDefaultServices(input),
      cta_text: content.cta_text || 'Get a Free Quote',
      contact_text: content.contact_text || `Contact ${input.businessName} today to discuss your needs.`,
      meta_description: content.meta_description || `${input.businessName} provides professional ${input.industry} services in ${input.city || 'your area'}. Contact us today!`,
    };

    // Clean up any template markers
    validated.headline = validated.headline.replace(/\{\{.*?\}\}/g, '');
    validated.tagline = validated.tagline.replace(/\{\{.*?\}\}/g, '');

    return validated;
  }

  /**
   * Generate fallback content if Claude fails
   */
  private generateFallbackContent(
    input: ContentGenerationInput,
    industryTemplate: ReturnType<typeof getIndustryTemplate>,
    location: string
  ): PreviewContent {
    return {
      headline: `Your Trusted ${industryTemplate.displayName} in ${input.city || 'the Area'}`,
      tagline: `Professional, reliable service from a local team you can trust`,
      about: this.generateDefaultAbout(input),
      services: this.generateDefaultServices(input, industryTemplate),
      cta_text: 'Get Started Today',
      contact_text: `Ready to get started? Contact ${input.businessName} today and let us show you why local customers trust us for their ${industryTemplate.displayName.toLowerCase()} needs.`,
      meta_description: `${input.businessName} - Professional ${industryTemplate.displayName.toLowerCase()} in ${location}. Quality service, trusted by local customers.`,
    };
  }

  /**
   * Generate default about text
   */
  private generateDefaultAbout(input: ContentGenerationInput): string {
    const location = [input.city, input.state].filter(Boolean).join(', ') || 'the local area';

    return `At ${input.businessName}, we're dedicated to providing exceptional service to our customers in ${location}. We understand that choosing the right service provider is important, which is why we focus on delivering quality work, transparent communication, and reliable results every time.

Our team brings years of experience and a commitment to customer satisfaction that sets us apart. Whether you're a first-time customer or a returning client, you can count on us to treat your needs with the attention and care they deserve. We're proud to be part of this community and look forward to serving you.`;
  }

  /**
   * Generate default services
   */
  private generateDefaultServices(
    input: ContentGenerationInput,
    industryTemplate?: ReturnType<typeof getIndustryTemplate>
  ): PreviewContent['services'] {
    const template = industryTemplate || getIndustryTemplate(input.industry);

    return template.commonServices.slice(0, 4).map(service => ({
      name: service,
      description: `Professional ${service.toLowerCase()} services tailored to your specific needs. Our experienced team ensures quality results and customer satisfaction.`,
    }));
  }
}

/**
 * Generate content for a lead (convenience function)
 */
export async function generateContentForLead(input: ContentGenerationInput): Promise<PreviewContent> {
  const generator = new ContentGenerator();
  return generator.generate(input);
}
