/**
 * Nextdoor Business Page Scraper
 *
 * Extracts business data from Nextdoor business pages using HTTP fetch.
 * Works with public business pages without requiring authentication.
 *
 * Example URL: https://nextdoor.com/pages/gustavos-landscape-tucson-az/
 *
 * Extracted data:
 * - Business name
 * - Phone number
 * - Services/description
 * - Logo URL
 * - Recommendations (reviews)
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { PlatformBusinessData, BusinessReview, formatPhone } from './business-data';

export interface NextdoorScraperResult {
  success: boolean;
  data: PlatformBusinessData | null;
  error?: string;
}

/**
 * User agents to rotate through for requests
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

/**
 * Fetch HTML content from a URL
 */
async function fetchHtml(urlStr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const protocol = url.protocol === 'https:' ? https : http;
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    };

    const req = protocol.request(options, res => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, urlStr).toString();
        fetchHtml(redirectUrl).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Extract business name from Nextdoor page HTML
 */
function extractName(html: string): string | undefined {
  // Try meta og:title
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitleMatch) {
    // Remove " | Nextdoor" suffix if present
    return ogTitleMatch[1].replace(/\s*\|\s*Nextdoor.*$/i, '').trim();
  }

  // Try title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].replace(/\s*\|\s*Nextdoor.*$/i, '').trim();
  }

  return undefined;
}

/**
 * Extract phone number from Nextdoor page HTML
 */
function extractPhone(html: string): string | undefined {
  // Look for phone links
  const phoneMatch = html.match(/href="tel:([^"]+)"/i);
  if (phoneMatch) {
    return formatPhone(phoneMatch[1]);
  }

  // Look for phone number patterns in content
  const phonePatterns = [
    /\+1\s*\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}/,
    /\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}/,
  ];

  for (const pattern of phonePatterns) {
    const match = html.match(pattern);
    if (match) {
      return formatPhone(match[0]);
    }
  }

  return undefined;
}

/**
 * Extract logo URL from Nextdoor page HTML
 */
function extractLogoUrl(html: string): string | undefined {
  // Look for entity page profile images
  const logoPatterns = [
    /https:\/\/[^"'\s]+?us\d+-photo\.nextdoor\.com\/entity_page_profile\/[^"'\s]+\.(jpeg|jpg|png|gif)/gi,
    /https:\/\/[^"'\s]+?nextdoor\.com\/[^"'\s]*profile[^"'\s]*\.(jpeg|jpg|png|gif)/gi,
    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  ];

  for (const pattern of logoPatterns) {
    if (pattern instanceof RegExp && pattern.source.includes('meta')) {
      const match = html.match(pattern);
      if (match) {
        const url = match[1];
        // Filter out generic Nextdoor images
        if (!url.includes('nextdoor-logo') && !url.includes('generic')) {
          return url;
        }
      }
    } else {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first valid logo URL
        for (const url of matches) {
          if (!url.includes('nextdoor-logo') && !url.includes('generic')) {
            return url;
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Extract services/description from Nextdoor page HTML
 */
function extractServices(html: string): string[] {
  const services: string[] = [];

  // Try meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (descMatch) {
    const desc = descMatch[1];
    // Extract service keywords from description
    const serviceKeywords = desc.split(/[,.]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 50);
    services.push(...serviceKeywords.slice(0, 5));
  }

  // Look for service-related content
  const servicePatterns = [
    /services?:\s*([^<]+)/gi,
    /specializing\s+in\s*:?\s*([^<]+)/gi,
    /we\s+offer\s*:?\s*([^<]+)/gi,
  ];

  for (const pattern of servicePatterns) {
    const match = html.match(pattern);
    if (match) {
      const extracted = match[1].split(/[,.]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 50);
      services.push(...extracted.slice(0, 5));
    }
  }

  // Deduplicate using filter
  return services.filter((service, index, self) => self.indexOf(service) === index);
}

/**
 * Extract recommendation count from Nextdoor page HTML
 */
function extractRecommendationCount(html: string): number | undefined {
  // Look for recommendation count patterns
  const patterns = [
    /(\d+)\s*recommendation/i,
    /recommended\s+by\s+(\d+)/i,
    /(\d+)\s*neighbor/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Extract reviews/recommendations from Nextdoor page HTML
 */
function extractReviews(html: string, maxReviews: number = 5): BusinessReview[] {
  const reviews: BusinessReview[] = [];

  // Look for recommendation text patterns
  // Nextdoor recommendations are typically in quote blocks or review containers

  // Pattern 1: JSON-LD structured data
  const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([^<]+)<\/script>/gi);
  if (jsonLdMatch) {
    for (const jsonBlock of jsonLdMatch) {
      try {
        const jsonContent = jsonBlock.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);

        if (data.review && Array.isArray(data.review)) {
          for (const review of data.review.slice(0, maxReviews)) {
            reviews.push({
              text: review.reviewBody || review.description || '',
              author: review.author?.name || 'Nextdoor Neighbor',
              rating: review.reviewRating?.ratingValue || 5,
              date: review.datePublished,
              source: 'nextdoor',
            });
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }

  // Pattern 2: Look for recommendation/review text in HTML
  const reviewPatterns = [
    /"reviewBody"\s*:\s*"([^"]+)"/g,
    /class="[^"]*review[^"]*"[^>]*>([^<]{20,500})</gi,
    /class="[^"]*recommendation[^"]*"[^>]*>([^<]{20,500})</gi,
  ];

  if (reviews.length < maxReviews) {
    for (const pattern of reviewPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const text = match[1]?.trim();
        if (text && text.length > 20 && text.length < 500 && reviews.length < maxReviews) {
          // Check if this review text is already added
          if (!reviews.some(r => r.text === text)) {
            reviews.push({
              text,
              author: 'Nextdoor Neighbor',
              rating: 5,
              source: 'nextdoor',
            });
          }
        }
      }
    }
  }

  return reviews.slice(0, maxReviews);
}

/**
 * Extract address from Nextdoor page HTML
 */
function extractAddress(html: string): { address?: string; city?: string; state?: string } {
  // Try structured data
  const addressPatterns = [
    /"streetAddress"\s*:\s*"([^"]+)"/,
    /"addressLocality"\s*:\s*"([^"]+)"/,
    /"addressRegion"\s*:\s*"([^"]+)"/,
  ];

  let address: string | undefined;
  let city: string | undefined;
  let state: string | undefined;

  const streetMatch = html.match(addressPatterns[0]);
  if (streetMatch) address = streetMatch[1];

  const cityMatch = html.match(addressPatterns[1]);
  if (cityMatch) city = cityMatch[1];

  const stateMatch = html.match(addressPatterns[2]);
  if (stateMatch) state = stateMatch[1];

  // Try to extract from URL (e.g., /pages/business-name-tucson-az/)
  if (!city || !state) {
    const urlMatch = html.match(/\/pages\/[^/]+-([a-z]+)-([a-z]{2})\/?/i);
    if (urlMatch) {
      city = city || urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
      state = state || urlMatch[2].toUpperCase();
    }
  }

  return { address, city, state };
}

/**
 * Scrape a Nextdoor business page
 *
 * @param url - Nextdoor business page URL
 * @param maxReviews - Maximum number of reviews to extract
 * @returns Scraped business data
 */
export async function scrapeNextdoor(
  url: string,
  maxReviews: number = 5
): Promise<NextdoorScraperResult> {
  try {
    // Validate URL
    if (!url.includes('nextdoor.com')) {
      return {
        success: false,
        data: null,
        error: 'Invalid Nextdoor URL',
      };
    }

    console.log(`[Nextdoor] Fetching: ${url}`);

    const html = await fetchHtml(url);

    // Extract all data
    const name = extractName(html);
    const phone = extractPhone(html);
    const logoUrl = extractLogoUrl(html);
    const services = extractServices(html);
    const reviewCount = extractRecommendationCount(html);
    const reviews = extractReviews(html, maxReviews);
    const { address, city, state } = extractAddress(html);

    // Must have at least a name
    if (!name) {
      return {
        success: false,
        data: null,
        error: 'Could not extract business name from page',
      };
    }

    const data: PlatformBusinessData = {
      platform: 'nextdoor',
      sourceUrl: url,
      name,
      phone,
      address,
      city,
      state,
      logoUrl,
      services: services.length > 0 ? services : undefined,
      reviewCount,
      reviews,
    };

    console.log(`[Nextdoor] Extracted: ${name}, phone: ${phone || 'N/A'}, logo: ${logoUrl ? 'Yes' : 'No'}, reviews: ${reviews.length}`);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`[Nextdoor] Error scraping ${url}:`, error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// CLI entry point for testing
if (require.main === module) {
  const url = process.argv[2] || 'https://nextdoor.com/pages/gustavos-landscape-tucson-az/';

  console.log(`\n=== Nextdoor Scraper Test ===\n`);
  console.log(`URL: ${url}\n`);

  scrapeNextdoor(url)
    .then(result => {
      if (result.success && result.data) {
        console.log('\n=== Extracted Data ===\n');
        console.log(`Name: ${result.data.name}`);
        console.log(`Phone: ${result.data.phone || 'N/A'}`);
        console.log(`Address: ${result.data.address || 'N/A'}`);
        console.log(`City: ${result.data.city || 'N/A'}`);
        console.log(`State: ${result.data.state || 'N/A'}`);
        console.log(`Logo: ${result.data.logoUrl || 'N/A'}`);
        console.log(`Services: ${result.data.services?.join(', ') || 'N/A'}`);
        console.log(`Review Count: ${result.data.reviewCount || 'N/A'}`);
        console.log(`Reviews: ${result.data.reviews?.length || 0}`);

        if (result.data.reviews?.length) {
          console.log('\n=== Sample Reviews ===\n');
          for (const review of result.data.reviews.slice(0, 3)) {
            console.log(`- "${review.text.slice(0, 100)}..." - ${review.author}`);
          }
        }
      } else {
        console.log(`\nError: ${result.error}`);
      }
    })
    .catch(err => {
      console.error(`\nFailed: ${err.message}`);
      process.exit(1);
    });
}
