/**
 * Yellow Pages Business Scraper
 *
 * Scrapes business listings from YellowPages.com search results.
 * Uses Playwright for browser automation.
 *
 * Usage:
 *   const scraper = new YellowPagesScraper();
 *   const results = await scraper.search({ query: 'plumbers', location: 'Phoenix, AZ' });
 */

import { chromium, Browser, Page } from 'playwright';

export interface YellowPagesBusiness {
  name: string;
  url: string;
  yellowPagesUrl: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  yearsInBusiness?: number;
  accredited?: boolean;
}

export interface YellowPagesSearchOptions {
  query: string;
  location: string;
  maxResults?: number;
  maxPages?: number;
  /** Filter to only businesses without a real website (just social/directory pages) */
  noWebsiteOnly?: boolean;
  /** Filter to only businesses with a real website */
  hasWebsiteOnly?: boolean;
}

export interface YellowPagesSearchResult {
  businesses: YellowPagesBusiness[];
  totalFound: number;
  pagesScraped: number;
  errors: string[];
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

export class YellowPagesScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private userAgent: string;

  constructor() {
    this.userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Search for businesses on Yellow Pages
   */
  async search(options: YellowPagesSearchOptions): Promise<YellowPagesSearchResult> {
    const { query, location, maxResults = 50, maxPages = 5, noWebsiteOnly = false, hasWebsiteOnly = false } = options;
    const businesses: YellowPagesBusiness[] = [];
    const errors: string[] = [];
    let pagesScraped = 0;

    try {
      await this.init();

      console.log(`🔍 Searching Yellow Pages: ${query} in ${location}`);

      let pageNum = 1;
      while (businesses.length < maxResults && pageNum <= maxPages) {
        pagesScraped++;

        try {
          const searchUrl = this.buildSearchUrl(query, location, pageNum);
          console.log(`  📄 Scraping page ${pageNum}...`);

          const pageBusinesses = await this.scrapePage(searchUrl);

          if (pageBusinesses.length === 0) {
            console.log(`  📭 No results on page ${pageNum}, stopping`);
            break;
          }

          businesses.push(...pageBusinesses);
          console.log(`  ✓ Found ${pageBusinesses.length} businesses (total: ${businesses.length})`);

          pageNum++;

          // Rate limiting
          if (pageNum <= maxPages && businesses.length < maxResults) {
            await this.delay(2000 + Math.random() * 2000);
          }
        } catch (err: any) {
          errors.push(`Page ${pageNum}: ${err.message}`);
          console.error(`  ⚠️ Error on page ${pageNum}: ${err.message}`);
          break;
        }
      }

      // Trim to maxResults
      const finalBusinesses = businesses.slice(0, maxResults);

      // Apply website filters
      let filtered = finalBusinesses;
      if (noWebsiteOnly) {
        filtered = finalBusinesses.filter(b => YellowPagesScraper.hasNoRealWebsite(b));
        console.log(`  🎯 Filtered to ${filtered.length} businesses WITHOUT websites`);
      } else if (hasWebsiteOnly) {
        filtered = finalBusinesses.filter(b => !YellowPagesScraper.hasNoRealWebsite(b));
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
    await this.page.route('**/ads**', route => route.abort());
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
   * Build Yellow Pages search URL
   */
  private buildSearchUrl(query: string, location: string, page: number): string {
    // Format: /search?search_terms=plumber&geo_location_terms=Phoenix%2C+AZ&page=1
    const params = new URLSearchParams({
      search_terms: query,
      geo_location_terms: location,
    });

    if (page > 1) {
      params.set('page', page.toString());
    }

    return `https://www.yellowpages.com/search?${params.toString()}`;
  }

  /**
   * Scrape a single search results page
   */
  private async scrapePage(url: string): Promise<YellowPagesBusiness[]> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for results
    await this.page.waitForSelector('.search-results .result', { timeout: 10000 }).catch(() => {});

    // Extract business listings
    const businesses = await this.page.evaluate(() => {
      const results: any[] = [];

      const listings = document.querySelectorAll('.search-results .result, .organic .result');

      listings.forEach(listing => {
        try {
          // Name and Yellow Pages URL
          const nameLink = listing.querySelector('.business-name a, a.business-name') as HTMLAnchorElement;
          if (!nameLink) return;

          const name = nameLink.textContent?.trim() || '';
          const yellowPagesUrl = nameLink.href;

          // Website URL (direct from listing)
          const websiteLink = listing.querySelector('a.track-visit-website') as HTMLAnchorElement;
          const url = websiteLink?.href || '';

          // Phone number
          const phoneEl = listing.querySelector('.phones.phone, .phone');
          const phone = phoneEl?.textContent?.trim() || '';

          // Address
          const streetEl = listing.querySelector('.street-address');
          const localityEl = listing.querySelector('.locality');
          const street = streetEl?.textContent?.trim() || '';
          const locality = localityEl?.textContent?.trim() || '';

          // Parse locality (City, ST ZIP)
          let city = '', state = '', zip = '';
          const localityMatch = locality.match(/([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);
          if (localityMatch) {
            city = localityMatch[1]?.trim() || '';
            state = localityMatch[2]?.trim() || '';
            zip = localityMatch[3]?.trim() || '';
          }

          const address = [street, locality].filter(Boolean).join(', ');

          // Rating
          const ratingEl = listing.querySelector('.ratings .count');
          const ratingMatch = ratingEl?.textContent?.match(/\((\d+)\)/);
          const reviewCount = ratingMatch ? parseInt(ratingMatch[1], 10) : undefined;

          const starsEl = listing.querySelector('.result-rating');
          const starsClass = starsEl?.className || '';
          const starsMatch = starsClass.match(/(\d+)/);
          const rating = starsMatch ? parseInt(starsMatch[1], 10) / 2 : undefined; // YP uses 0-10 scale

          // Categories
          const categoryEls = listing.querySelectorAll('.categories a');
          const categories = Array.from(categoryEls).map(el => el.textContent?.trim()).filter(Boolean) as string[];

          // Years in business
          const yearsEl = listing.querySelector('.years-in-business .number');
          const yearsInBusiness = yearsEl ? parseInt(yearsEl.textContent || '0', 10) : undefined;

          // Accredited (BBB, etc)
          const accredited = !!listing.querySelector('.accreditation');

          results.push({
            name,
            url,
            yellowPagesUrl,
            phone,
            address,
            city,
            state,
            zip,
            rating,
            reviewCount,
            categories,
            yearsInBusiness,
            accredited,
          });
        } catch {
          // Skip problematic listings
        }
      });

      return results;
    });

    return businesses;
  }

  /**
   * Enrich a single business with additional details from its Yellow Pages page
   */
  async enrichBusiness(business: YellowPagesBusiness): Promise<YellowPagesBusiness> {
    if (!this.page) {
      await this.init();
    }

    try {
      await this.page!.goto(business.yellowPagesUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const details = await this.page!.evaluate(() => {
        // Website URL
        const websiteLink = document.querySelector('a.website-link, a[href*="track=website"]') as HTMLAnchorElement;
        const url = websiteLink?.href || '';

        // Phone
        const phoneLink = document.querySelector('a.phone, a[href^="tel:"]') as HTMLAnchorElement;
        const phone = phoneLink?.textContent?.trim() || phoneLink?.href.replace('tel:', '') || '';

        // Email (sometimes available)
        const emailLink = document.querySelector('a.email-business, a[href^="mailto:"]') as HTMLAnchorElement;
        const email = emailLink?.href.replace('mailto:', '') || '';

        // Hours
        const hoursEl = document.querySelector('.open-details');
        const hours = hoursEl?.textContent?.trim() || '';

        return { url, phone, email, hours };
      });

      return {
        ...business,
        url: details.url || business.url,
        phone: details.phone || business.phone,
      };
    } catch (err: any) {
      console.warn(`  ⚠️ Could not enrich ${business.name}: ${err.message}`);
      return business;
    }
  }

  /**
   * Check if a business has no real website (only social/directory pages)
   */
  static hasNoRealWebsite(business: YellowPagesBusiness): boolean {
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
export async function searchYellowPages(options: YellowPagesSearchOptions): Promise<YellowPagesSearchResult> {
  const scraper = new YellowPagesScraper();
  return scraper.search(options);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args.find(a => !a.startsWith('--')) || 'plumbers';
  const location = args.filter(a => !a.startsWith('--'))[1] || 'Phoenix, AZ';
  const maxResults = parseInt(args.filter(a => !a.startsWith('--'))[2] || '30', 10);
  const noWebsiteOnly = args.includes('--no-website');
  const hasWebsiteOnly = args.includes('--has-website');

  console.log(`\n🔎 Yellow Pages Scraper\n`);
  console.log(`Query: ${query}`);
  console.log(`Location: ${location}`);
  console.log(`Max Results: ${maxResults}`);
  if (noWebsiteOnly) console.log(`Filter: NO WEBSITE ONLY (ideal leads!)`);
  if (hasWebsiteOnly) console.log(`Filter: HAS WEBSITE ONLY`);
  console.log();

  searchYellowPages({ query, location, maxResults, noWebsiteOnly, hasWebsiteOnly })
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
        console.log(`    Website: ${biz.url || 'none'}`);
        console.log(`    Phone: ${biz.phone || 'none'}`);
        console.log(`    Location: ${biz.city}, ${biz.state} ${biz.zip}`);
        if (biz.rating) console.log(`    Rating: ${biz.rating} (${biz.reviewCount || 0} reviews)`);
        if (biz.yearsInBusiness) console.log(`    Years in business: ${biz.yearsInBusiness}`);
        console.log();
      }

      // Output CSV for easy import
      if (process.argv.includes('--csv')) {
        console.log(`\n--- CSV OUTPUT ---`);
        console.log(`name,website_url,phone,city,state,zip,rating,reviews,years_in_business`);
        for (const biz of result.businesses) {
          console.log(`"${biz.name}","${biz.url || ''}","${biz.phone || ''}","${biz.city || ''}","${biz.state || ''}","${biz.zip || ''}",${biz.rating || ''},${biz.reviewCount || ''},${biz.yearsInBusiness || ''}`);
        }
      }
    })
    .catch(err => {
      console.error(`\n❌ Error: ${err.message}`);
      process.exit(1);
    });
}
