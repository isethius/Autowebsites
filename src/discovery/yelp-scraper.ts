/**
 * Yelp Business Scraper
 *
 * Scrapes business listings from Yelp search results.
 * Uses Playwright for browser automation to handle dynamic content.
 *
 * Usage:
 *   const scraper = new YelpScraper();
 *   const results = await scraper.search({ query: 'plumbers', location: 'Phoenix, AZ' });
 */

import { chromium, Browser, Page } from 'playwright';

export interface YelpBusiness {
  name: string;
  url: string;
  yelpUrl: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  priceRange?: string;
  imageUrl?: string;
}

export interface YelpSearchOptions {
  query: string;
  location: string;
  maxResults?: number;
  sortBy?: 'recommended' | 'highest_rated' | 'most_reviewed';
  /** Filter to only businesses without a real website (just social/directory pages) */
  noWebsiteOnly?: boolean;
  /** Filter to only businesses with a real website */
  hasWebsiteOnly?: boolean;
}

export interface YelpSearchResult {
  businesses: YelpBusiness[];
  totalFound: number;
  pagesScraped: number;
  errors: string[];
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

export class YelpScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private userAgent: string;

  constructor() {
    this.userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Search for businesses on Yelp
   */
  async search(options: YelpSearchOptions): Promise<YelpSearchResult> {
    const { query, location, maxResults = 50, sortBy = 'recommended', noWebsiteOnly = false, hasWebsiteOnly = false } = options;
    const businesses: YelpBusiness[] = [];
    const errors: string[] = [];
    let pagesScraped = 0;

    try {
      await this.init();

      // Build search URL
      const searchUrl = this.buildSearchUrl(query, location, sortBy);
      console.log(`🔍 Searching Yelp: ${query} in ${location}`);

      let currentUrl = searchUrl;
      let page = 0;
      const maxPages = Math.ceil(maxResults / 10); // Yelp shows ~10 per page

      while (businesses.length < maxResults && page < maxPages) {
        page++;
        pagesScraped++;

        try {
          console.log(`  📄 Scraping page ${page}...`);
          const pageBusiness = await this.scrapePage(currentUrl);
          businesses.push(...pageBusiness);

          // Get next page URL
          const nextUrl = await this.getNextPageUrl();
          if (!nextUrl) break;
          currentUrl = nextUrl;

          // Rate limiting - wait between pages
          await this.delay(2000 + Math.random() * 2000);
        } catch (err: any) {
          errors.push(`Page ${page}: ${err.message}`);
          console.error(`  ⚠️ Error on page ${page}: ${err.message}`);
          break;
        }
      }

      // Trim to maxResults
      const finalBusinesses = businesses.slice(0, maxResults);

      // Enrich with detailed info (website URLs)
      console.log(`  📞 Enriching ${finalBusinesses.length} businesses with details...`);
      const enriched = await this.enrichBusinesses(finalBusinesses);

      // Apply website filters
      let filtered = enriched;
      if (noWebsiteOnly) {
        filtered = enriched.filter(b => YelpScraper.hasNoRealWebsite(b));
        console.log(`  🎯 Filtered to ${filtered.length} businesses WITHOUT websites`);
      } else if (hasWebsiteOnly) {
        filtered = enriched.filter(b => !YelpScraper.hasNoRealWebsite(b));
        console.log(`  🎯 Filtered to ${filtered.length} businesses WITH websites`);
      }

      return {
        businesses: filtered,
        totalFound: businesses.length,
        pagesScraped,
        errors,
      };
    } finally {
      await this.close();
    }
  }

  /**
   * Initialize browser
   */
  private async init(): Promise<void> {
    if (this.browser) return;

    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await this.browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });

    this.page = await context.newPage();

    // Block unnecessary resources
    await this.page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', route => route.abort());
    await this.page.route('**/analytics**', route => route.abort());
    await this.page.route('**/tracking**', route => route.abort());
  }

  /**
   * Close browser
   */
  private async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Build Yelp search URL
   */
  private buildSearchUrl(query: string, location: string, sortBy: string): string {
    const params = new URLSearchParams({
      find_desc: query,
      find_loc: location,
    });

    // Sort parameter
    if (sortBy === 'highest_rated') {
      params.set('sortby', 'rating');
    } else if (sortBy === 'most_reviewed') {
      params.set('sortby', 'review_count');
    }

    return `https://www.yelp.com/search?${params.toString()}`;
  }

  /**
   * Scrape a single search results page
   */
  private async scrapePage(url: string): Promise<YelpBusiness[]> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for results to load
    await this.page.waitForSelector('[data-testid="serp-ia-card"]', { timeout: 10000 }).catch(() => {});

    // Extract business cards
    const businesses = await this.page.evaluate(() => {
      const results: any[] = [];

      // Multiple possible selectors for business cards
      const cardSelectors = [
        '[data-testid="serp-ia-card"]',
        '.businessName__09f24__EYSZE',
        '.css-1m051bw',
        'div[class*="container__"] h3 a',
      ];

      // Try each selector
      for (const selector of cardSelectors) {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
          cards.forEach(card => {
            try {
              // Find the container element
              const container = card.closest('[class*="container__"]') || card.closest('[data-testid]') || card.parentElement?.parentElement;
              if (!container) return;

              // Extract name and Yelp URL
              const nameLink = container.querySelector('a[href*="/biz/"]') as HTMLAnchorElement;
              if (!nameLink) return;

              const name = nameLink.textContent?.trim() || '';
              const yelpUrl = nameLink.href;

              // Skip if already added
              if (results.some(r => r.yelpUrl === yelpUrl)) return;

              // Extract rating
              const ratingEl = container.querySelector('[aria-label*="star rating"]') as HTMLElement;
              const ratingMatch = ratingEl?.getAttribute('aria-label')?.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

              // Extract review count
              const reviewEl = container.querySelector('[class*="reviewCount"]') || container.querySelector('span:has-text("reviews")');
              const reviewText = reviewEl?.textContent || '';
              const reviewMatch = reviewText.match(/(\d+)/);
              const reviewCount = reviewMatch ? parseInt(reviewMatch[1], 10) : undefined;

              // Extract address
              const addressEl = container.querySelector('[class*="secondaryAttributes"]') || container.querySelector('address');
              const address = addressEl?.textContent?.trim() || '';

              // Extract phone (if visible)
              const phoneEl = container.querySelector('[class*="phone"]');
              const phone = phoneEl?.textContent?.trim() || '';

              // Extract categories
              const categoryEls = container.querySelectorAll('[class*="category"] a, [class*="priceCategory"] a');
              const categories = Array.from(categoryEls).map(el => el.textContent?.trim()).filter(Boolean) as string[];

              // Extract price range
              const priceEl = container.querySelector('[class*="priceRange"]');
              const priceRange = priceEl?.textContent?.trim() || '';

              results.push({
                name,
                yelpUrl,
                rating,
                reviewCount,
                address,
                phone,
                categories,
                priceRange,
              });
            } catch {
              // Skip problematic cards
            }
          });
          break;
        }
      }

      return results;
    });

    return businesses.map(b => ({
      name: b.name,
      url: '', // Will be filled in during enrichment
      yelpUrl: b.yelpUrl,
      phone: b.phone || undefined,
      address: b.address || undefined,
      rating: b.rating,
      reviewCount: b.reviewCount,
      categories: b.categories,
      priceRange: b.priceRange,
    }));
  }

  /**
   * Get URL for next page of results
   */
  private async getNextPageUrl(): Promise<string | null> {
    if (!this.page) return null;

    const nextUrl = await this.page.evaluate(() => {
      const nextLink = document.querySelector('a[class*="next-link"], a[aria-label="Next"]') as HTMLAnchorElement;
      return nextLink?.href || null;
    });

    return nextUrl;
  }

  /**
   * Enrich businesses with website URLs from their Yelp pages
   */
  private async enrichBusinesses(businesses: YelpBusiness[]): Promise<YelpBusiness[]> {
    const enriched: YelpBusiness[] = [];

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];

      try {
        if (!this.page) throw new Error('Browser not initialized');

        // Visit business page
        await this.page.goto(business.yelpUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Extract website URL and additional details
        const details = await this.page.evaluate(() => {
          // Website URL
          const websiteLink = document.querySelector('a[href*="biz_redir"][class*="external"]') as HTMLAnchorElement ||
                             document.querySelector('p:has-text("Business website") + p a') as HTMLAnchorElement ||
                             document.querySelector('a[href*="/biz_redir"]') as HTMLAnchorElement;
          let websiteUrl = '';
          if (websiteLink) {
            // Extract actual URL from Yelp redirect
            const href = websiteLink.href;
            const urlMatch = href.match(/url=([^&]+)/);
            websiteUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : href;
          }

          // Phone number
          const phoneLink = document.querySelector('a[href^="tel:"]') as HTMLAnchorElement;
          const phone = phoneLink?.href.replace('tel:', '') || '';

          // Full address
          const addressEl = document.querySelector('[class*="address"]') || document.querySelector('address');
          const address = addressEl?.textContent?.trim() || '';

          return { websiteUrl, phone, address };
        });

        enriched.push({
          ...business,
          url: details.websiteUrl,
          phone: details.phone || business.phone,
          address: details.address || business.address,
        });

        // Rate limiting
        if (i < businesses.length - 1) {
          await this.delay(1000 + Math.random() * 1500);
        }
      } catch (err: any) {
        // Keep business without enrichment
        enriched.push(business);
        console.warn(`  ⚠️ Could not enrich ${business.name}: ${err.message}`);
      }
    }

    return enriched;
  }

  /**
   * Parse address into components
   */
  static parseAddress(address: string): { address?: string; city?: string; state?: string; zip?: string } {
    if (!address) return {};

    // Common pattern: "123 Main St, City, ST 12345"
    const match = address.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);
    if (match) {
      return {
        address: match[1]?.trim(),
        city: match[2]?.trim(),
        state: match[3]?.trim(),
        zip: match[4]?.trim(),
      };
    }

    // Try simpler pattern: "City, ST 12345"
    const simpleMatch = address.match(/([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);
    if (simpleMatch) {
      return {
        city: simpleMatch[1]?.trim(),
        state: simpleMatch[2]?.trim(),
        zip: simpleMatch[3]?.trim(),
      };
    }

    return { address };
  }

  /**
   * Check if a business has no real website (only social/directory pages)
   */
  static hasNoRealWebsite(business: YelpBusiness): boolean {
    const url = business.url || '';

    // No URL at all
    if (!url || url.trim() === '') return true;

    // Check for placeholder/directory URLs that aren't real websites
    const notRealWebsiteIndicators = [
      'facebook.com',
      'yelp.com',
      'yellowpages.com',
      'google.com/maps',
      'google.com/business',
      'linkedin.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'nextdoor.com',
      'thumbtack.com',
      'angi.com',
      'angieslist.com',
      'homeadvisor.com',
      'bbb.org',
      'manta.com',
      'mapquest.com',
      'superpages.com',
      'citysearch.com',
      'foursquare.com',
    ];

    const lowerUrl = url.toLowerCase();
    return notRealWebsiteIndicators.some(indicator => lowerUrl.includes(indicator));
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convenience function for quick searches
 */
export async function searchYelp(options: YelpSearchOptions): Promise<YelpSearchResult> {
  const scraper = new YelpScraper();
  return scraper.search(options);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args.find(a => !a.startsWith('--')) || 'plumbers';
  const location = args.filter(a => !a.startsWith('--'))[1] || 'Phoenix, AZ';
  const maxResults = parseInt(args.filter(a => !a.startsWith('--'))[2] || '20', 10);
  const noWebsiteOnly = args.includes('--no-website');
  const hasWebsiteOnly = args.includes('--has-website');

  console.log(`\n🔎 Yelp Scraper\n`);
  console.log(`Query: ${query}`);
  console.log(`Location: ${location}`);
  console.log(`Max Results: ${maxResults}`);
  if (noWebsiteOnly) console.log(`Filter: NO WEBSITE ONLY (ideal leads!)`);
  if (hasWebsiteOnly) console.log(`Filter: HAS WEBSITE ONLY`);
  console.log();

  searchYelp({ query, location, maxResults, noWebsiteOnly, hasWebsiteOnly })
    .then(result => {
      console.log(`\n📋 Results:`);
      console.log(`  Total found: ${result.totalFound}`);
      console.log(`  Pages scraped: ${result.pagesScraped}`);
      console.log(`  Errors: ${result.errors.length}`);

      console.log(`\n📊 Businesses with websites:`);
      const withWebsites = result.businesses.filter(b => b.url);
      console.log(`  ${withWebsites.length} / ${result.businesses.length} have websites`);

      console.log(`\n📋 Sample (first 10):`);
      for (const biz of result.businesses.slice(0, 10)) {
        console.log(`  ${biz.name}`);
        console.log(`    Yelp: ${biz.yelpUrl}`);
        console.log(`    Website: ${biz.url || 'none'}`);
        console.log(`    Phone: ${biz.phone || 'none'}`);
        console.log(`    Rating: ${biz.rating || '?'} (${biz.reviewCount || 0} reviews)`);
        console.log();
      }

      // Output CSV for easy import
      if (process.argv.includes('--csv')) {
        console.log(`\n--- CSV OUTPUT ---`);
        console.log(`name,website_url,phone,city,state,rating,reviews`);
        for (const biz of result.businesses) {
          const parsed = YelpScraper.parseAddress(biz.address || '');
          console.log(`"${biz.name}","${biz.url || ''}","${biz.phone || ''}","${parsed.city || ''}","${parsed.state || ''}",${biz.rating || ''},${biz.reviewCount || ''}`);
        }
      }
    })
    .catch(err => {
      console.error(`\n❌ Error: ${err.message}`);
      process.exit(1);
    });
}
