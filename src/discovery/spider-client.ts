/**
 * Spider Client - High-performance web crawler wrapper
 *
 * Wraps @spider-rs/spider-rs to provide:
 * - URL validation (single and bulk)
 * - Website crawling with configurable depth/limits
 * - Link extraction
 *
 * Spider is a Rust-based crawler capable of 150k+ pages in minutes.
 *
 * Note: If Spider native module isn't available, falls back to fetch-based implementation.
 */

// Try to import Spider, fall back to null if not available
let Website: any = null;
let spiderCrawl: any = null;
let spiderAvailable = false;

try {
  const spider = require('@spider-rs/spider-rs');
  Website = spider.Website;
  spiderCrawl = spider.crawl;
  spiderAvailable = true;
} catch (err) {
  // Spider not available - will use fallback implementation
  console.warn('Spider native module not available. Using fallback fetch-based implementation.');
  console.warn('To enable Spider, install Rust: curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh');
  console.warn('Then reinstall: npm install @spider-rs/spider-rs');
}

export interface SpiderOptions {
  timeout?: number;       // Request timeout in ms (default: 10000)
  maxDepth?: number;      // How deep to crawl (default: 2)
  maxPages?: number;      // Max pages to visit (default: 10)
  respectRobots?: boolean; // Respect robots.txt (default: true)
  userAgent?: string;     // Custom user agent
}

export interface ValidationResult {
  valid: boolean;
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
  responseTime?: number;
}

export interface CrawlResult {
  url: string;
  pages: PageInfo[];
  links: string[];
  totalPages: number;
  errors: string[];
}

export interface PageInfo {
  url: string;
  statusCode: number;
  content: string;
  title?: string;
}

const DEFAULT_OPTIONS: Required<SpiderOptions> = {
  timeout: 10000,
  maxDepth: 2,
  maxPages: 10,
  respectRobots: true,
  userAgent: 'Mozilla/5.0 (compatible; AutoWebsites/1.0; +https://autowebsites.pro)',
};

export class SpiderClient {
  private options: Required<SpiderOptions>;

  constructor(options?: SpiderOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if a single URL is valid (returns status code or null if dead)
   */
  async validateUrl(url: string): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      if (!normalizedUrl) {
        return { valid: false, error: 'Invalid URL format' };
      }

      // Use fetch with timeout for quick validation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      try {
        const response = await fetch(normalizedUrl, {
          method: 'HEAD', // Use HEAD for faster validation
          signal: controller.signal,
          redirect: 'manual', // Don't follow redirects automatically
          headers: {
            'User-Agent': this.options.userAgent,
          },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // Check for redirects
        if (response.status >= 300 && response.status < 400) {
          const redirectUrl = response.headers.get('location');
          return {
            valid: true,
            statusCode: response.status,
            redirectUrl: redirectUrl || undefined,
            responseTime,
          };
        }

        // Check if successful
        const valid = response.status >= 200 && response.status < 400;
        return {
          valid,
          statusCode: response.status,
          responseTime,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          return {
            valid: false,
            error: 'Timeout',
            responseTime: this.options.timeout,
          };
        }

        // Try GET as fallback (some servers don't support HEAD)
        const getResponse = await fetch(normalizedUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(this.options.timeout),
          headers: {
            'User-Agent': this.options.userAgent,
          },
        });

        const responseTime = Date.now() - startTime;
        const valid = getResponse.status >= 200 && getResponse.status < 400;

        return {
          valid,
          statusCode: getResponse.status,
          responseTime,
        };
      }
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Crawl a website and return all discovered pages
   */
  async crawl(url: string, options?: SpiderOptions): Promise<CrawlResult> {
    const opts = { ...this.options, ...options };
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return {
        url,
        pages: [],
        links: [],
        totalPages: 0,
        errors: ['Invalid URL format'],
      };
    }

    const pages: PageInfo[] = [];
    const errors: string[] = [];

    // Use Spider if available, otherwise fallback to fetch-based crawl
    if (spiderAvailable && Website) {
      try {
        // Build website crawler with budget limits
        const website = new Website(normalizedUrl)
          .withBudget({
            '*': opts.maxPages,
          })
          .withRespectRobotsTxt(opts.respectRobots)
          .withUserAgent(opts.userAgent)
          .withDepth(opts.maxDepth)
          .build();

        // Crawl with page event handler
        const onPageEvent = (err: any, page: any) => {
          if (err) {
            errors.push(err.message || String(err));
            return;
          }

          if (page) {
            pages.push({
              url: page.url,
              statusCode: page.statusCode,
              content: page.content || '',
              title: this.extractTitle(page.content || ''),
            });
          }
        };

        await website.crawl(onPageEvent);

        const links = website.getLinks() || [];

        return {
          url: normalizedUrl,
          pages,
          links,
          totalPages: pages.length,
          errors,
        };
      } catch (err: any) {
        errors.push(err.message || 'Crawl failed');
        return {
          url: normalizedUrl,
          pages,
          links: [],
          totalPages: pages.length,
          errors,
        };
      }
    } else {
      // Fallback: Simple fetch-based crawl
      return this.fallbackCrawl(normalizedUrl, opts);
    }
  }

  /**
   * Fallback crawl using fetch (when Spider is not available)
   */
  private async fallbackCrawl(url: string, opts: Required<SpiderOptions>): Promise<CrawlResult> {
    const pages: PageInfo[] = [];
    const errors: string[] = [];
    const visited = new Set<string>();
    const toVisit: Array<{ url: string; depth: number }> = [{ url, depth: 0 }];
    const allLinks: string[] = [];

    while (toVisit.length > 0 && pages.length < opts.maxPages) {
      const current = toVisit.shift()!;

      if (visited.has(current.url) || current.depth > opts.maxDepth) {
        continue;
      }
      visited.add(current.url);

      try {
        const response = await fetch(current.url, {
          headers: { 'User-Agent': opts.userAgent },
          signal: AbortSignal.timeout(opts.timeout),
          redirect: 'follow',
        });

        const content = await response.text();
        pages.push({
          url: current.url,
          statusCode: response.status,
          content,
          title: this.extractTitle(content),
        });

        // Extract links for next depth level
        if (current.depth < opts.maxDepth) {
          const links = this.extractLinks(content, current.url);
          const baseHost = new URL(url).hostname;

          for (const link of links) {
            try {
              const linkHost = new URL(link).hostname;
              // Only follow same-domain links
              if (linkHost === baseHost && !visited.has(link)) {
                toVisit.push({ url: link, depth: current.depth + 1 });
                allLinks.push(link);
              }
            } catch {
              // Invalid URL
            }
          }
        }
      } catch (err: any) {
        errors.push(`Failed to fetch ${current.url}: ${err.message}`);
      }
    }

    return {
      url,
      pages,
      links: Array.from(new Set(allLinks)),
      totalPages: pages.length,
      errors,
    };
  }

  /**
   * Validate multiple URLs in parallel (bulk operation)
   */
  async validateBulk(
    urls: string[],
    concurrency: number = 10
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    // Process in chunks for controlled concurrency
    const chunks = this.chunk(urls, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (url) => {
          const result = await this.validateUrl(url);
          return { url, result };
        })
      );

      for (const { url, result } of chunkResults) {
        results.set(url, result);
      }
    }

    return results;
  }

  /**
   * Extract all links from a page
   */
  async getLinks(url: string): Promise<string[]> {
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return [];
    }

    // Try Spider first if available
    if (spiderAvailable && spiderCrawl) {
      try {
        const { links } = await spiderCrawl(normalizedUrl);
        return links || [];
      } catch (err: any) {
        // Fall through to fetch fallback
      }
    }

    // Fallback: fetch and parse manually
    try {
      const response = await fetch(normalizedUrl, {
        headers: { 'User-Agent': this.options.userAgent },
        signal: AbortSignal.timeout(this.options.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      return this.extractLinks(html, normalizedUrl);
    } catch {
      return [];
    }
  }

  /**
   * Quick check if URL exists (faster than full validation)
   */
  async urlExists(url: string): Promise<boolean> {
    const result = await this.validateUrl(url);
    return result.valid;
  }

  /**
   * Normalize URL to ensure it has protocol
   */
  private normalizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    let normalized = url.trim();

    // Add protocol if missing
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }

    try {
      const parsed = new URL(normalized);
      // Basic validation
      if (!parsed.hostname || parsed.hostname.length < 4) {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }

  /**
   * Extract title from HTML content
   */
  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract links from HTML content
   */
  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const regex = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const href = match[1];
        // Skip anchors, javascript, mailto
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
          continue;
        }

        // Resolve relative URLs
        const resolved = new URL(href, baseUrl).href;
        links.push(resolved);
      } catch {
        // Invalid URL, skip
      }
    }

    return Array.from(new Set(links));
  }

  /**
   * Split array into chunks
   */
  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance with default options
let defaultInstance: SpiderClient | null = null;

export function getSpiderClient(options?: SpiderOptions): SpiderClient {
  if (!defaultInstance || options) {
    defaultInstance = new SpiderClient(options);
  }
  return defaultInstance;
}

/**
 * Check if Spider native module is available
 */
export function isSpiderAvailable(): boolean {
  return spiderAvailable;
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2] || 'https://google.com';

  console.log(`\n🕷️  Spider Client Test\n`);
  console.log(`Testing URL: ${url}\n`);

  const spider = new SpiderClient();

  spider.validateUrl(url)
    .then(result => {
      console.log('Validation Result:', JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
