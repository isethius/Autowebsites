import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { chromium, Browser } from 'playwright';
import { logger } from '../utils/logger';
import { ThemeGridOptions, ThemeGridResult } from './types';

// Theme names for the grid labels
const THEME_NAMES = [
  'Aurora',
  'Nebula',
  'Cascade',
  'Horizon',
  'Prism',
  'Zenith',
  'Ember',
  'Frost',
  'Verdant',
  'Onyx',
];

const DEFAULT_THUMBNAIL_WIDTH = 400;
const DEFAULT_THUMBNAIL_HEIGHT = 300;
const DEFAULT_THEME_COUNT = 5;

export class ThemeGridGenerator {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || 'tmp/autowebsites/grids';
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a grid image showing multiple theme previews
   * Layout: 3 themes on top row, 2 themes on bottom row (for 5 themes)
   */
  async generateThemeGrid(options: ThemeGridOptions): Promise<ThemeGridResult> {
    const {
      galleryDir,
      businessName,
      themeCount = DEFAULT_THEME_COUNT,
      thumbnailWidth = DEFAULT_THUMBNAIL_WIDTH,
      thumbnailHeight = DEFAULT_THUMBNAIL_HEIGHT,
    } = options;

    // Find theme HTML files
    const themeFiles = this.findThemeFiles(galleryDir, themeCount);

    if (themeFiles.length === 0) {
      throw new Error(`No theme files found in: ${galleryDir}`);
    }

    const actualThemeCount = Math.min(themeFiles.length, themeCount);
    const themeNames = THEME_NAMES.slice(0, actualThemeCount);

    logger.info('Generating theme grid', {
      galleryDir,
      themeCount: actualThemeCount,
      businessName,
    });

    // Capture screenshots of themes
    const screenshots = await this.captureThemeScreenshots(
      themeFiles,
      thumbnailWidth,
      thumbnailHeight
    );

    // Generate the grid image
    const outputPath = options.outputPath || path.join(this.outputDir, `preview-grid-${Date.now()}.png`);

    const result = await this.compositeGrid(
      screenshots,
      themeNames,
      businessName,
      outputPath,
      thumbnailWidth,
      thumbnailHeight
    );

    // Cleanup temporary screenshots
    for (const screenshot of screenshots) {
      if (fs.existsSync(screenshot)) {
        fs.unlinkSync(screenshot);
      }
    }

    return result;
  }

  /**
   * Find theme HTML files in the gallery directory
   */
  private findThemeFiles(galleryDir: string, maxCount: number): string[] {
    if (!fs.existsSync(galleryDir)) {
      throw new Error(`Gallery directory not found: ${galleryDir}`);
    }

    const files = fs.readdirSync(galleryDir)
      .filter(f => f.startsWith('theme-') && f.endsWith('.html'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/theme-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/theme-(\d+)/)?.[1] || '0');
        return numA - numB;
      })
      .slice(0, maxCount)
      .map(f => path.join(galleryDir, f));

    return files;
  }

  /**
   * Capture screenshots of theme HTML files using Playwright
   */
  private async captureThemeScreenshots(
    themePaths: string[],
    width: number,
    height: number
  ): Promise<string[]> {
    const screenshots: string[] = [];
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: width * 2, height: height * 2 }, // Capture at 2x for quality
        deviceScaleFactor: 2,
      });

      for (let i = 0; i < themePaths.length; i++) {
        const themePath = themePaths[i];

        if (!fs.existsSync(themePath)) {
          logger.warn(`Theme file not found: ${themePath}`);
          continue;
        }

        const page = await context.newPage();

        try {
          await page.goto(`file://${path.resolve(themePath)}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
          });

          // Wait for fonts and images
          await page.waitForTimeout(300);

          const screenshotPath = path.join(this.outputDir, `theme-${i}-temp.png`);

          await page.screenshot({
            path: screenshotPath,
            clip: { x: 0, y: 0, width: width * 2, height: height * 2 },
          });

          screenshots.push(screenshotPath);
        } catch (err: any) {
          logger.warn(`Failed to capture theme screenshot: ${themePath}`, { error: err.message });
        } finally {
          await page.close();
        }
      }

      return screenshots;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Composite screenshots into a grid with header and footer
   */
  private async compositeGrid(
    screenshots: string[],
    themeNames: string[],
    businessName: string,
    outputPath: string,
    thumbWidth: number,
    thumbHeight: number
  ): Promise<ThemeGridResult> {
    const count = screenshots.length;

    // Grid layout calculation
    // For 5 themes: 3 on top, 2 on bottom (centered)
    // For 3 themes: 3 on top
    // For 4 themes: 2 on top, 2 on bottom
    const topRowCount = count <= 3 ? count : Math.ceil(count / 2);
    const bottomRowCount = count - topRowCount;
    const hasBottomRow = bottomRowCount > 0;

    const padding = 16;
    const labelHeight = 32;
    const headerHeight = 60;
    const footerHeight = 48;

    const gridWidth = topRowCount * thumbWidth + (topRowCount + 1) * padding;
    const gridHeight = headerHeight +
      thumbHeight + labelHeight + padding +
      (hasBottomRow ? thumbHeight + labelHeight + padding : 0) +
      footerHeight;

    // Create base image with gradient background
    const baseImage = await sharp({
      create: {
        width: gridWidth,
        height: gridHeight,
        channels: 4,
        background: { r: 248, g: 250, b: 252, alpha: 1 }, // Light gray bg
      },
    }).png().toBuffer();

    // Prepare composite operations
    const composites: sharp.OverlayOptions[] = [];

    // Resize and add each theme thumbnail with label
    for (let i = 0; i < count; i++) {
      const screenshotPath = screenshots[i];
      if (!fs.existsSync(screenshotPath)) continue;

      const isTopRow = i < topRowCount;
      const rowIndex = isTopRow ? i : i - topRowCount;
      const rowCount = isTopRow ? topRowCount : bottomRowCount;

      // Center the row if it has fewer items
      const rowWidth = rowCount * thumbWidth + (rowCount - 1) * padding;
      const rowOffset = Math.floor((gridWidth - rowWidth) / 2);

      const x = rowOffset + rowIndex * (thumbWidth + padding);
      const y = headerHeight + (isTopRow ? 0 : thumbHeight + labelHeight + padding);

      // Resize screenshot to thumbnail size
      const thumbnail = await sharp(screenshotPath)
        .resize(thumbWidth, thumbHeight, { fit: 'cover', position: 'top' })
        .png()
        .toBuffer();

      // Add rounded corners and border
      const roundedThumbnail = await this.addRoundedBorder(thumbnail, thumbWidth, thumbHeight);

      composites.push({
        input: roundedThumbnail,
        left: x,
        top: y,
      });

      // Create label for this theme
      const themeName = themeNames[i] || `Theme ${i + 1}`;
      const labelBuffer = await this.createLabel(themeName, thumbWidth, labelHeight);

      composites.push({
        input: labelBuffer,
        left: x,
        top: y + thumbHeight + 4,
      });
    }

    // Add header
    const headerBuffer = await this.createHeader(businessName, gridWidth, headerHeight);
    composites.push({
      input: headerBuffer,
      left: 0,
      top: 0,
    });

    // Add footer CTA
    const footerBuffer = await this.createFooter(gridWidth, footerHeight);
    composites.push({
      input: footerBuffer,
      left: 0,
      top: gridHeight - footerHeight,
    });

    // Composite everything together
    const result = await sharp(baseImage)
      .composite(composites)
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);

    return {
      gridPath: outputPath,
      width: gridWidth,
      height: gridHeight,
      fileSize: stats.size,
      themeCount: count,
      themeNames: themeNames.slice(0, count),
    };
  }

  /**
   * Add rounded corners and border to thumbnail
   */
  private async addRoundedBorder(
    imageBuffer: Buffer,
    width: number,
    height: number
  ): Promise<Buffer> {
    const radius = 8;
    const borderWidth = 2;

    // Create rounded rectangle mask
    const mask = Buffer.from(
      `<svg width="${width}" height="${height}">
        <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>`
    );

    // Apply mask and add border
    return sharp(imageBuffer)
      .composite([
        {
          input: mask,
          blend: 'dest-in',
        },
      ])
      .extend({
        top: borderWidth,
        bottom: borderWidth,
        left: borderWidth,
        right: borderWidth,
        background: { r: 226, g: 232, b: 240, alpha: 1 }, // Border color
      })
      .png()
      .toBuffer();
  }

  /**
   * Create header with business name
   */
  private async createHeader(businessName: string, width: number, height: number): Promise<Buffer> {
    const text = `5 New Looks for ${businessName}`;
    const escapedText = this.escapeXml(text);

    const svg = `
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#1e293b"/>
        <text
          x="${width / 2}"
          y="${height / 2 + 6}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
          font-size="22"
          font-weight="600"
          fill="white"
        >${escapedText}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Create theme name label
   */
  private async createLabel(name: string, width: number, height: number): Promise<Buffer> {
    const escapedName = this.escapeXml(name);

    const svg = `
      <svg width="${width}" height="${height}">
        <text
          x="${width / 2}"
          y="${height / 2 + 4}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
          font-size="14"
          font-weight="500"
          fill="#475569"
        >${escapedName}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Create footer with CTA
   */
  private async createFooter(width: number, height: number): Promise<Buffer> {
    const svg = `
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#f1f5f9"/>
        <text
          x="${width / 2}"
          y="${height / 2 + 5}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
          font-size="16"
          font-weight="500"
          fill="#2563eb"
        >View all 10 designs →</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export function createThemeGridGenerator(outputDir?: string): ThemeGridGenerator {
  return new ThemeGridGenerator(outputDir);
}

/**
 * Convenience function to generate a theme grid
 */
export async function generateThemeGrid(options: ThemeGridOptions): Promise<ThemeGridResult> {
  const generator = new ThemeGridGenerator();
  return generator.generateThemeGrid(options);
}

// CLI entry point for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: npx tsx src/media/theme-grid.ts <gallery-dir> [--business "Business Name"]');
    process.exit(1);
  }

  const galleryDir = args[0];
  const businessIndex = args.indexOf('--business');
  const businessName = businessIndex !== -1 && args[businessIndex + 1]
    ? args[businessIndex + 1]
    : 'Your Business';

  const generator = new ThemeGridGenerator();

  generator
    .generateThemeGrid({
      galleryDir,
      businessName,
    })
    .then(result => {
      console.log('\nTheme grid generated:');
      console.log(`  Path: ${result.gridPath}`);
      console.log(`  Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
      console.log(`  Dimensions: ${result.width}x${result.height}`);
      console.log(`  Themes: ${result.themeCount} (${result.themeNames.join(', ')})`);
    })
    .catch(err => {
      console.error('Failed to generate theme grid:', err);
      process.exit(1);
    });
}
