import * as fs from 'fs';
import * as path from 'path';
import { CaptureResult } from './website-capture';
import { DOMExtraction, extractDOM } from './dom-extractor';
import { StyleAnalysis, analyzeStyles } from './style-analyzer';

export interface WebsiteManifest {
  url: string;
  capturedAt: string;
  screenshotPath: string;
  dom: DOMExtraction;
  styles: StyleAnalysis;
  links: string[];
  summary: ManifestSummary;
}

export interface ManifestSummary {
  pageTitle: string;
  pageDescription?: string;
  sectionCount: number;
  imageCount: number;
  linkCount: number;
  hasNavigation: boolean;
  hasForms: boolean;
  primaryColors: string[];
  fonts: string[];
}

export function generateManifest(captureResult: CaptureResult): WebsiteManifest {
  const dom = extractDOM(captureResult.html);
  const styles = analyzeStyles(captureResult.html);

  const summary: ManifestSummary = {
    pageTitle: dom.metadata.title,
    pageDescription: dom.metadata.description,
    sectionCount: dom.sections.length,
    imageCount: dom.images.length,
    linkCount: captureResult.links.length,
    hasNavigation: dom.navigation.length > 0,
    hasForms: dom.forms.length > 0,
    primaryColors: styles.colors.primary.slice(0, 3),
    fonts: styles.fonts.families.slice(0, 3)
  };

  return {
    url: captureResult.url,
    capturedAt: captureResult.timestamp,
    screenshotPath: captureResult.screenshotPath,
    dom,
    styles,
    links: captureResult.links,
    summary
  };
}

export function saveManifest(manifest: WebsiteManifest, outputPath?: string): string {
  const urlObj = new URL(manifest.url);
  const sanitizedHost = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
  const timestamp = manifest.capturedAt.replace(/[:.]/g, '-');

  const filename = outputPath || path.join(
    'tmp/autowebsites',
    `${sanitizedHost}_${timestamp}_manifest.json`
  );

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, JSON.stringify(manifest, null, 2));
  console.log(`✓ Manifest saved: ${filename}`);

  return filename;
}

export function loadManifest(manifestPath: string): WebsiteManifest {
  const content = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(content) as WebsiteManifest;
}
