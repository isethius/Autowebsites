import { getClaudeClient, ClaudeClient } from './claude-client';
import { getIndustryTemplate, IndustryType, INDUSTRIES } from './industry-templates';
import { getVibeForIndustry, VIBES } from '../themes/engine/harmony/constraints';

export type VibeId = keyof typeof VIBES;

export interface VisualStyleAnalysis {
  colorSchemes: string[];
  dominantColors: string[];
  typography: {
    primaryFonts: string[];
    secondaryFonts: string[];
    style: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'script' | 'mixed' | 'unknown';
    notes: string[];
  };
  layoutPatterns: string[];
  designTraits: string[];
}

export interface VibeRecommendation {
  id: VibeId;
  name: string;
  fit: number; // 0-100
  rationale: string;
  adjustments?: string[];
}

export interface VibeAnalysis {
  currentVibe: {
    id: VibeId;
    name: string;
    confidence: number; // 0-100
    rationale: string;
  };
  recommendedVibes: VibeRecommendation[];
}

export interface WebsiteAnalysis {
  // Business identification
  businessName: string;
  industry: IndustryType;
  industryConfidence: number; // 0-100
  businessType: 'local' | 'regional' | 'national' | 'ecommerce';
  targetAudience: string;

  // Website quality assessment
  overallScore: number; // 1-10

  // Specific issues found
  issues: WebsiteIssue[];

  // Strengths to acknowledge
  strengths: string[];

  // Recommendations
  recommendations: Recommendation[];

  // Visual style + vibe analysis
  visualStyle: VisualStyleAnalysis;
  vibe: VibeAnalysis;

  // Estimated business impact
  estimatedImpact: {
    currentMonthlyVisitors: string;
    potentialIncrease: string;
    estimatedRevenueLoss: string;
  };

  // Key talking points for outreach
  talkingPoints: string[];

  // Raw analysis metadata
  analyzedAt: string;
  analysisVersion: string;
}

export interface WebsiteIssue {
  category: 'design' | 'mobile' | 'performance' | 'seo' | 'ux' | 'content' | 'trust' | 'conversion';
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  businessImpact: string;
  fixDifficulty: 'easy' | 'medium' | 'hard';
}

export interface Recommendation {
  priority: number; // 1-5, 1 being highest
  title: string;
  description: string;
  expectedOutcome: string;
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

interface AnalyzeOptions {
  html?: string;
  screenshotBase64?: string;
  url: string;
  existingScores?: {
    design: number;
    mobile: number;
    performance: number;
    seo: number;
  };
}

export class WebsiteAnalyzer {
  private client: ClaudeClient;

  constructor(client?: ClaudeClient) {
    this.client = client || getClaudeClient();
  }

  async analyze(options: AnalyzeOptions): Promise<WebsiteAnalysis> {
    const { html, url, existingScores } = options;

    // Build context for Claude
    const htmlSnippet = html ? this.extractRelevantHTML(html) : 'HTML not provided';
    const scoresContext = existingScores
      ? `Existing automated scores: Design: ${existingScores.design}/10, Mobile: ${existingScores.mobile}/10, Performance: ${existingScores.performance}/10, SEO: ${existingScores.seo}/10`
      : '';

    const detectedStyle = html ? this.extractStyleSignals(html) : this.getEmptyStyleSignals();
    const vibeCatalog = Object.values(VIBES)
      .map(vibe => `- ${vibe.id} (${vibe.name}): ${vibe.description}`)
      .join('\n');
    const vibeIds = Object.keys(VIBES).join(', ');

    const systemPrompt = `You are an expert website analyst and digital marketing consultant. Analyze websites to identify business opportunities and issues that affect their online success.

Your analysis should be:
- Specific and actionable, not generic
- Focused on business impact, not just technical issues
- Empathetic to small business owners who may not understand tech jargon
- Honest but constructive - acknowledge strengths too

Industries you commonly see: ${INDUSTRIES.join(', ')}

Available vibe IDs:
${vibeCatalog}`;

    const prompt = `Analyze this website and provide a detailed assessment.

URL: ${url}
${scoresContext}

HTML Content (excerpt):
${htmlSnippet}

Detected visual/style signals from HTML/CSS:
${JSON.stringify(detectedStyle, null, 2)}

Provide your analysis as a JSON object with this structure:
{
  "businessName": "detected business name",
  "industry": "one of: ${INDUSTRIES.join(', ')}",
  "industryConfidence": 0-100,
  "businessType": "local|regional|national|ecommerce",
  "targetAudience": "description of their target customers",
  "overallScore": 1-10,
  "issues": [
    {
      "category": "design|mobile|performance|seo|ux|content|trust|conversion",
      "severity": "critical|major|minor",
      "title": "short title",
      "description": "detailed description",
      "businessImpact": "how this affects their business",
      "fixDifficulty": "easy|medium|hard"
    }
  ],
  "strengths": ["list of positive things about the site"],
  "recommendations": [
    {
      "priority": 1-5,
      "title": "recommendation title",
      "description": "what to do",
      "expectedOutcome": "what will improve",
      "timeframe": "immediate|short-term|long-term"
    }
  ],
  "estimatedImpact": {
    "currentMonthlyVisitors": "estimate based on site quality",
    "potentialIncrease": "percentage potential improvement",
    "estimatedRevenueLoss": "rough estimate of missed revenue due to issues"
  },
  "talkingPoints": ["3-5 key points to mention when reaching out to this business"],
  "visualStyle": {
    "colorSchemes": ["light|dark|warm|cool|monochrome|pastel|neon|gradient|mixed"],
    "dominantColors": ["#hex colors or color names"],
    "typography": {
      "primaryFonts": ["font names"],
      "secondaryFonts": ["font names"],
      "style": "serif|sans-serif|monospace|display|script|mixed|unknown",
      "notes": ["short notes about typography choices"]
    },
    "layoutPatterns": ["hero, split, card-grid, bento, masonry, single-column, etc."],
    "designTraits": ["rounded, shadow, glass, flat, bold, minimal, etc."]
  },
  "vibe": {
    "currentVibe": {
      "id": "one of: ${vibeIds}",
      "name": "vibe name",
      "confidence": 0-100,
      "rationale": "why this vibe fits the existing site"
    },
    "recommendedVibes": [
      {
        "id": "one of: ${vibeIds}",
        "name": "vibe name",
        "fit": 0-100,
        "rationale": "why this vibe would improve results",
        "adjustments": ["specific adjustments to achieve this vibe"]
      }
    ]
  }
}

Be specific to THIS business - reference their actual content, services, and industry. Identify at least 3-5 issues and 3-5 recommendations.`;

    const analysis = await this.client.analyzeJSON<Omit<WebsiteAnalysis, 'analyzedAt' | 'analysisVersion'>>(prompt, {
      systemPrompt,
      maxTokens: 3000,
    });

    // Validate and enhance with industry template
    const validatedIndustry = this.validateIndustry(analysis.industry);
    const template = getIndustryTemplate(validatedIndustry);
    const fallbackVibe = getVibeForIndustry(validatedIndustry);

    const visualStyle = this.mergeStyleSignals(analysis.visualStyle, detectedStyle);
    const vibe = this.mergeVibeAnalysis(analysis.vibe, visualStyle, fallbackVibe.id as VibeId);

    // Add industry-specific insights if missing
    const enhancedAnalysis: WebsiteAnalysis = {
      ...analysis,
      industry: validatedIndustry,
      visualStyle,
      vibe,
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.1',
      // Ensure we have talking points
      talkingPoints: analysis.talkingPoints?.length
        ? analysis.talkingPoints
        : template.keyTalkingPoints.slice(0, 5),
    };

    return enhancedAnalysis;
  }

  async detectIndustry(html: string, url: string): Promise<{ industry: IndustryType; confidence: number }> {
    const snippet = this.extractRelevantHTML(html, 2000);

    const prompt = `Based on this website content, identify the business industry.

URL: ${url}
Content: ${snippet}

Respond with JSON: { "industry": "one of: ${INDUSTRIES.join(', ')}", "confidence": 0-100 }`;

    return this.client.analyzeJSON<{ industry: IndustryType; confidence: number }>(prompt, {
      maxTokens: 100,
    });
  }

  async generateQuickSummary(analysis: WebsiteAnalysis): Promise<string> {
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
    const majorIssues = analysis.issues.filter(i => i.severity === 'major');

    const prompt = `Write a 2-3 sentence summary of this website analysis for a busy business owner:

Business: ${analysis.businessName}
Industry: ${analysis.industry}
Score: ${analysis.overallScore}/10
Critical issues: ${criticalIssues.length}
Major issues: ${majorIssues.length}
Top issues: ${analysis.issues.slice(0, 3).map(i => i.title).join(', ')}

Keep it friendly, non-technical, and focused on business impact.`;

    const result = await this.client.complete(prompt, { maxTokens: 200 });
    return result.content;
  }

  private extractRelevantHTML(html: string, maxLength: number = 5000): string {
    // Remove script and style content
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ');

    // Extract key sections
    const sections: string[] = [];

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) sections.push(`Title: ${titleMatch[1]}`);

    // Meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) sections.push(`Description: ${descMatch[1]}`);

    // H1s
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
    if (h1Matches) sections.push(`H1s: ${h1Matches.slice(0, 3).map(h => h.replace(/<[^>]+>/g, '')).join(', ')}`);

    // Navigation links
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
    if (navMatch) {
      const links = navMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi);
      if (links) sections.push(`Navigation: ${links.slice(0, 10).map(l => l.replace(/<[^>]+>/g, '')).join(', ')}`);
    }

    // Footer (often has business info)
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    if (footerMatch) {
      const footerText = footerMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push(`Footer: ${footerText.substring(0, 500)}`);
    }

    // Main content
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<div[^>]+(?:class|id)=["'][^"']*(?:content|main)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (mainMatch) {
      const mainText = mainMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push(`Main Content: ${mainText.substring(0, 2000)}`);
    }

    const result = sections.join('\n\n');
    return result.substring(0, maxLength);
  }

  private extractStyleSignals(html: string): VisualStyleAnalysis {
    const cssText = this.extractCssText(html);
    const colorData = this.extractColors(cssText);
    const typography = this.extractTypography(cssText, html);
    const layoutPatterns = this.extractLayoutPatterns(html, cssText);
    const designTraits = this.extractDesignTraits(html, cssText);

    return {
      colorSchemes: colorData.schemes,
      dominantColors: colorData.dominant,
      typography,
      layoutPatterns,
      designTraits,
    };
  }

  private getEmptyStyleSignals(): VisualStyleAnalysis {
    return {
      colorSchemes: [],
      dominantColors: [],
      typography: {
        primaryFonts: [],
        secondaryFonts: [],
        style: 'unknown',
        notes: [],
      },
      layoutPatterns: [],
      designTraits: [],
    };
  }

  private mergeStyleSignals(
    aiStyle: Partial<VisualStyleAnalysis> | undefined,
    detected: VisualStyleAnalysis
  ): VisualStyleAnalysis {
    const mergedTypography: Partial<VisualStyleAnalysis['typography']> = aiStyle?.typography || {};

    return {
      colorSchemes: this.mergeList(aiStyle?.colorSchemes, detected.colorSchemes),
      dominantColors: this.mergeList(aiStyle?.dominantColors, detected.dominantColors),
      typography: {
        primaryFonts: this.mergeList(mergedTypography.primaryFonts, detected.typography.primaryFonts),
        secondaryFonts: this.mergeList(mergedTypography.secondaryFonts, detected.typography.secondaryFonts),
        style: mergedTypography.style ?? detected.typography.style,
        notes: this.mergeList(mergedTypography.notes, detected.typography.notes),
      },
      layoutPatterns: this.mergeList(aiStyle?.layoutPatterns, detected.layoutPatterns),
      designTraits: this.mergeList(aiStyle?.designTraits, detected.designTraits),
    };
  }

  private mergeVibeAnalysis(
    aiVibe: Partial<VibeAnalysis> | undefined,
    visualStyle: VisualStyleAnalysis,
    fallbackVibeId: VibeId
  ): VibeAnalysis {
    const fallbackVibe = VIBES[fallbackVibeId] || VIBES.trustworthy;
    const current = aiVibe?.currentVibe;
    const normalizedCurrentId = this.normalizeVibeId(current?.id || fallbackVibe.id);
    const currentVibe = VIBES[normalizedCurrentId] || fallbackVibe;

    const recommended = (aiVibe?.recommendedVibes || [])
      .map(rec => {
        const normalizedId = this.normalizeVibeId(rec.id);
        const vibe = VIBES[normalizedId] || fallbackVibe;
        return {
          id: normalizedId,
          name: rec.name || vibe.name,
          fit: rec.fit ?? 60,
          rationale: rec.rationale || `Aligns with a ${vibe.description.toLowerCase()}`,
          adjustments: rec.adjustments,
        };
      })
      .filter(rec => rec.id && rec.name);

    const recommendedVibes = recommended.length
      ? this.uniqueVibeRecommendations(recommended)
      : this.buildFallbackRecommendations(visualStyle, fallbackVibeId);

    return {
      currentVibe: {
        id: normalizedCurrentId,
        name: current?.name || currentVibe.name,
        confidence: current?.confidence ?? 45,
        rationale: current?.rationale || 'Inferred from the site visual style and layout cues.',
      },
      recommendedVibes,
    };
  }

  private uniqueVibeRecommendations(recs: VibeRecommendation[]): VibeRecommendation[] {
    const seen = new Set<string>();
    const unique: VibeRecommendation[] = [];
    for (const rec of recs) {
      if (seen.has(rec.id)) continue;
      seen.add(rec.id);
      unique.push(rec);
    }
    return unique;
  }

  private buildFallbackRecommendations(
    visualStyle: VisualStyleAnalysis,
    fallbackVibeId: VibeId
  ): VibeRecommendation[] {
    const primaryVibe = VIBES[fallbackVibeId] || VIBES.trustworthy;
    const secondaryVibeId = this.inferSecondaryVibe(visualStyle, fallbackVibeId);
    const secondaryVibe = VIBES[secondaryVibeId] || primaryVibe;

    const recommendations: VibeRecommendation[] = [
      {
        id: primaryVibe.id as VibeId,
        name: primaryVibe.name,
        fit: 70,
        rationale: `Strong default fit for ${primaryVibe.description.toLowerCase()}`,
        adjustments: ['Align imagery, typography, and layout with this vibe for consistency.'],
      },
    ];

    if (secondaryVibe.id !== primaryVibe.id) {
      recommendations.push({
        id: secondaryVibe.id as VibeId,
        name: secondaryVibe.name,
        fit: 55,
        rationale: `A complementary option based on the detected visual style cues.`,
        adjustments: ['Shift palette, typography, and layout details toward this direction.'],
      });
    }

    return recommendations;
  }

  private inferSecondaryVibe(visualStyle: VisualStyleAnalysis, fallbackVibeId: VibeId): VibeId {
    const schemes = new Set(visualStyle.colorSchemes.map(s => s.toLowerCase()));
    const layout = new Set(visualStyle.layoutPatterns.map(p => p.toLowerCase()));
    const traits = new Set(visualStyle.designTraits.map(t => t.toLowerCase()));
    const typographyStyle = visualStyle.typography.style;

    if (schemes.has('neon') || schemes.has('gradient') || layout.has('bento') || layout.has('asymmetric')) {
      return fallbackVibeId === 'maverick' ? 'creative' : 'maverick';
    }

    if (schemes.has('pastel') || schemes.has('warm') || traits.has('rounded')) {
      return fallbackVibeId === 'friendly' ? 'elegant' : 'friendly';
    }

    if (schemes.has('monochrome') || traits.has('minimal')) {
      return fallbackVibeId === 'minimal' ? 'executive' : 'minimal';
    }

    if (typographyStyle === 'serif' && (schemes.has('light') || schemes.has('monochrome'))) {
      return fallbackVibeId === 'elegant' ? 'executive' : 'elegant';
    }

    if (schemes.has('dark') || traits.has('bold')) {
      return fallbackVibeId === 'bold' ? 'maverick' : 'bold';
    }

    return fallbackVibeId;
  }

  private normalizeVibeId(input: string | undefined): VibeId {
    const normalized = (input || '').toLowerCase().trim();
    if (normalized in VIBES) return normalized as VibeId;

    const mappings: Record<string, VibeId> = {
      professional: 'executive',
      corporate: 'executive',
      luxury: 'elegant',
      luxe: 'elegant',
      minimalist: 'minimal',
      playful: 'friendly',
      warm: 'friendly',
      artistic: 'creative',
      edgy: 'maverick',
      startup: 'maverick',
      bold: 'bold',
      reliable: 'trustworthy',
      trusted: 'trustworthy',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key)) return value;
    }

    return 'trustworthy';
  }

  private mergeList(primary?: string[] | null, fallback?: string[] | null): string[] {
    const merged = [...(primary || []), ...(fallback || [])]
      .map(item => item.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of merged) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  private extractCssText(html: string): string {
    const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
    const inlineStyles = [...html.matchAll(/style=["']([^"']+)["']/gi)].map(match => match[1]);
    return [...styleBlocks, ...inlineStyles].join('\n');
  }

  private extractColors(cssText: string): { dominant: string[]; schemes: string[] } {
    const colorCounts = new Map<string, number>();
    const addColor = (color: string) => {
      const normalized = color.toLowerCase();
      colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
    };

    const hexMatches = cssText.match(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g) || [];
    for (const hex of hexMatches) {
      const normalized = this.normalizeHexColor(hex);
      if (normalized) addColor(normalized);
    }

    const rgbMatches = cssText.match(/rgba?\([^\)]+\)/gi) || [];
    for (const rgb of rgbMatches) {
      const normalized = this.normalizeRgbColor(rgb);
      if (normalized) addColor(normalized);
    }

    const namedColors = this.extractNamedColors(cssText);
    for (const named of namedColors) {
      addColor(named);
    }

    const sortedColors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
    const dominant = sortedColors.slice(0, 6).map(([color]) => color);
    const schemes = this.detectColorSchemes(sortedColors, /gradient\s*\(/i.test(cssText));

    return { dominant, schemes };
  }

  private normalizeHexColor(hex: string): string | null {
    const raw = hex.replace('#', '').trim();
    if (raw.length === 3 || raw.length === 4) {
      const chars = raw.slice(0, 3).split('');
      return `#${chars.map(ch => ch + ch).join('')}`.toLowerCase();
    }
    if (raw.length === 6 || raw.length === 8) {
      return `#${raw.slice(0, 6)}`.toLowerCase();
    }
    return null;
  }

  private normalizeRgbColor(rgb: string): string | null {
    const parts = rgb
      .replace(/rgba?\(/i, '')
      .replace(/\)/, '')
      .split(',')
      .map(value => value.trim())
      .slice(0, 3);

    if (parts.length !== 3) return null;

    const nums = parts.map(value => {
      if (value.endsWith('%')) {
        const pct = parseFloat(value.replace('%', ''));
        return Math.round((pct / 100) * 255);
      }
      return parseFloat(value);
    });

    if (nums.some(value => Number.isNaN(value))) return null;

    return `#${nums
      .map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private extractNamedColors(cssText: string): string[] {
    const colorMap: Record<string, string> = {
      black: '#000000',
      white: '#ffffff',
      gray: '#808080',
      grey: '#808080',
      red: '#ff0000',
      blue: '#0000ff',
      green: '#008000',
      yellow: '#ffff00',
      orange: '#ffa500',
      purple: '#800080',
      pink: '#ffc0cb',
      teal: '#008080',
      navy: '#000080',
      maroon: '#800000',
      olive: '#808000',
      gold: '#ffd700',
      silver: '#c0c0c0',
      beige: '#f5f5dc',
      brown: '#a52a2a',
    };

    const matches = cssText.match(/\b(black|white|gray|grey|red|blue|green|yellow|orange|purple|pink|teal|navy|maroon|olive|gold|silver|beige|brown)\b/gi) || [];
    return matches.map(match => colorMap[match.toLowerCase()]);
  }

  private detectColorSchemes(
    colors: Array<[string, number]>,
    hasGradient: boolean
  ): string[] {
    let total = 0;
    let light = 0;
    let dark = 0;
    let warm = 0;
    let cool = 0;
    let pastel = 0;
    let neon = 0;
    let monochrome = 0;

    for (const [color, count] of colors) {
      const rgb = this.hexToRgb(color);
      if (!rgb) continue;
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      total += count;

      if (hsl.l > 0.8) light += count;
      if (hsl.l < 0.25) dark += count;
      if (hsl.s < 0.12) monochrome += count;
      if (hsl.s > 0.75 && hsl.l > 0.5) neon += count;
      if (hsl.l > 0.7 && hsl.s < 0.45) pastel += count;
      if (hsl.h >= 330 || hsl.h <= 70) warm += count;
      if (hsl.h >= 140 && hsl.h <= 260) cool += count;
    }

    if (total === 0) return hasGradient ? ['gradient'] : [];

    const schemes: string[] = [];
    if (light / total > 0.4) schemes.push('light');
    if (dark / total > 0.3) schemes.push('dark');
    if (warm / total > 0.35) schemes.push('warm');
    if (cool / total > 0.35) schemes.push('cool');
    if (pastel / total > 0.2) schemes.push('pastel');
    if (neon / total > 0.15) schemes.push('neon');
    if (monochrome / total > 0.4) schemes.push('monochrome');
    if (hasGradient) schemes.push('gradient');

    if (!schemes.length) schemes.push('mixed');
    return schemes;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!hex.startsWith('#') || hex.length !== 7) return null;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if ([r, g, b].some(value => Number.isNaN(value))) return null;
    return { r, g, b };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l };
    }

    const diff = max - min;
    const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    let h = 0;
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / diff + 2;
        break;
      default:
        h = (rNorm - gNorm) / diff + 4;
        break;
    }
    h *= 60;

    return { h, s, l };
  }

  private extractTypography(cssText: string, html: string): VisualStyleAnalysis['typography'] {
    const fonts = new Map<string, number>();

    const fontMatches = cssText.match(/font-family\s*:\s*([^;]+);?/gi) || [];
    for (const match of fontMatches) {
      const value = match.replace(/font-family\s*:/i, '').trim();
      for (const font of this.parseFontList(value)) {
        fonts.set(font, (fonts.get(font) || 0) + 1);
      }
    }

    const googleFonts = this.extractGoogleFonts(html);
    for (const font of googleFonts) {
      fonts.set(font, (fonts.get(font) || 0) + 1);
    }

    const sortedFonts = [...fonts.entries()].sort((a, b) => b[1] - a[1]).map(([font]) => font);
    const primaryFonts = sortedFonts.slice(0, 2);
    const secondaryFonts = sortedFonts.slice(2, 5);

    const categories = new Set<string>();
    for (const font of sortedFonts) {
      const category = this.classifyFont(font);
      if (category !== 'unknown') categories.add(category);
    }

    let style: VisualStyleAnalysis['typography']['style'] = 'unknown';
    if (categories.size === 1) {
      style = categories.values().next().value as VisualStyleAnalysis['typography']['style'];
    } else if (categories.size > 1) {
      style = 'mixed';
    }

    const notes: string[] = [];
    if (primaryFonts.length) notes.push(`Primary fonts: ${primaryFonts.join(', ')}`);
    if (style !== 'unknown') notes.push(`Overall style: ${style}`);

    return {
      primaryFonts,
      secondaryFonts,
      style,
      notes,
    };
  }

  private parseFontList(raw: string): string[] {
    return raw
      .split(',')
      .map(font => font.replace(/["']/g, '').trim())
      .filter(font => font.length > 0)
      .map(font => this.normalizeFontName(font))
      .filter(Boolean);
  }

  private normalizeFontName(font: string): string {
    const cleaned = font.replace(/\s+/g, ' ').trim();
    return cleaned.toLowerCase() === 'inherit' ? '' : cleaned;
  }

  private extractGoogleFonts(html: string): string[] {
    const fonts: string[] = [];
    const matches = html.match(/fonts\.googleapis\.com[^"']+/gi) || [];
    for (const match of matches) {
      const url = match.split('"')[0];
      const familyMatches = url.match(/family=([^&]+)/gi) || [];
      for (const familyParam of familyMatches) {
        const family = familyParam.replace('family=', '').split('&')[0];
        family.split('|').forEach(item => {
          const name = decodeURIComponent(item.split(':')[0]).replace(/\+/g, ' ').trim();
          if (name) fonts.push(name);
        });
      }
    }
    return fonts;
  }

  private classifyFont(font: string): VisualStyleAnalysis['typography']['style'] | 'unknown' {
    const normalized = font.toLowerCase();
    if (normalized.includes('mono')) return 'monospace';
    if (normalized.includes('script') || normalized.includes('hand')) return 'script';
    if (normalized.includes('serif') && !normalized.includes('sans')) return 'serif';
    if (normalized.includes('sans') || normalized.includes('ui-sans') || normalized.includes('system-ui')) {
      return 'sans-serif';
    }

    const serifFonts = ['times', 'georgia', 'garamond', 'baskerville', 'bodoni', 'didot', 'playfair', 'merriweather', 'lora'];
    const sansFonts = ['arial', 'helvetica', 'verdana', 'tahoma', 'trebuchet', 'inter', 'roboto', 'open sans', 'lato', 'montserrat', 'poppins', 'source sans', 'nunito', 'fira sans', 'raleway', 'work sans'];
    const monoFonts = ['courier', 'consolas', 'menlo', 'monaco', 'fira mono', 'source code pro'];
    const displayFonts = ['oswald', 'bebas', 'impact', 'anton'];

    if (serifFonts.some(name => normalized.includes(name))) return 'serif';
    if (sansFonts.some(name => normalized.includes(name))) return 'sans-serif';
    if (monoFonts.some(name => normalized.includes(name))) return 'monospace';
    if (displayFonts.some(name => normalized.includes(name))) return 'display';

    return 'unknown';
  }

  private extractLayoutPatterns(html: string, cssText: string): string[] {
    const tokens = this.extractClassAndIdTokens(html);
    const patterns = new Set<string>();

    const hasToken = (keyword: string) => tokens.some(token => token.includes(keyword));

    if (/<nav\b/i.test(html) || hasToken('nav')) patterns.add('navigation');
    if (/<header\b/i.test(html) || hasToken('hero') || hasToken('banner') || hasToken('jumbotron')) patterns.add('hero');
    if (hasToken('split') || hasToken('two-column') || hasToken('two-col') || hasToken('columns')) patterns.add('split-layout');
    if (hasToken('grid') || hasToken('row') || hasToken('col-') || hasToken('column')) patterns.add('grid');
    if (hasToken('card') || hasToken('cards')) patterns.add('card-grid');
    if (hasToken('bento')) patterns.add('bento');
    if (hasToken('masonry')) patterns.add('masonry');
    if (hasToken('gallery') || hasToken('carousel') || hasToken('slider')) patterns.add('carousel');
    if (hasToken('testimonial') || hasToken('reviews')) patterns.add('testimonials');
    if (hasToken('pricing') || hasToken('plan')) patterns.add('pricing');
    if (hasToken('faq') || hasToken('accordion')) patterns.add('faq');
    if (hasToken('timeline')) patterns.add('timeline');
    if (hasToken('stats') || hasToken('metrics') || hasToken('numbers')) patterns.add('stats');
    if (hasToken('steps') || hasToken('process')) patterns.add('process');
    if (/<aside\b/i.test(html) || hasToken('sidebar')) patterns.add('sidebar');
    if (hasToken('full-bleed') || hasToken('fullwidth') || hasToken('full-width')) patterns.add('full-bleed');
    if (/position\s*:\s*sticky/i.test(cssText) || hasToken('sticky')) patterns.add('sticky-elements');

    return [...patterns];
  }

  private extractDesignTraits(html: string, cssText: string): string[] {
    const tokens = this.extractClassAndIdTokens(html);
    const traits = new Set<string>();

    if (/border-radius\s*:\s*(\d+)/i.test(cssText) || tokens.some(token => token.includes('rounded'))) {
      traits.add('rounded');
    }
    if (/box-shadow\s*:/i.test(cssText) || tokens.some(token => token.includes('shadow'))) {
      traits.add('shadow');
    }
    if (/backdrop-filter\s*:/i.test(cssText) || /filter\s*:\s*blur/i.test(cssText) || tokens.some(token => token.includes('glass'))) {
      traits.add('glass');
    }
    if (/linear-gradient|radial-gradient/i.test(cssText) || tokens.some(token => token.includes('gradient'))) {
      traits.add('gradient');
    }
    if (/text-transform\s*:\s*uppercase/i.test(cssText)) traits.add('uppercase');
    if (/letter-spacing\s*:/i.test(cssText)) traits.add('tracked');
    if (/text-decoration\s*:\s*underline/i.test(cssText)) traits.add('underlined');
    if (/border\s*:\s*1px\s+solid/i.test(cssText) || tokens.some(token => token.includes('outline') || token.includes('border'))) {
      traits.add('outlined');
    }
    if (tokens.some(token => token.includes('minimal'))) traits.add('minimal');
    if (tokens.some(token => token.includes('brutal') || token.includes('brutalist'))) traits.add('brutalist');
    if (tokens.some(token => token.includes('retro') || token.includes('vintage'))) traits.add('retro');

    return [...traits];
  }

  private extractClassAndIdTokens(html: string): string[] {
    const tokens: string[] = [];
    const classMatches = html.match(/class=["']([^"']+)["']/gi) || [];
    for (const match of classMatches) {
      const value = match.replace(/class=["']/i, '').replace(/["']$/, '');
      tokens.push(...value.split(/\s+/g));
    }

    const idMatches = html.match(/id=["']([^"']+)["']/gi) || [];
    for (const match of idMatches) {
      const value = match.replace(/id=["']/i, '').replace(/["']$/, '');
      tokens.push(value);
    }

    return tokens
      .flatMap(token => token.split(/[^a-zA-Z0-9-]+/g))
      .map(token => token.trim().toLowerCase())
      .filter(Boolean);
  }

  private validateIndustry(detected: string): IndustryType {
    const normalized = detected.toLowerCase().trim();

    // Direct match
    if (INDUSTRIES.includes(normalized as IndustryType)) {
      return normalized as IndustryType;
    }

    // Fuzzy matching
    const mappings: Record<string, IndustryType> = {
      'plumbing': 'plumbers',
      'legal': 'lawyers',
      'law': 'lawyers',
      'attorney': 'lawyers',
      'dental': 'dentists',
      'dentistry': 'dentists',
      'food': 'restaurants',
      'dining': 'restaurants',
      'hair': 'salons',
      'beauty': 'salons',
      'spa': 'salons',
      'medical': 'doctors',
      'healthcare': 'doctors',
      'physician': 'doctors',
      'construction': 'contractors',
      'builder': 'contractors',
      'building': 'contractors',
      'heating': 'hvac',
      'cooling': 'hvac',
      'air conditioning': 'hvac',
      'accounting': 'accountants',
      'tax': 'accountants',
      'cpa': 'accountants',
      'real estate': 'realtors',
      'realtor': 'realtors',
      'property': 'realtors',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return 'other';
  }
}

export function createWebsiteAnalyzer(client?: ClaudeClient): WebsiteAnalyzer {
  return new WebsiteAnalyzer(client);
}
