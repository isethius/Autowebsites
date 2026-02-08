/**
 * Facebook Business Page Scraper
 *
 * Extracts business data from public Facebook business pages using HTTP fetch.
 * Works with public business pages without requiring authentication.
 *
 * Example URL: https://www.facebook.com/businessname/
 *
 * Extracted data:
 * - Business name
 * - Phone number
 * - About/description
 * - Profile/cover photo
 * - Hours
 * - Reviews (limited availability)
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { PlatformBusinessData, BusinessReview, formatPhone } from './business-data';

export interface FacebookScraperResult {
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
 * Extract business name from Facebook page HTML
 */
function extractName(html: string): string | undefined {
  // Try meta og:title
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitleMatch) {
    // Remove " | Facebook" suffix if present
    return ogTitleMatch[1].replace(/\s*[-|]\s*Facebook.*$/i, '').trim();
  }

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].replace(/\s*[-|]\s*Facebook.*$/i, '').trim();
  }

  return undefined;
}

/**
 * Extract phone number from Facebook page HTML
 */
function extractPhone(html: string): string | undefined {
  // Look for phone links
  const phoneMatch = html.match(/href="tel:([^"]+)"/i);
  if (phoneMatch) {
    return formatPhone(phoneMatch[1]);
  }

  // Look for phone number patterns in content
  const phonePatterns = [
    /"phone"\s*:\s*"([^"]+)"/i,
    /\+1\s*\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}/,
    /\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}/,
  ];

  for (const pattern of phonePatterns) {
    const match = html.match(pattern);
    if (match) {
      return formatPhone(match[1] || match[0]);
    }
  }

  return undefined;
}

/**
 * Extract profile/logo image URL from Facebook page HTML
 */
function extractLogoUrl(html: string): string | undefined {
  // Look for og:image (usually profile picture)
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogImageMatch) {
    const url = ogImageMatch[1];
    // Filter out placeholder images
    if (url.includes('scontent') || url.includes('fbcdn')) {
      return url;
    }
  }

  // Look for profile picture patterns
  const profilePatterns = [
    /"profilePic[^"]*"\s*:\s*"([^"]+)"/,
    /"profile_picture"[^}]*"uri"\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of profilePatterns) {
    const match = html.match(pattern);
    if (match) {
      // Unescape the URL
      return match[1].replace(/\\u0025/g, '%').replace(/\\\//g, '/');
    }
  }

  return undefined;
}

/**
 * Extract about/description from Facebook page HTML
 */
function extractAbout(html: string): string | undefined {
  // Try meta description
  const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (descMatch) {
    const desc = descMatch[1];
    // Filter out generic Facebook descriptions
    if (!desc.toLowerCase().includes('see posts, photos')) {
      return desc;
    }
  }

  // Try structured data
  const aboutPatterns = [
    /"about"\s*:\s*"([^"]+)"/,
    /"description"\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of aboutPatterns) {
    const match = html.match(pattern);
    if (match && match[1].length > 20) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract categories from Facebook page HTML
 */
function extractCategories(html: string): string[] {
  const categories: string[] = [];

  // Look for category in structured data
  const categoryPatterns = [
    /"category"\s*:\s*"([^"]+)"/g,
    /"categories"\s*:\s*\[([^\]]+)\]/g,
    /class="[^"]*category[^"]*"[^>]*>([^<]+)</gi,
  ];

  for (const pattern of categoryPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const category = match[1]?.trim();
      if (category && category.length > 2 && category.length < 50) {
        categories.push(category.replace(/"/g, ''));
      }
    }
  }

  // Deduplicate using filter
  return categories.filter((category, index, self) => self.indexOf(category) === index);
}

/**
 * Extract hours from Facebook page HTML
 */
function extractHours(html: string): Record<string, string> | undefined {
  const hours: Record<string, string> = {};

  // Try structured data
  const jsonHoursMatch = html.match(/"hours"\s*:\s*(\{[^}]+\})/);
  if (jsonHoursMatch) {
    try {
      const parsed = JSON.parse(jsonHoursMatch[1]);
      for (const [day, time] of Object.entries(parsed)) {
        if (typeof time === 'string') {
          hours[day] = time;
        }
      }
      if (Object.keys(hours).length > 0) {
        return hours;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Look for day patterns
  const dayPatterns = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi;
  let dayMatch: RegExpExecArray | null;
  while ((dayMatch = dayPatterns.exec(html)) !== null) {
    const day = dayMatch[0].split(/[:\s]/)[0];
    const time = dayMatch[1];
    if (day && time) {
      hours[day] = time;
    }
  }

  return Object.keys(hours).length > 0 ? hours : undefined;
}

/**
 * Extract address from Facebook page HTML
 */
function extractAddress(html: string): { address?: string; city?: string; state?: string } {
  let address: string | undefined;
  let city: string | undefined;
  let state: string | undefined;

  // Try structured data
  const addressPatterns = [
    /"streetAddress"\s*:\s*"([^"]+)"/,
    /"addressLocality"\s*:\s*"([^"]+)"/,
    /"addressRegion"\s*:\s*"([^"]+)"/,
    /"street"\s*:\s*"([^"]+)"/,
    /"city"\s*:\s*"([^"]+)"/,
    /"state"\s*:\s*"([^"]+)"/,
  ];

  const streetMatch = html.match(addressPatterns[0]) || html.match(addressPatterns[3]);
  if (streetMatch) address = streetMatch[1];

  const cityMatch = html.match(addressPatterns[1]) || html.match(addressPatterns[4]);
  if (cityMatch) city = cityMatch[1];

  const stateMatch = html.match(addressPatterns[2]) || html.match(addressPatterns[5]);
  if (stateMatch) state = stateMatch[1];

  return { address, city, state };
}

/**
 * Extract rating from Facebook page HTML
 */
function extractRating(html: string): { rating?: number; reviewCount?: number } {
  let rating: number | undefined;
  let reviewCount: number | undefined;

  // Look for rating patterns
  const ratingPatterns = [
    /"overallStarRating"\s*:\s*(\d+\.?\d*)/,
    /"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/,
    /(\d+\.?\d*)\s*(?:out\s+of\s+5|stars?)/i,
  ];

  for (const pattern of ratingPatterns) {
    const match = html.match(pattern);
    if (match) {
      rating = parseFloat(match[1]);
      if (rating > 0 && rating <= 5) break;
      rating = undefined;
    }
  }

  // Look for review count
  const reviewPatterns = [
    /"ratingCount"\s*:\s*(\d+)/,
    /"reviewCount"\s*:\s*(\d+)/,
    /(\d+)\s*(?:reviews?|ratings?)/i,
  ];

  for (const pattern of reviewPatterns) {
    const match = html.match(pattern);
    if (match) {
      reviewCount = parseInt(match[1], 10);
      if (reviewCount > 0) break;
    }
  }

  return { rating, reviewCount };
}

/**
 * Extract reviews from Facebook page HTML
 * Note: Facebook limits public access to reviews
 */
function extractReviews(html: string, maxReviews: number = 5): BusinessReview[] {
  const reviews: BusinessReview[] = [];

  // Try structured data
  const reviewPatterns = [
    /"reviewBody"\s*:\s*"([^"]+)"/g,
    /"review"\s*:\s*\[([^\]]+)\]/g,
  ];

  for (const pattern of reviewPatterns) {
    if (reviews.length >= maxReviews) break;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const text = match[1]?.trim();
      if (text && text.length > 20 && text.length < 1000 && reviews.length < maxReviews) {
        // Check if this review text is already added
        if (!reviews.some(r => r.text === text)) {
          reviews.push({
            text,
            author: 'Facebook User',
            rating: 5,
            source: 'facebook',
          });
        }
      }
    }
  }

  return reviews.slice(0, maxReviews);
}

/**
 * Extract email from Facebook page HTML
 */
function extractEmail(html: string): string | undefined {
  const emailPatterns = [
    /"email"\s*:\s*"([^"]+@[^"]+)"/,
    /href="mailto:([^"]+)"/i,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  ];

  for (const pattern of emailPatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Scrape a Facebook business page
 *
 * @param url - Facebook business page URL
 * @param maxReviews - Maximum number of reviews to extract
 * @returns Scraped business data
 */
export async function scrapeFacebook(
  url: string,
  maxReviews: number = 5
): Promise<FacebookScraperResult> {
  try {
    // Validate URL
    if (!url.includes('facebook.com')) {
      return {
        success: false,
        data: null,
        error: 'Invalid Facebook URL',
      };
    }

    console.log(`[Facebook] Fetching: ${url}`);

    const html = await fetchHtml(url);

    // Extract all data
    const name = extractName(html);
    const phone = extractPhone(html);
    const email = extractEmail(html);
    const logoUrl = extractLogoUrl(html);
    const about = extractAbout(html);
    const categories = extractCategories(html);
    const hours = extractHours(html);
    const { address, city, state } = extractAddress(html);
    const { rating, reviewCount } = extractRating(html);
    const reviews = extractReviews(html, maxReviews);

    // Must have at least a name
    if (!name) {
      return {
        success: false,
        data: null,
        error: 'Could not extract business name from page',
      };
    }

    const data: PlatformBusinessData = {
      platform: 'facebook',
      sourceUrl: url,
      name,
      phone,
      email,
      address,
      city,
      state,
      logoUrl,
      about,
      categories: categories.length > 0 ? categories : undefined,
      hours,
      rating,
      reviewCount,
      reviews,
    };

    console.log(`[Facebook] Extracted: ${name}, phone: ${phone || 'N/A'}, logo: ${logoUrl ? 'Yes' : 'No'}, rating: ${rating || 'N/A'}`);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`[Facebook] Error scraping ${url}:`, error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// CLI entry point for testing
if (require.main === module) {
  const url = process.argv[2] || 'https://www.facebook.com/example';

  console.log(`\n=== Facebook Scraper Test ===\n`);
  console.log(`URL: ${url}\n`);

  scrapeFacebook(url)
    .then(result => {
      if (result.success && result.data) {
        console.log('\n=== Extracted Data ===\n');
        console.log(`Name: ${result.data.name}`);
        console.log(`Phone: ${result.data.phone || 'N/A'}`);
        console.log(`Email: ${result.data.email || 'N/A'}`);
        console.log(`Address: ${result.data.address || 'N/A'}`);
        console.log(`City: ${result.data.city || 'N/A'}`);
        console.log(`State: ${result.data.state || 'N/A'}`);
        console.log(`Logo: ${result.data.logoUrl || 'N/A'}`);
        console.log(`About: ${result.data.about?.slice(0, 100) || 'N/A'}...`);
        console.log(`Categories: ${result.data.categories?.join(', ') || 'N/A'}`);
        console.log(`Rating: ${result.data.rating || 'N/A'}`);
        console.log(`Review Count: ${result.data.reviewCount || 'N/A'}`);
        console.log(`Reviews: ${result.data.reviews?.length || 0}`);

        if (result.data.hours) {
          console.log('\n=== Hours ===\n');
          for (const [day, time] of Object.entries(result.data.hours)) {
            console.log(`  ${day}: ${time}`);
          }
        }

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
