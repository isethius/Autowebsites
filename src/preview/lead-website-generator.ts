/**
 * Lead Website Generator
 *
 * Generates custom website previews for leads using industry templates
 * and Claude-generated content.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IndustryType } from '../ai/industry-templates';
import { PreviewContent, ColorPalette, PreviewGenerationResult } from '../overnight/types';
import { ContentGenerator, ContentGenerationInput } from './content-generator';
import { logger } from '../utils/logger';

export interface LeadWebsiteGeneratorOptions {
  outputDir?: string;
  generateVariations?: number;
  includeContactForm?: boolean;
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
}

/**
 * Color palettes for different styles
 */
const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Professional Blue',
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Green',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Warm Orange',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#f97316',
    background: '#fffbeb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Purple',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#8b5cf6',
    background: '#faf5ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export class LeadWebsiteGenerator {
  private contentGenerator: ContentGenerator;
  private outputDir: string;
  private generateVariations: number;
  private includeContactForm: boolean;

  constructor(options: LeadWebsiteGeneratorOptions = {}) {
    this.contentGenerator = new ContentGenerator();
    this.outputDir = options.outputDir || 'tmp/autowebsites/previews';
    this.generateVariations = options.generateVariations ?? 4;
    this.includeContactForm = options.includeContactForm ?? true;
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

      // Generate content using Claude
      const content = await this.contentGenerator.generate({
        businessName: input.businessName,
        industry: input.industry,
        city: input.city,
        state: input.state,
        services: input.services,
        existingWebsiteUrl: input.existingWebsiteUrl,
        phone: input.phone,
        address: input.address,
      });

      // Generate variations with different color palettes
      const palettes = COLOR_PALETTES.slice(0, this.generateVariations);
      const variationPaths: string[] = [];

      for (let i = 0; i < palettes.length; i++) {
        const palette = palettes[i];
        const variationDir = path.join(previewDir, `variation-${i + 1}`);
        fs.mkdirSync(variationDir, { recursive: true });

        // Generate HTML
        const html = this.generateHTML(input, content, palette, i + 1);
        const htmlPath = path.join(variationDir, 'index.html');
        fs.writeFileSync(htmlPath, html);

        variationPaths.push(htmlPath);
        result.files_created.push(htmlPath);
      }

      // Generate main index with variation selector
      const indexHtml = this.generateIndexWithSelector(input, content, palettes);
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
      result.design_variations = palettes.length;

      logger.info('Preview generated', {
        leadId: input.leadId,
        path: previewDir,
        variations: palettes.length,
      });

    } catch (error: any) {
      result.error = error.message;
      logger.error('Preview generation failed', { error: error.message });
    }

    return result;
  }

  /**
   * Generate HTML for a single variation
   */
  private generateHTML(
    input: GeneratePreviewInput,
    content: PreviewContent,
    palette: ColorPalette,
    variationNum: number
  ): string {
    const location = [input.city, input.state].filter(Boolean).join(', ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${this.escapeHtml(content.meta_description)}">
  <title>${this.escapeHtml(input.businessName)} | ${location || 'Professional Services'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }

    nav {
      display: flex;
      gap: 32px;
    }

    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--primary);
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 10px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }

    .header-cta:hover {
      background: var(--secondary);
    }

    /* Hero */
    .hero {
      padding: 80px 0;
      background: linear-gradient(135deg, ${palette.primary}10 0%, ${palette.accent}10 100%);
    }

    .hero-content {
      max-width: 800px;
    }

    .hero h1 {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 24px;
      color: var(--text);
    }

    .hero p {
      font-size: 20px;
      color: var(--muted);
      margin-bottom: 32px;
    }

    .hero-cta {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      transition: background 0.2s, transform 0.2s;
    }

    .hero-cta:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    /* Services */
    .services {
      padding: 80px 0;
    }

    .section-title {
      text-align: center;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .section-subtitle {
      text-align: center;
      color: var(--muted);
      font-size: 18px;
      margin-bottom: 48px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
    }

    .service-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .service-card:hover {
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      transform: translateY(-4px);
    }

    .service-icon {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border-radius: 12px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .service-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .service-card p {
      color: var(--muted);
    }

    /* About */
    .about {
      padding: 80px 0;
      background: #f9fafb;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }

    .about-text h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .about-text p {
      color: var(--muted);
      margin-bottom: 16px;
    }

    .about-image {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      border-radius: 16px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: 500;
    }

    /* Contact */
    .contact {
      padding: 80px 0;
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
    }

    .contact-info h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .contact-info p {
      color: var(--muted);
      margin-bottom: 32px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .contact-item-icon {
      width: 40px;
      height: 40px;
      background: ${palette.primary}15;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contact-form {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 32px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group textarea {
      height: 120px;
      resize: vertical;
    }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--secondary);
    }

    /* Footer */
    footer {
      background: #1f2937;
      color: white;
      padding: 48px 0 24px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 32px;
    }

    .footer-brand {
      max-width: 300px;
    }

    .footer-brand h3 {
      font-size: 24px;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
    }

    .footer-links {
      display: flex;
      gap: 48px;
    }

    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: white;
    }

    .footer-bottom {
      padding-top: 24px;
      border-top: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      color: #9ca3af;
      font-size: 14px;
    }

    .footer-bottom a {
      color: var(--accent);
      text-decoration: none;
    }

    /* Preview Banner */
    .preview-banner {
      background: var(--primary);
      color: white;
      text-align: center;
      padding: 12px;
      font-size: 14px;
    }

    .preview-banner a {
      color: white;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      nav {
        display: none;
      }

      .hero h1 {
        font-size: 32px;
      }

      .about-content,
      .contact-content {
        grid-template-columns: 1fr;
      }

      .about-image {
        height: 250px;
      }

      .footer-content {
        flex-direction: column;
        gap: 32px;
      }

      .footer-bottom {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="preview-banner">
    ✨ This is a preview of your new website! <a href="../index.html">View other designs →</a>
  </div>

  <header>
    <div class="container header-content">
      <a href="#" class="logo">${this.escapeHtml(input.businessName)}</a>
      <nav>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#contact" class="header-cta">${this.escapeHtml(content.cta_text)}</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-content">
      <h1>${this.escapeHtml(content.headline)}</h1>
      <p>${this.escapeHtml(content.tagline)}</p>
      <a href="#contact" class="hero-cta">${this.escapeHtml(content.cta_text)}</a>
    </div>
  </section>

  <section id="services" class="services">
    <div class="container">
      <h2 class="section-title">Our Services</h2>
      <p class="section-subtitle">Professional solutions tailored to your needs</p>
      <div class="services-grid">
        ${content.services.map(service => `
        <div class="service-card">
          <div class="service-icon">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <h3>${this.escapeHtml(service.name)}</h3>
          <p>${this.escapeHtml(service.description)}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section id="about" class="about">
    <div class="container about-content">
      <div class="about-text">
        <h2>About ${this.escapeHtml(input.businessName)}</h2>
        ${content.about.split('\n\n').map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
      </div>
      <div class="about-image">
        📸 Your Business Photo Here
      </div>
    </div>
  </section>

  <section id="contact" class="contact">
    <div class="container contact-content">
      <div class="contact-info">
        <h2>Get In Touch</h2>
        <p>${this.escapeHtml(content.contact_text)}</p>
        <div class="contact-details">
          ${input.phone ? `
          <div class="contact-item">
            <div class="contact-item-icon">📞</div>
            <div>
              <strong>Phone</strong><br>
              <a href="tel:${input.phone}">${input.phone}</a>
            </div>
          </div>
          ` : ''}
          ${input.email ? `
          <div class="contact-item">
            <div class="contact-item-icon">✉️</div>
            <div>
              <strong>Email</strong><br>
              <a href="mailto:${input.email}">${input.email}</a>
            </div>
          </div>
          ` : ''}
          ${location ? `
          <div class="contact-item">
            <div class="contact-item-icon">📍</div>
            <div>
              <strong>Location</strong><br>
              ${this.escapeHtml(location)}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ${this.includeContactForm ? `
      <div class="contact-form">
        <form action="#" method="POST">
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone">
          </div>
          <div class="form-group">
            <label for="message">How Can We Help?</label>
            <textarea id="message" name="message" required></textarea>
          </div>
          <button type="submit" class="submit-btn">Send Message</button>
        </form>
      </div>
      ` : ''}
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <h3>${this.escapeHtml(input.businessName)}</h3>
          <p>${this.escapeHtml(content.tagline)}</p>
        </div>
        <div class="footer-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${this.escapeHtml(input.businessName)}. All rights reserved.</span>
        <span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>
      </div>
    </div>
  </footer>
</body>
</html>`;
  }

  /**
   * Generate main index with variation selector
   */
  private generateIndexWithSelector(
    input: GeneratePreviewInput,
    content: PreviewContent,
    palettes: ColorPalette[]
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Preview for ${this.escapeHtml(input.businessName)}</title>
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
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .header p {
      color: #6b7280;
    }
    .options {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 32px 20px;
      flex-wrap: wrap;
    }
    .option {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      width: 250px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .option:hover {
      border-color: #2563eb;
      transform: translateY(-4px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .color-preview {
      height: 80px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }
    .option h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }
    .option p {
      color: #6b7280;
      font-size: 14px;
    }
    .option .btn {
      display: block;
      background: #2563eb;
      color: white;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      padding: 32px;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Website Preview for ${this.escapeHtml(input.businessName)}</h1>
    <p>I've created ${palettes.length} design options for you. Click to preview each one!</p>
  </div>

  <div class="options">
    ${palettes.map((palette, i) => `
    <a href="variation-${i + 1}/index.html" class="option">
      <div class="color-preview" style="background: linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%);">
        Option ${i + 1}
      </div>
      <h3>${palette.name}</h3>
      <p>Click to view this design option</p>
      <span class="btn">View Design →</span>
    </a>
    `).join('')}
  </div>

  <div class="footer">
    <p>Like what you see? Reply to let me know your favorite, or if you'd like something different!</p>
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
