import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser } from 'playwright';
import { BeforeAfterGenerator } from './before-after-generator';
import { MediaStorage } from './storage';
import { BeforeAfterResult, MediaAsset } from './types';
import { logger } from '../utils/logger';

export interface MediaGeneratorConfig {
  outputDir?: string;
  uploadToStorage?: boolean;
  storageBucket?: string;
  storageFolder?: string;
}

export interface GenerateMediaOptions {
  leadId: string;
  businessName: string;
  beforeScreenshotPath?: string;
  beforeScreenshotUrl?: string;
  galleryDir?: string;
  themeIndex?: number; // Which theme to use as "after" (default: 0 = first theme)
  width?: number;
  height?: number;
}

export interface GeneratedMedia {
  beforeAfterGif?: {
    localPath: string;
    url?: string;
    result: BeforeAfterResult;
  };
}

export class MediaGenerator {
  private outputDir: string;
  private uploadToStorage: boolean;
  private storageBucket: string;
  private storageFolder: string;
  private beforeAfterGenerator: BeforeAfterGenerator;
  private mediaStorage?: MediaStorage;

  constructor(config: MediaGeneratorConfig = {}) {
    this.outputDir = config.outputDir || 'tmp/autowebsites/media';
    this.uploadToStorage = config.uploadToStorage ?? true;
    this.storageBucket = config.storageBucket || 'media';
    this.storageFolder = config.storageFolder || 'before-after';
    this.beforeAfterGenerator = new BeforeAfterGenerator();

    if (this.uploadToStorage) {
      try {
        this.mediaStorage = new MediaStorage();
      } catch (error) {
        logger.warn('MediaStorage not available, files will only be saved locally');
        this.uploadToStorage = false;
      }
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate all media assets for a lead
   */
  async generateForLead(options: GenerateMediaOptions): Promise<GeneratedMedia> {
    const result: GeneratedMedia = {};

    logger.info(`Generating media for lead: ${options.leadId}`, { businessName: options.businessName });

    // Get "before" screenshot
    let beforePath: string;

    if (options.beforeScreenshotPath && fs.existsSync(options.beforeScreenshotPath)) {
      beforePath = options.beforeScreenshotPath;
    } else if (options.beforeScreenshotUrl) {
      // Download the screenshot from URL
      beforePath = await this.downloadImage(options.beforeScreenshotUrl, options.leadId, 'before');
    } else {
      throw new Error('Either beforeScreenshotPath or beforeScreenshotUrl is required');
    }

    // Get "after" screenshot from gallery theme
    let afterPath: string;

    if (options.galleryDir && fs.existsSync(options.galleryDir)) {
      afterPath = await this.captureThemeScreenshot(
        options.galleryDir,
        options.themeIndex || 0,
        options.leadId,
        options.width,
        options.height
      );
    } else {
      throw new Error('galleryDir is required to generate before/after GIF');
    }

    // Generate before/after GIF
    const outputPath = path.join(this.outputDir, `${options.leadId}-before-after.gif`);

    const gifResult = await this.beforeAfterGenerator.generate({
      beforeImagePath: beforePath,
      afterImagePath: afterPath,
      outputPath,
      width: options.width || 800,
      height: options.height || 600,
    });

    result.beforeAfterGif = {
      localPath: gifResult.gifPath,
      result: gifResult,
    };

    logger.info(`Generated before/after GIF: ${gifResult.gifPath}`, {
      size: `${(gifResult.fileSize / 1024).toFixed(1)}KB`,
      frames: gifResult.frameCount,
    });

    // Upload to storage if configured
    if (this.uploadToStorage && this.mediaStorage) {
      try {
        const stored = await this.mediaStorage.uploadFile(gifResult.gifPath, {
          bucket: this.storageBucket,
          folder: this.storageFolder,
        });

        result.beforeAfterGif.url = stored.url;
        logger.info(`Uploaded GIF to storage: ${stored.url}`);
      } catch (error: any) {
        logger.error('Failed to upload GIF to storage', { error: error.message });
      }
    }

    return result;
  }

  /**
   * Capture a screenshot of a theme HTML file
   */
  async captureThemeScreenshot(
    galleryDir: string,
    themeIndex: number,
    leadId: string,
    width: number = 800,
    height: number = 600
  ): Promise<string> {
    // Find theme files
    const themeFiles = fs.readdirSync(galleryDir)
      .filter(f => f.startsWith('theme-') && f.endsWith('.html'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/theme-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/theme-(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    if (themeFiles.length === 0) {
      throw new Error(`No theme files found in gallery: ${galleryDir}`);
    }

    const themeFile = themeFiles[Math.min(themeIndex, themeFiles.length - 1)];
    const themePath = path.join(galleryDir, themeFile);

    // Capture screenshot using Playwright
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: width * 2, height: height * 2 }, // Higher res for quality
      });

      const page = await context.newPage();

      // Load the theme HTML file
      await page.goto(`file://${path.resolve(themePath)}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait a moment for any animations/fonts to load
      await page.waitForTimeout(500);

      // Generate screenshot path
      const screenshotPath = path.join(this.outputDir, `${leadId}-theme-${themeIndex}.png`);

      await page.screenshot({
        path: screenshotPath,
        clip: { x: 0, y: 0, width: width * 2, height: height * 2 },
      });

      logger.info(`Captured theme screenshot: ${screenshotPath}`);

      return screenshotPath;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Download an image from URL to local path
   */
  private async downloadImage(url: string, leadId: string, suffix: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = this.getExtensionFromUrl(url) || '.png';
    const localPath = path.join(this.outputDir, `${leadId}-${suffix}${ext}`);

    fs.writeFileSync(localPath, buffer);
    logger.info(`Downloaded image: ${localPath}`);

    return localPath;
  }

  private getExtensionFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const ext = path.extname(pathname);
      return ext || '.png';
    } catch {
      return '.png';
    }
  }

  /**
   * Clean up temporary files for a lead
   */
  async cleanup(leadId: string): Promise<void> {
    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.startsWith(leadId));

    for (const file of files) {
      fs.unlinkSync(path.join(this.outputDir, file));
    }

    logger.info(`Cleaned up ${files.length} temporary files for lead: ${leadId}`);
  }
}

export function createMediaGenerator(config?: MediaGeneratorConfig): MediaGenerator {
  return new MediaGenerator(config);
}
