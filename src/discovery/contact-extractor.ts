import { chromium, Browser } from 'playwright';

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

export async function extractContactInfo(url: string): Promise<ContactInfo> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Set a reasonable timeout
    page.setDefaultTimeout(15000);

    // Navigate to the main page
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const html = await page.content();

    // Extract from main page
    let emails = extractEmails(html);
    let phones = extractPhones(html);
    const socialLinks = extractSocialLinks(html);

    // Try to find and visit contact page
    const contactPageUrl = await findContactPage(page, url);
    if (contactPageUrl) {
      try {
        await page.goto(contactPageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const contactHtml = await page.content();

        // Merge contact info from contact page
        emails = [...new Set([...emails, ...extractEmails(contactHtml)])];
        phones = [...new Set([...phones, ...extractPhones(contactHtml)])];
      } catch (e) {
        // Ignore contact page errors
      }
    }

    // Also check about page
    const aboutPageUrl = await findAboutPage(page, url);
    if (aboutPageUrl && aboutPageUrl !== contactPageUrl) {
      try {
        await page.goto(aboutPageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const aboutHtml = await page.content();
        emails = [...new Set([...emails, ...extractEmails(aboutHtml)])];
        phones = [...new Set([...phones, ...extractPhones(aboutHtml)])];
      } catch (e) {
        // Ignore about page errors
      }
    }

    // Filter out common non-business emails
    emails = filterValidEmails(emails);

    return {
      emails,
      phones,
      socialLinks,
      contactPageUrl
    };
  } catch (err: any) {
    console.error(`Error extracting contacts from ${url}:`, err.message);
    return {
      emails: [],
      phones: [],
      socialLinks: {}
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function extractEmails(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];

  // Also check for obfuscated emails
  const obfuscated = html.match(/[a-zA-Z0-9._%+-]+\s*\[at\]\s*[a-zA-Z0-9.-]+\s*\[dot\]\s*[a-zA-Z]{2,}/gi) || [];
  const deobfuscated = obfuscated.map(e =>
    e.replace(/\s*\[at\]\s*/gi, '@').replace(/\s*\[dot\]\s*/gi, '.')
  );

  // Check mailto: links
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  let mailtoMatch;
  const mailtoEmails: string[] = [];
  while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
    mailtoEmails.push(mailtoMatch[1]);
  }

  return [...new Set([...matches, ...deobfuscated, ...mailtoEmails])].map(e => e.toLowerCase());
}

function extractPhones(html: string): string[] {
  // Various phone formats
  const phonePatterns = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,  // (123) 456-7890, 123-456-7890, etc.
    /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,  // +1 (123) 456-7890
    /\d{3}[-.\s]\d{4}/g  // 456-7890 (local)
  ];

  const phones: string[] = [];

  for (const pattern of phonePatterns) {
    const matches = html.match(pattern) || [];
    phones.push(...matches);
  }

  // Normalize and dedupe
  return [...new Set(phones.map(normalizePhone))].filter(p => p.length >= 10);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function extractSocialLinks(html: string): SocialLinks {
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

async function findContactPage(page: any, baseUrl: string): Promise<string | undefined> {
  const contactLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const contactPatterns = /contact|get.?in.?touch|reach.?us|email.?us/i;

    for (const link of links) {
      const text = link.textContent?.toLowerCase() || '';
      const href = link.href || '';

      if (contactPatterns.test(text) || contactPatterns.test(href)) {
        return href;
      }
    }
    return null;
  });

  if (contactLinks && isValidUrl(contactLinks, baseUrl)) {
    return contactLinks;
  }

  // Try common contact page URLs
  const commonPaths = ['/contact', '/contact-us', '/contactus', '/get-in-touch'];
  const base = new URL(baseUrl);

  for (const path of commonPaths) {
    const testUrl = `${base.origin}${path}`;
    try {
      const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (response && response.status() === 200) {
        return testUrl;
      }
    } catch {
      // Continue trying other paths
    }
  }

  return undefined;
}

async function findAboutPage(page: any, baseUrl: string): Promise<string | undefined> {
  const aboutLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const aboutPatterns = /about|about.?us|our.?story|who.?we.?are/i;

    for (const link of links) {
      const text = link.textContent?.toLowerCase() || '';
      const href = link.href || '';

      if (aboutPatterns.test(text) || aboutPatterns.test(href)) {
        return href;
      }
    }
    return null;
  });

  if (aboutLinks && isValidUrl(aboutLinks, baseUrl)) {
    return aboutLinks;
  }

  return undefined;
}

function isValidUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    return parsed.hostname === base.hostname || parsed.hostname.endsWith('.' + base.hostname);
  } catch {
    return false;
  }
}

function filterValidEmails(emails: string[]): string[] {
  const invalidPatterns = [
    /example\.com$/i,
    /test\.com$/i,
    /localhost/i,
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
    /support@/i,  // Often generic
    /@sentry\./i,
    /@google\./i,
    /@facebook\./i,
    /@twitter\./i,
    /\.png$/i,
    /\.jpg$/i,
    /\.gif$/i,
    /wixpress/i,
    /wordpress/i,
    /squarespace/i
  ];

  return emails.filter(email => {
    // Check against invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(email)) {
        return false;
      }
    }

    // Must have a valid TLD
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

// CLI entry point
if (require.main === module) {
  const url = process.argv[2] || 'https://example.com';

  console.log(`\n📧 Extracting contacts from ${url}...\n`);

  extractContactInfo(url)
    .then(info => {
      console.log('Contact Information:');
      console.log(`  Emails: ${info.emails.length > 0 ? info.emails.join(', ') : 'None found'}`);
      console.log(`  Phones: ${info.phones.length > 0 ? info.phones.join(', ') : 'None found'}`);
      console.log(`  Contact Page: ${info.contactPageUrl || 'Not found'}`);
      console.log('\nSocial Links:');
      for (const [platform, url] of Object.entries(info.socialLinks)) {
        console.log(`  ${platform}: ${url}`);
      }
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}
