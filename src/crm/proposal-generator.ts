import PDFDocument from 'pdfkit';
import { Lead } from './lead-model';
import { WebsiteAnalysis } from '../ai/website-analyzer';
import { getIndustryTemplate } from '../ai/industry-templates';
import * as fs from 'fs';
import * as path from 'path';

export interface ProposalConfig {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  timeline: string;
}

export interface Proposal {
  id: string;
  lead_id: string;
  created_at: string;
  valid_until: string;

  // Content
  executive_summary: string;
  problems_identified: string[];
  solutions_proposed: string[];
  pricing_tiers: PricingTier[];
  selected_tier?: string;

  // Metadata
  pdf_url?: string;
  viewed_at?: string;
  signed_at?: string;
}

const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    name: 'Essential',
    price: 2500,
    description: 'Perfect for businesses that need a professional online presence',
    features: [
      'Custom 5-page responsive website',
      'Mobile-optimized design',
      'Basic SEO setup',
      'Contact form integration',
      'Google Analytics setup',
      '30 days of support',
    ],
    timeline: '2-3 weeks',
  },
  {
    name: 'Professional',
    price: 5000,
    description: 'Comprehensive solution for growing businesses',
    features: [
      'Custom 10-page responsive website',
      'Advanced mobile optimization',
      'Full SEO optimization',
      'Contact forms & scheduling',
      'Google Analytics & Search Console',
      'Social media integration',
      'Speed optimization',
      '90 days of support',
    ],
    recommended: true,
    timeline: '3-4 weeks',
  },
  {
    name: 'Enterprise',
    price: 10000,
    description: 'Full-service digital transformation',
    features: [
      'Unlimited pages',
      'Custom functionality',
      'E-commerce integration',
      'Complete SEO strategy',
      'Content creation assistance',
      'CRM integration',
      'Training sessions',
      '1 year of support',
      'Monthly maintenance included',
    ],
    timeline: '4-6 weeks',
  },
];

export class ProposalGenerator {
  private config: ProposalConfig;
  private outputDir: string;

  constructor(config: ProposalConfig, outputDir?: string) {
    this.config = {
      primaryColor: '#2563eb',
      accentColor: '#1e40af',
      ...config,
    };
    this.outputDir = outputDir || path.join(process.cwd(), 'proposals');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generate(
    lead: Lead,
    analysis: WebsiteAnalysis,
    options: {
      customPricing?: PricingTier[];
      validDays?: number;
      discountPercent?: number;
    } = {}
  ): Promise<{ proposal: Proposal; pdfPath: string }> {
    const { customPricing, validDays = 30, discountPercent } = options;

    const pricingTiers = customPricing || this.generateCustomPricing(analysis);

    // Apply discount if specified
    if (discountPercent && discountPercent > 0) {
      for (const tier of pricingTiers) {
        tier.price = Math.round(tier.price * (1 - discountPercent / 100));
      }
    }

    const proposal: Proposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lead_id: lead.id,
      created_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: this.generateExecutiveSummary(lead, analysis),
      problems_identified: analysis.issues.slice(0, 5).map(i => `${i.title}: ${i.businessImpact}`),
      solutions_proposed: analysis.recommendations.slice(0, 5).map(r => r.title),
      pricing_tiers: pricingTiers,
    };

    // Generate PDF
    const pdfPath = await this.generatePDF(proposal, lead, analysis);

    return { proposal, pdfPath };
  }

  private generateCustomPricing(analysis: WebsiteAnalysis): PricingTier[] {
    const template = getIndustryTemplate(analysis.industry);
    const baseMultiplier = this.getComplexityMultiplier(analysis);
    const { min, max } = template.averageProjectValue;

    // Adjust pricing based on analysis
    const baseTiers = JSON.parse(JSON.stringify(DEFAULT_PRICING_TIERS)) as PricingTier[];

    // Scale prices
    baseTiers[0].price = Math.round((min * 0.8) * baseMultiplier / 100) * 100;
    baseTiers[1].price = Math.round(((min + max) / 2) * baseMultiplier / 100) * 100;
    baseTiers[2].price = Math.round((max * 1.2) * baseMultiplier / 100) * 100;

    // Add industry-specific features
    if (analysis.industry === 'restaurants') {
      baseTiers[1].features.push('Online menu integration');
      baseTiers[2].features.push('Online ordering system');
    } else if (analysis.industry === 'dentists' || analysis.industry === 'doctors') {
      baseTiers[1].features.push('HIPAA-compliant forms');
      baseTiers[2].features.push('Patient portal integration');
    } else if (analysis.industry === 'realtors') {
      baseTiers[1].features.push('IDX/MLS integration');
      baseTiers[2].features.push('Property search functionality');
    }

    return baseTiers;
  }

  private getComplexityMultiplier(analysis: WebsiteAnalysis): number {
    let multiplier = 1.0;

    // More issues = more work
    if (analysis.issues.length > 5) multiplier += 0.1;
    if (analysis.issues.length > 10) multiplier += 0.1;

    // Critical issues need more attention
    const criticalCount = analysis.issues.filter(i => i.severity === 'critical').length;
    multiplier += criticalCount * 0.05;

    // Lower scores mean more work
    if (analysis.overallScore < 4) multiplier += 0.2;
    else if (analysis.overallScore < 6) multiplier += 0.1;

    return Math.min(multiplier, 1.5); // Cap at 50% increase
  }

  private generateExecutiveSummary(lead: Lead, analysis: WebsiteAnalysis): string {
    const template = getIndustryTemplate(analysis.industry);
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');

    return `Thank you for the opportunity to present this proposal for ${lead.business_name}.

After a thorough analysis of your current website, we've identified ${analysis.issues.length} areas for improvement${criticalIssues.length > 0 ? `, including ${criticalIssues.length} critical issues that may be costing you customers` : ''}.

${template.valueProposition}

Our analysis shows that ${analysis.estimatedImpact.estimatedRevenueLoss}. With the right improvements, we believe we can help you achieve ${analysis.estimatedImpact.potentialIncrease} improvement in your online performance.

The following pages detail our findings and proposed solutions.`;
  }

  private async generatePDF(
    proposal: Proposal,
    lead: Lead,
    analysis: WebsiteAnalysis
  ): Promise<string> {
    const doc = new PDFDocument({ size: 'letter', margin: 50 });
    const fileName = `proposal_${lead.business_name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(24)
      .fillColor(this.config.primaryColor!)
      .text('Website Redesign Proposal', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor('#333')
      .text(`Prepared for: ${lead.business_name}`, { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(12)
      .fillColor('#666')
      .text(`Prepared by: ${this.config.companyName}`, { align: 'center' })
      .text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { align: 'center' })
      .moveDown(2);

    // Executive Summary
    doc
      .fontSize(16)
      .fillColor(this.config.primaryColor!)
      .text('Executive Summary')
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor('#333')
      .text(proposal.executive_summary, { align: 'justify' })
      .moveDown(1.5);

    // Problems Identified
    doc
      .fontSize(16)
      .fillColor(this.config.primaryColor!)
      .text('Issues Identified')
      .moveDown(0.5);

    for (const problem of proposal.problems_identified) {
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`• ${problem}`, { indent: 20 })
        .moveDown(0.3);
    }
    doc.moveDown(1);

    // Solutions
    doc
      .fontSize(16)
      .fillColor(this.config.primaryColor!)
      .text('Proposed Solutions')
      .moveDown(0.5);

    for (const solution of proposal.solutions_proposed) {
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`• ${solution}`, { indent: 20 })
        .moveDown(0.3);
    }
    doc.moveDown(1);

    // New page for pricing
    doc.addPage();

    // Pricing
    doc
      .fontSize(18)
      .fillColor(this.config.primaryColor!)
      .text('Investment Options', { align: 'center' })
      .moveDown(1);

    for (const tier of proposal.pricing_tiers) {
      // Tier box
      const boxY = doc.y;

      if (tier.recommended) {
        doc
          .fontSize(10)
          .fillColor(this.config.accentColor!)
          .text('RECOMMENDED', { align: 'center' })
          .moveDown(0.3);
      }

      doc
        .fontSize(14)
        .fillColor(this.config.primaryColor!)
        .text(tier.name, { align: 'center' })
        .moveDown(0.2);

      doc
        .fontSize(24)
        .fillColor('#333')
        .text(`$${tier.price.toLocaleString()}`, { align: 'center' })
        .moveDown(0.2);

      doc
        .fontSize(10)
        .fillColor('#666')
        .text(tier.description, { align: 'center' })
        .text(`Timeline: ${tier.timeline}`, { align: 'center' })
        .moveDown(0.5);

      // Features
      for (const feature of tier.features) {
        doc
          .fontSize(10)
          .fillColor('#333')
          .text(`✓ ${feature}`, { align: 'center' })
          .moveDown(0.2);
      }

      doc.moveDown(1);
    }

    // Valid until
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(`This proposal is valid until ${new Date(proposal.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor('#333')
      .text(this.config.companyName, { align: 'center' })
      .text(`${this.config.companyEmail} | ${this.config.companyPhone}`, { align: 'center' });

    doc.end();

    // Wait for write to complete
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return filePath;
  }

  async generateQuickQuote(
    analysis: WebsiteAnalysis,
    options: { tier?: 'Essential' | 'Professional' | 'Enterprise'; discountPercent?: number } = {}
  ): Promise<{
    tier: string;
    price: number;
    originalPrice?: number;
    features: string[];
    timeline: string;
  }> {
    const pricing = this.generateCustomPricing(analysis);
    const tierName = options.tier || 'Professional';
    const tier = pricing.find(t => t.name === tierName) || pricing[1];

    const originalPrice = tier.price;
    if (options.discountPercent) {
      tier.price = Math.round(tier.price * (1 - options.discountPercent / 100));
    }

    return {
      tier: tier.name,
      price: tier.price,
      originalPrice: options.discountPercent ? originalPrice : undefined,
      features: tier.features,
      timeline: tier.timeline,
    };
  }
}

export function createProposalGenerator(config: ProposalConfig): ProposalGenerator {
  return new ProposalGenerator(config);
}
