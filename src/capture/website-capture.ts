import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface CaptureResult {
  url: string;
  screenshotPath: string;
  html: string;
  links: string[];
  timestamp: string;
}

export interface CaptureOptions {
  url: string;
  outputDir?: string;
  fullPage?: boolean;
  timeout?: number;
}

export async function captureWebsite(options: CaptureOptions): Promise<CaptureResult> {
  const { url, outputDir = 'tmp/autowebsites/screenshots', fullPage = true, timeout = 30000 } = options;

  // Ensure output directory exists
  const screenshotDir = path.resolve(outputDir);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page: Page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout });

    // Generate screenshot filename from URL
    const urlObj = new URL(url);
    const sanitizedHost = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFilename = `${sanitizedHost}_${timestamp}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotFilename);

    // Take screenshot
    await page.screenshot({ path: screenshotPath, fullPage });

    // Extract HTML content
    const html = await page.content();

    // Extract all links
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]');
      return Array.from(anchors)
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('#'));
    });

    // Remove duplicates
    const uniqueLinks = [...new Set(links)];

    const result: CaptureResult = {
      url,
      screenshotPath,
      html,
      links: uniqueLinks,
      timestamp: new Date().toISOString()
    };

    console.log(`✓ Captured ${url}`);
    console.log(`  Screenshot: ${screenshotPath}`);
    console.log(`  Found ${uniqueLinks.length} links`);

    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2] || 'https://example.com';
  captureWebsite({ url })
    .then(result => {
      console.log('\nCapture complete:', JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('Capture failed:', err);
      process.exit(1);
    });
}
