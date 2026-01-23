import PDFDocument from 'pdfkit';
import { Lead } from './lead-model';
import { Proposal, PricingTier } from './proposal-generator';
import * as fs from 'fs';
import * as path from 'path';

export interface ContractConfig {
  companyName: string;
  companyLegalName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  paymentTerms?: string;
  cancellationPolicy?: string;
  warrantyPeriod?: number; // days
}

export interface Contract {
  id: string;
  lead_id: string;
  proposal_id: string;
  created_at: string;

  // Parties
  client_name: string;
  client_email: string;
  client_address: string;

  // Terms
  selected_tier: PricingTier;
  total_amount: number;
  deposit_amount: number;
  payment_schedule: PaymentMilestone[];

  // Scope
  scope_of_work: string[];
  deliverables: string[];
  timeline: string;
  start_date: string;
  estimated_completion: string;

  // Status
  pdf_url?: string;
  signed_at?: string;
  signed_by?: string;
}

export interface PaymentMilestone {
  name: string;
  amount: number;
  percentage: number;
  due: string;
  description: string;
}

const DEFAULT_PAYMENT_SCHEDULE = [
  { name: 'Deposit', percentage: 50, description: 'Due upon contract signing' },
  { name: 'Final Payment', percentage: 50, description: 'Due upon project completion' },
];

export class ContractGenerator {
  private config: ContractConfig;
  private outputDir: string;

  constructor(config: ContractConfig, outputDir?: string) {
    this.config = {
      paymentTerms: 'Net 15',
      cancellationPolicy: '30 days written notice',
      warrantyPeriod: 90,
      ...config,
    };
    this.outputDir = outputDir || path.join(process.cwd(), 'contracts');

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generate(
    lead: Lead,
    proposal: Proposal,
    selectedTierName: string,
    options: {
      customScope?: string[];
      depositPercent?: number;
      startDate?: string;
    } = {}
  ): Promise<{ contract: Contract; pdfPath: string }> {
    const selectedTier = proposal.pricing_tiers.find(t => t.name === selectedTierName);
    if (!selectedTier) {
      throw new Error(`Tier not found: ${selectedTierName}`);
    }

    const { depositPercent = 50, startDate } = options;
    const projectStartDate = startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const estimatedWeeks = this.parseTimeline(selectedTier.timeline);
    const estimatedCompletion = new Date(
      new Date(projectStartDate).getTime() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Generate payment schedule
    const paymentSchedule: PaymentMilestone[] = [
      {
        name: 'Deposit',
        amount: Math.round(selectedTier.price * (depositPercent / 100)),
        percentage: depositPercent,
        due: 'Upon signing',
        description: 'Due upon contract signing to begin work',
      },
      {
        name: 'Final Payment',
        amount: Math.round(selectedTier.price * ((100 - depositPercent) / 100)),
        percentage: 100 - depositPercent,
        due: 'Upon completion',
        description: 'Due upon project approval and launch',
      },
    ];

    const contract: Contract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lead_id: lead.id,
      proposal_id: proposal.id,
      created_at: new Date().toISOString(),

      client_name: lead.contact_name || lead.business_name,
      client_email: lead.email || '',
      client_address: [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', '),

      selected_tier: selectedTier,
      total_amount: selectedTier.price,
      deposit_amount: paymentSchedule[0].amount,
      payment_schedule: paymentSchedule,

      scope_of_work: options.customScope || this.generateScope(selectedTier, proposal),
      deliverables: this.generateDeliverables(selectedTier),
      timeline: selectedTier.timeline,
      start_date: projectStartDate,
      estimated_completion: estimatedCompletion,
    };

    const pdfPath = await this.generatePDF(contract, lead);

    return { contract, pdfPath };
  }

  private generateScope(tier: PricingTier, proposal: Proposal): string[] {
    const scope: string[] = [
      `Complete website redesign and development (${tier.name} package)`,
      'Discovery and planning phase including stakeholder interviews',
      'Custom design mockups with revision rounds',
      'Responsive development for all devices',
      'Content migration from existing website',
      'Quality assurance and cross-browser testing',
      'Launch support and training',
    ];

    // Add features from tier
    for (const feature of tier.features.slice(0, 5)) {
      if (!scope.some(s => s.toLowerCase().includes(feature.toLowerCase()))) {
        scope.push(feature);
      }
    }

    // Add solutions from proposal
    for (const solution of proposal.solutions_proposed.slice(0, 3)) {
      scope.push(`Implementation: ${solution}`);
    }

    return scope;
  }

  private generateDeliverables(tier: PricingTier): string[] {
    const deliverables: string[] = [
      'Fully functional website deployed to production',
      'Mobile-responsive design files',
      'Admin access and training documentation',
      'Performance optimization report',
      'SEO baseline setup',
    ];

    if (tier.name === 'Professional' || tier.name === 'Enterprise') {
      deliverables.push('Google Analytics and Search Console setup');
      deliverables.push('Social media integration');
    }

    if (tier.name === 'Enterprise') {
      deliverables.push('Custom functionality as specified');
      deliverables.push('CRM/third-party integrations');
      deliverables.push('Content creation assistance');
      deliverables.push('Training sessions (recorded)');
    }

    return deliverables;
  }

  private parseTimeline(timeline: string): number {
    // Parse "2-3 weeks" format
    const match = timeline.match(/(\d+)-?(\d+)?\s*weeks?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return Math.ceil((min + max) / 2);
    }
    return 4; // Default to 4 weeks
  }

  private async generatePDF(contract: Contract, lead: Lead): Promise<string> {
    const doc = new PDFDocument({ size: 'letter', margin: 50 });
    const fileName = `contract_${lead.business_name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Title
    doc
      .fontSize(20)
      .text('Website Development Agreement', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#666')
      .text(`Contract ID: ${contract.id}`, { align: 'center' })
      .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(1);

    // Parties
    doc
      .fontSize(14)
      .fillColor('#000')
      .text('Parties')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .text(`This Agreement is entered into between:`)
      .moveDown(0.3);

    doc
      .text(`Provider: ${this.config.companyLegalName}`)
      .text(`Address: ${this.config.companyAddress}`)
      .text(`Email: ${this.config.companyEmail}`)
      .moveDown(0.5);

    doc
      .text(`Client: ${contract.client_name}`)
      .text(`Business: ${lead.business_name}`)
      .text(`Email: ${contract.client_email}`)
      .text(`Address: ${contract.client_address || 'To be provided'}`)
      .moveDown(1);

    // Project Summary
    doc
      .fontSize(14)
      .text('Project Summary')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Package: ${contract.selected_tier.name}`)
      .text(`Total Investment: $${contract.total_amount.toLocaleString()}`)
      .text(`Timeline: ${contract.timeline}`)
      .text(`Estimated Start: ${new Date(contract.start_date).toLocaleDateString()}`)
      .text(`Estimated Completion: ${new Date(contract.estimated_completion).toLocaleDateString()}`)
      .moveDown(1);

    // Scope of Work
    doc
      .fontSize(14)
      .text('Scope of Work')
      .moveDown(0.3);

    doc.fontSize(10);
    for (const item of contract.scope_of_work) {
      doc.text(`• ${item}`, { indent: 20 }).moveDown(0.2);
    }
    doc.moveDown(0.5);

    // Deliverables
    doc
      .fontSize(14)
      .text('Deliverables')
      .moveDown(0.3);

    doc.fontSize(10);
    for (const item of contract.deliverables) {
      doc.text(`• ${item}`, { indent: 20 }).moveDown(0.2);
    }
    doc.moveDown(0.5);

    // Payment Schedule
    doc
      .fontSize(14)
      .text('Payment Schedule')
      .moveDown(0.3);

    doc.fontSize(10);
    for (const milestone of contract.payment_schedule) {
      doc
        .text(`${milestone.name}: $${milestone.amount.toLocaleString()} (${milestone.percentage}%)`)
        .text(`   Due: ${milestone.due}`, { indent: 20 })
        .moveDown(0.3);
    }
    doc.moveDown(0.5);

    // Terms - New page
    doc.addPage();

    doc
      .fontSize(14)
      .text('Terms and Conditions')
      .moveDown(0.3);

    const terms = [
      `1. PAYMENT TERMS: ${this.config.paymentTerms}. Late payments may incur a 1.5% monthly fee.`,
      `2. REVISIONS: This agreement includes up to 3 rounds of design revisions. Additional revisions will be billed at $150/hour.`,
      `3. CONTENT: Client is responsible for providing all content (text, images, logos) within 14 days of project start.`,
      `4. TIMELINE: Timelines are estimates based on timely client feedback. Delays in content or feedback may extend the project.`,
      `5. OWNERSHIP: Upon full payment, Client receives full ownership of all custom work. Provider retains rights to display work in portfolio.`,
      `6. WARRANTY: Provider warrants the website will function as specified for ${this.config.warrantyPeriod} days after launch.`,
      `7. HOSTING: This agreement does not include ongoing hosting or maintenance unless specified in the package.`,
      `8. CANCELLATION: ${this.config.cancellationPolicy}. Deposit is non-refundable after design work begins.`,
      `9. LIABILITY: Provider's liability is limited to the total amount paid under this agreement.`,
      `10. GOVERNING LAW: This agreement is governed by the laws of the state where Provider is located.`,
    ];

    doc.fontSize(9);
    for (const term of terms) {
      doc.text(term).moveDown(0.3);
    }

    // Signature section
    doc.moveDown(1);
    doc
      .fontSize(14)
      .text('Agreement')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .text('By signing below, both parties agree to the terms outlined in this agreement.')
      .moveDown(1);

    // Client signature
    doc.text('Client:').moveDown(0.3);
    doc.text('Signature: ____________________________     Date: ____________').moveDown(0.3);
    doc.text(`Name: ${contract.client_name}`).moveDown(1);

    // Provider signature
    doc.text('Provider:').moveDown(0.3);
    doc.text('Signature: ____________________________     Date: ____________').moveDown(0.3);
    doc.text(`Name: ${this.config.companyName}`);

    doc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return filePath;
  }

  generateSimpleAgreement(
    lead: Lead,
    tier: PricingTier
  ): string {
    return `
WEBSITE DEVELOPMENT AGREEMENT

This agreement confirms the engagement between ${this.config.companyName} ("Provider")
and ${lead.business_name} ("Client") for website development services.

PROJECT: ${tier.name} Website Package
INVESTMENT: $${tier.price.toLocaleString()}
TIMELINE: ${tier.timeline}

INCLUDED:
${tier.features.map(f => `  • ${f}`).join('\n')}

PAYMENT:
  • 50% deposit due upon signing: $${Math.round(tier.price * 0.5).toLocaleString()}
  • 50% balance due upon completion: $${Math.round(tier.price * 0.5).toLocaleString()}

To proceed, please reply "APPROVED" to this email along with your preferred start date.

${this.config.companyName}
${this.config.companyEmail}
${this.config.companyPhone}
`.trim();
  }
}

export function createContractGenerator(config: ContractConfig): ContractGenerator {
  return new ContractGenerator(config);
}
