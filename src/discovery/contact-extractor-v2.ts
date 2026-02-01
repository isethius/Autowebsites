/**
 * Contact Extractor V2 - Spider-powered contact extraction
 *
 * Enhanced contact extraction using Spider for multi-page crawling.
 * Crawls entire sites (up to configured limit) to find contact info.
 *
 * Benefits over v1:
 * - Finds emails hidden on /contact, /about, /team, /staff pages
 * - Validates URL before wasting time on dead sites
 * - Faster than sequential fetch() calls
 * - Configurable crawl depth and page limits
 */

import { SpiderClient, CrawlResult, SpiderOptions } from './spider-client';

export interface ContactInfo {
  emails: string[];
  phones: string[];
  socialLinks: SocialLinks;
  contactPageUrl?: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface ExtractedContacts extends ContactInfo {
  url: string;
  isValid: boolean;
  pagesCrawled: number;
  pagesWithContacts: number;
  crawlTime: number;
  errors: string[];
}

export interface ExtractorOptions {
  maxPages?: number;       // Max pages to crawl (default: 10)
  maxDepth?: number;       // Max crawl depth (default: 2)
  timeout?: number;        // Request timeout in ms (default: 15000)
  validateFirst?: boolean; // Validate URL before crawling (default: true)
}

const DEFAULT_OPTIONS: Required<ExtractorOptions> = {
  maxPages: 10,
  maxDepth: 2,
  timeout: 15000,
  validateFirst: true,
};

export class ContactExtractorV2 {
  private spider: SpiderClient;
  private options: Required<ExtractorOptions>;

  constructor(options?: ExtractorOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.spider = new SpiderClient({
      timeout: this.options.timeout,
      maxPages: this.options.maxPages,
      maxDepth: this.options.maxDepth,
    });
  }

  /**
   * Crawl site and extract all contact info from multiple pages
   */
  async extractContacts(url: string): Promise<ExtractedContacts> {
    const startTime = Date.now();
    const result: ExtractedContacts = {
      url,
      emails: [],
      phones: [],
      socialLinks: {},
      isValid: false,
      pagesCrawled: 0,
      pagesWithContacts: 0,
      crawlTime: 0,
      errors: [],
    };

    try {
      // Step 1: Validate URL is alive (optional)
      if (this.options.validateFirst) {
        const validation = await this.spider.validateUrl(url);
        if (!validation.valid) {
          result.errors.push(`URL validation failed: ${validation.error || 'Dead URL'}`);
          result.crawlTime = Date.now() - startTime;
          return result;
        }
        result.isValid = true;
      }

      // Step 2: Crawl the site
      const crawlResult = await this.spider.crawl(url, {
        maxPages: this.options.maxPages,
        maxDepth: this.options.maxDepth,
        timeout: this.options.timeout,
      });

      result.pagesCrawled = crawlResult.totalPages;
      result.errors.push(...crawlResult.errors);

      // Step 3: Extract contacts from each page
      const allEmails: string[] = [];
      const allPhones: string[] = [];
      const allSocial: SocialLinks = {};
      let pagesWithContacts = 0;

      for (const page of crawlResult.pages) {
        const pageContacts = this.extractFromHtml(page.content, page.url);

        if (pageContacts.emails.length > 0 || pageContacts.phones.length > 0) {
          pagesWithContacts++;
        }

        allEmails.push(...pageContacts.emails);
        allPhones.push(...pageContacts.phones);

        // Merge social links (first found wins)
        if (pageContacts.socialLinks.facebook && !allSocial.facebook) {
          allSocial.facebook = pageContacts.socialLinks.facebook;
        }
        if (pageContacts.socialLinks.twitter && !allSocial.twitter) {
          allSocial.twitter = pageContacts.socialLinks.twitter;
        }
        if (pageContacts.socialLinks.instagram && !allSocial.instagram) {
          allSocial.instagram = pageContacts.socialLinks.instagram;
        }
        if (pageContacts.socialLinks.linkedin && !allSocial.linkedin) {
          allSocial.linkedin = pageContacts.socialLinks.linkedin;
        }
        if (pageContacts.socialLinks.youtube && !allSocial.youtube) {
          allSocial.youtube = pageContacts.socialLinks.youtube;
        }

        // Find contact page URL
        if (!result.contactPageUrl && this.isContactPage(page.url)) {
          result.contactPageUrl = page.url;
        }
      }

      // Step 4: Deduplicate and filter
      result.emails = this.filterValidEmails(Array.from(new Set(allEmails)));
      result.phones = this.normalizePhones(Array.from(new Set(allPhones)));
      result.socialLinks = allSocial;
      result.pagesWithContacts = pagesWithContacts;
      result.isValid = true;

    } catch (err: any) {
      result.errors.push(err.message || 'Extraction failed');
    }

    result.crawlTime = Date.now() - startTime;
    return result;
  }

  /**
   * Quick validation + extraction from main page only
   * Faster than full crawl for basic contact extraction
   */
  async quickExtract(url: string): Promise<ExtractedContacts> {
    const startTime = Date.now();
    const result: ExtractedContacts = {
      url,
      emails: [],
      phones: [],
      socialLinks: {},
      isValid: false,
      pagesCrawled: 0,
      pagesWithContacts: 0,
      crawlTime: 0,
      errors: [],
    };

    try {
      // Validate and fetch main page
      const validation = await this.spider.validateUrl(url);
      if (!validation.valid) {
        result.errors.push(`URL validation failed: ${validation.error || 'Dead URL'}`);
        result.crawlTime = Date.now() - startTime;
        return result;
      }

      result.isValid = true;

      // Fetch main page content
      const response = await fetch(this.normalizeUrl(url)!, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AutoWebsites/1.0)' },
        signal: AbortSignal.timeout(this.options.timeout),
      });

      if (!response.ok) {
        result.errors.push(`Failed to fetch page: ${response.status}`);
        result.crawlTime = Date.now() - startTime;
        return result;
      }

      const html = await response.text();
      result.pagesCrawled = 1;

      // Extract contacts
      const contacts = this.extractFromHtml(html, url);
      result.emails = this.filterValidEmails(contacts.emails);
      result.phones = this.normalizePhones(contacts.phones);
      result.socialLinks = contacts.socialLinks;

      if (result.emails.length > 0 || result.phones.length > 0) {
        result.pagesWithContacts = 1;
      }

    } catch (err: any) {
      result.errors.push(err.message || 'Quick extraction failed');
    }

    result.crawlTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate URL before extraction (useful for bulk pre-filtering)
   */
  async validateUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    const result = await this.spider.validateUrl(url);
    return {
      valid: result.valid,
      error: result.error,
    };
  }

  /**
   * Extract contacts from HTML content
   */
  private extractFromHtml(html: string, pageUrl: string): ContactInfo {
    return {
      emails: this.extractEmails(html),
      phones: this.extractPhones(html),
      socialLinks: this.extractSocialLinks(html),
      contactPageUrl: this.isContactPage(pageUrl) ? pageUrl : undefined,
    };
  }

  /**
   * Extract email addresses from HTML
   */
  private extractEmails(html: string): string[] {
    const emails: string[] = [];

    // Standard email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = html.match(emailRegex) || [];
    emails.push(...matches);

    // Obfuscated emails: user [at] domain [dot] com
    const obfuscated = html.match(/[a-zA-Z0-9._%+-]+\s*\[at\]\s*[a-zA-Z0-9.-]+\s*\[dot\]\s*[a-zA-Z]{2,}/gi) || [];
    const deobfuscated = obfuscated.map(e =>
      e.replace(/\s*\[at\]\s*/gi, '@').replace(/\s*\[dot\]\s*/gi, '.')
    );
    emails.push(...deobfuscated);

    // Check mailto: links
    const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let mailtoMatch;
    while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
      emails.push(mailtoMatch[1]);
    }

    return emails.map(e => e.toLowerCase());
  }

  /**
   * Extract phone numbers from HTML
   */
  private extractPhones(html: string): string[] {
    const phones: string[] = [];

    // Various phone formats
    const phonePatterns = [
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,           // (123) 456-7890
      /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // +1 (123) 456-7890
      /tel:([+\d\-.\s()]+)/gi,                           // tel: links
      /href="tel:([^"]+)"/gi,                            // href tel links
    ];

    for (const pattern of phonePatterns) {
      const matches = html.match(pattern) || [];
      phones.push(...matches);
    }

    return phones;
  }

  /**
   * Extract social media links from HTML
   */
  private extractSocialLinks(html: string): SocialLinks {
    const social: SocialLinks = {};

    // Facebook
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i);
    if (fbMatch) social.facebook = fbMatch[0];

    // Twitter/X
    const twMatch = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/i);
    if (twMatch) social.twitter = twMatch[0];

    // Instagram
    const igMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/i);
    if (igMatch) social.instagram = igMatch[0];

    // LinkedIn
    const liMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/i);
    if (liMatch) social.linkedin = liMatch[0];

    // YouTube
    const ytMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/)?[a-zA-Z0-9_-]+/i);
    if (ytMatch) social.youtube = ytMatch[0];

    return social;
  }

  /**
   * Check if URL is a contact page
   */
  private isContactPage(url: string): boolean {
    const contactPatterns = /contact|get.?in.?touch|reach.?us|email.?us|about.?us|about$/i;
    return contactPatterns.test(url);
  }

  /**
   * Filter out invalid/generic emails
   */
  private filterValidEmails(emails: string[]): string[] {
    const invalidPatterns = [
      /example\.com$/i,
      /test\.com$/i,
      /localhost/i,
      /noreply/i,
      /no-reply/i,
      /donotreply/i,
      /@sentry\./i,
      /@google\./i,
      /@facebook\./i,
      /@twitter\./i,
      /\.png$/i,
      /\.jpg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /wixpress/i,
      /wordpress/i,
      /squarespace/i,
      /mailchimp/i,
      /hubspot/i,
      /cloudflare/i,
    ];

    return emails.filter(email => {
      // Check against invalid patterns
      for (const pattern of invalidPatterns) {
        if (pattern.test(email)) {
          return false;
        }
      }

      // Must have valid structure
      const parts = email.split('@');
      if (parts.length !== 2) return false;

      const domain = parts[1];
      if (!domain.includes('.')) return false;

      // TLD must be at least 2 chars
      const tld = domain.split('.').pop();
      if (!tld || tld.length < 2) return false;

      return true;
    });
  }

  /**
   * Normalize phone numbers
   */
  private normalizePhones(phones: string[]): string[] {
    return phones
      .map(phone => {
        // Remove tel: prefix
        let normalized = phone.replace(/^tel:/i, '').trim();
        // Extract digits and +
        normalized = normalized.replace(/[^\d+]/g, '');
        return normalized;
      })
      .filter(phone => phone.length >= 10);
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string | null {
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    try {
      return new URL(normalized).href;
    } catch {
      return null;
    }
  }
}

// Factory function
export function createContactExtractorV2(options?: ExtractorOptions): ContactExtractorV2 {
  return new ContactExtractorV2(options);
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2] || 'https://example.com';
  const quick = process.argv.includes('--quick');

  console.log(`\n📧 Contact Extractor V2\n`);
  console.log(`URL: ${url}`);
  console.log(`Mode: ${quick ? 'Quick (main page only)' : 'Full crawl'}\n`);

  const extractor = new ContactExtractorV2();
  const extractFn = quick ? extractor.quickExtract.bind(extractor) : extractor.extractContacts.bind(extractor);

  extractFn(url)
    .then(result => {
      console.log('Results:');
      console.log(`  Valid: ${result.isValid}`);
      console.log(`  Pages crawled: ${result.pagesCrawled}`);
      console.log(`  Pages with contacts: ${result.pagesWithContacts}`);
      console.log(`  Crawl time: ${result.crawlTime}ms`);
      console.log();
      console.log(`  Emails (${result.emails.length}):`);
      for (const email of result.emails) {
        console.log(`    - ${email}`);
      }
      console.log(`  Phones (${result.phones.length}):`);
      for (const phone of result.phones) {
        console.log(`    - ${phone}`);
      }
      console.log('  Social Links:', result.socialLinks);
      if (result.contactPageUrl) {
        console.log(`  Contact Page: ${result.contactPageUrl}`);
      }
      if (result.errors.length > 0) {
        console.log('  Errors:', result.errors);
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
