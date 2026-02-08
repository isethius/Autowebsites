/**
 * Lead Website Generator
 *
 * Generates custom website previews for leads using the DNA-powered site-builder
 * with full interaction layer (magnetic buttons, scroll reveals, counters, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { IndustryType } from '../ai/industry-templates';
import { PreviewContent, ColorPalette, PreviewGenerationResult } from '../overnight/types';
import { ContentGenerator, ContentGeneratorConfig, ContentGenerationResult } from './content-generator';
import { logger } from '../utils/logger';
import { buildWebsite, SiteContent, BuildOptions } from '../themes/engine/site-builder';
import { DNACode } from '../themes/variance-planner';

export interface LeadWebsiteGeneratorOptions {
  outputDir?: string;
  generateVariations?: number;
  includeContactForm?: boolean;
  /** Tier of designs: 'premium', 'basic', or 'both' */
  tier?: 'premium' | 'basic' | 'both';
  /** Content generator configuration for multi-model support */
  contentGeneratorConfig?: ContentGeneratorConfig;
}

export interface GeneratePreviewInput {
  leadId: string;
  businessName: string;
  industry: IndustryType;
  city?: string;
  state?: string;
  services?: string[];
  existingWebsiteUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Optional logo URL */
  logoUrl?: string;
  /** Nextdoor business page URL for data fetching */
  nextdoorUrl?: string;
  /** Whether to fetch real data from external sources */
  fetchRealData?: boolean;
}

/**
 * Vibe configurations for different variation styles
 * Each vibe produces a distinct look via DNA codes
 */
const VIBE_CONFIGS: Array<{
  id: string;
  name: string;
  description: string;
  palette: ColorPalette;
}> = [
  {
    id: 'trustworthy',
    name: 'Professional Trust',
    description: 'Clean, trustworthy design with blue tones',
    palette: {
      name: 'Professional Blue',
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
  {
    id: 'friendly',
    name: 'Warm & Friendly',
    description: 'Approachable design with warm green tones',
    palette: {
      name: 'Trust Green',
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
  {
    id: 'bold',
    name: 'Bold & Energetic',
    description: 'Dynamic design with vibrant orange',
    palette: {
      name: 'Warm Orange',
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#f97316',
      background: '#fffbeb',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
  {
    id: 'creative',
    name: 'Modern Creative',
    description: 'Contemporary design with purple accents',
    palette: {
      name: 'Modern Purple',
      primary: '#7c3aed',
      secondary: '#6d28d9',
      accent: '#8b5cf6',
      background: '#faf5ff',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant & Refined',
    description: 'Sophisticated design with dark tones',
    palette: {
      name: 'Elegant Dark',
      primary: '#1f2937',
      secondary: '#111827',
      accent: '#6b7280',
      background: '#f9fafb',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
  {
    id: 'artisan',
    name: 'Artisan Craft',
    description: 'Handcrafted feel with earthy tones',
    palette: {
      name: 'Earthy Brown',
      primary: '#92400e',
      secondary: '#78350f',
      accent: '#b45309',
      background: '#fffbeb',
      text: '#1f2937',
      muted: '#6b7280',
    },
  },
];

export class LeadWebsiteGenerator {
  private contentGenerator: ContentGenerator;
  private outputDir: string;
  private generateVariations: number;
  private includeContactForm: boolean;
  private tier: 'premium' | 'basic' | 'both';
  private lastContentResult?: ContentGenerationResult;

  constructor(options: LeadWebsiteGeneratorOptions = {}) {
    this.contentGenerator = new ContentGenerator(options.contentGeneratorConfig);
    this.outputDir = options.outputDir || 'tmp/autowebsites/previews';
    this.generateVariations = options.generateVariations ?? 4;
    this.includeContactForm = options.includeContactForm ?? true;
    this.tier = options.tier || 'basic';
  }

  /**
   * Get the last content generation result (for model tracking)
   */
  getLastContentResult(): ContentGenerationResult | undefined {
    return this.lastContentResult;
  }

  /**
   * Generate a website preview for a lead
   */
  async generate(input: GeneratePreviewInput): Promise<PreviewGenerationResult> {
    const result: PreviewGenerationResult = {
      success: false,
      files_created: [],
      local_path: '',
      deployed: false,
      deployed_url: null,
      design_variations: 0,
      error: undefined,
    };

    try {
      logger.info('Generating preview', {
        leadId: input.leadId,
        businessName: input.businessName,
        industry: input.industry,
      });

      // Create output directory
      const previewDir = path.join(
        this.outputDir,
        `${input.leadId}-${this.slugify(input.businessName)}`
      );
      fs.mkdirSync(previewDir, { recursive: true });
      result.local_path = previewDir;

      // Generate content using AI
      const contentResult = await this.contentGenerator.generateWithTracking({
        businessName: input.businessName,
        industry: input.industry,
        city: input.city,
        state: input.state,
        services: input.services,
        existingWebsiteUrl: input.existingWebsiteUrl,
        phone: input.phone,
        address: input.address,
      });
      this.lastContentResult = contentResult;
      const content = contentResult.content;

      // Log model usage if tracked
      if (contentResult.modelUsed) {
        logger.info('Content generated', {
          model: contentResult.modelUsed,
          taskType: contentResult.taskType,
        });
      }

      // Convert PreviewContent to SiteContent for site-builder
      const siteContent = this.convertToSiteContent(input, content);

      // Generate variations with different vibes
      const vibes = VIBE_CONFIGS.slice(0, this.generateVariations);
      const variationPaths: string[] = [];

      for (let i = 0; i < vibes.length; i++) {
        const vibe = vibes[i];
        const variationDir = path.join(previewDir, `variation-${i + 1}`);
        fs.mkdirSync(variationDir, { recursive: true });

        // Generate HTML using site-builder with DNA system
        const html = this.generateWithSiteBuilder(siteContent, vibe, i + 1);
        const htmlPath = path.join(variationDir, 'index.html');
        fs.writeFileSync(htmlPath, html);

        variationPaths.push(htmlPath);
        result.files_created.push(htmlPath);
      }

      // Generate main index with variation selector
      const indexHtml = this.generateIndexWithSelector(input, content, vibes);
      const indexPath = path.join(previewDir, 'index.html');
      fs.writeFileSync(indexPath, indexHtml);
      result.files_created.push(indexPath);

      // Generate vercel.json for deployment
      const vercelConfig = {
        version: 2,
        builds: [{ src: '**/*.html', use: '@vercel/static' }],
        routes: [{ src: '/(.*)', dest: '/$1' }],
      };
      const vercelPath = path.join(previewDir, 'vercel.json');
      fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
      result.files_created.push(vercelPath);

      result.success = true;
      result.design_variations = vibes.length;

      logger.info('Preview generated', {
        leadId: input.leadId,
        path: previewDir,
        variations: vibes.length,
      });

    } catch (error: any) {
      result.error = error.message;
      logger.error('Preview generation failed', { error: error.message });
    }

    return result;
  }

  /**
   * Convert PreviewContent to SiteContent format for site-builder
   */
  private convertToSiteContent(input: GeneratePreviewInput, content: PreviewContent): SiteContent {
    return {
      businessName: input.businessName,
      industry: input.industry,
      tagline: content.tagline,
      headline: content.headline,
      description: content.meta_description,
      services: content.services.map(s => ({
        name: s.name,
        description: s.description,
        icon: s.icon,
      })),
      testimonials: content.testimonials?.map(t => ({
        text: t.text,
        author: t.author,
        rating: t.rating,
      })),
      faqs: content.faqs?.map(f => ({
        question: f.question,
        answer: f.answer,
      })),
      stats: [
        { value: '500+', label: 'Projects Completed' },
        { value: '10+', label: 'Years Experience' },
        { value: '100%', label: 'Satisfaction Rate' },
        { value: '24/7', label: 'Support Available' },
      ],
      contact: {
        phone: input.phone,
        email: input.email,
        address: input.address,
        city: input.city,
        state: input.state,
      },
      logoUrl: input.logoUrl,
      primaryCTA: {
        text: content.cta_text || 'Get Started',
        href: '#contact',
      },
      secondaryCTA: {
        text: 'Learn More',
        href: '#services',
      },
    };
  }

  /**
   * Generate HTML using the DNA-powered site-builder
   */
  private generateWithSiteBuilder(
    siteContent: SiteContent,
    vibe: typeof VIBE_CONFIGS[0],
    variationNum: number
  ): string {
    const buildOptions: BuildOptions = {
      palette: vibe.palette,
      vibe: vibe.id,
      inlineStyles: true,
      includeFonts: true,
    };

    // Build the website using site-builder (includes interaction layer)
    let html = buildWebsite(siteContent, buildOptions);

    // Add preview banner at the top of body
    const previewBanner = `
  <div style="background: ${vibe.palette.primary}; color: white; text-align: center; padding: 12px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
    Preview - Variation ${variationNum}: ${vibe.name}
    <a href="../index.html" style="color: white; font-weight: 600; margin-left: 8px;">View other designs →</a>
  </div>`;

    // Insert preview banner after <body>
    html = html.replace('<body', '<body').replace(/<body[^>]*>/, match => match + previewBanner);

    return html;
  }

  /**
   * Generate main index with variation selector
   */
  private generateIndexWithSelector(
    input: GeneratePreviewInput,
    content: PreviewContent,
    vibes: typeof VIBE_CONFIGS
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Preview for ${this.escapeHtml(input.businessName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
    }
    .header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 32px 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 12px;
      color: #1f2937;
    }
    .header p {
      color: #6b7280;
      max-width: 600px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .option {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .option:hover {
      border-color: #3b82f6;
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .color-preview {
      height: 120px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
      position: relative;
      overflow: hidden;
    }
    .color-preview::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
    }
    .option h3 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #1f2937;
    }
    .option p {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .option .btn {
      display: block;
      background: #1f2937;
      color: white;
      text-align: center;
      padding: 14px;
      border-radius: 10px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .option:hover .btn {
      background: #3b82f6;
    }
    .features {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .feature {
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #4b5563;
    }
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 14px;
      background: white;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #3b82f6;
    }
    .footer p {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">Premium Previews</span>
    <h1>Website Preview for ${this.escapeHtml(input.businessName)}</h1>
    <p>I've created ${vibes.length} unique design variations for you. Each one includes scroll animations, hover effects, and mobile-responsive layouts. Click to preview!</p>
  </div>

  <div class="options">
    ${vibes.map((vibe, i) => `
    <a href="variation-${i + 1}/index.html" class="option">
      <div class="color-preview" style="background: linear-gradient(135deg, ${vibe.palette.primary} 0%, ${vibe.palette.accent} 100%);">
        ${vibe.name}
      </div>
      <h3>Variation ${i + 1}</h3>
      <p>${vibe.description}</p>
      <div class="features">
        <span class="feature">Scroll Animations</span>
        <span class="feature">Hover Effects</span>
        <span class="feature">Mobile Ready</span>
      </div>
      <span class="btn">View Design →</span>
    </a>
    `).join('')}
  </div>

  <div class="footer">
    <p>Like what you see? Reply to let me know your favorite, or if you'd like any changes!</p>
    <p>Created by <a href="https://showcasedesigns.com">Showcase Designs</a></p>
  </div>
</body>
</html>`;
  }

  /**
   * Slugify a string
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * Generate a preview for a lead (convenience function)
 */
export async function generatePreviewForLead(
  input: GeneratePreviewInput,
  options?: LeadWebsiteGeneratorOptions
): Promise<PreviewGenerationResult> {
  const generator = new LeadWebsiteGenerator(options);
  return generator.generate(input);
}
