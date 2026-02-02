/**
 * Content-Design Sync
 *
 * Ensures content tone aligns with visual design.
 * If DNA selects "Brutalist/Bold" but content is polite and long-winded,
 * the site feels incoherent.
 *
 * This module provides tone configuration for AI content generation
 * based on the selected DNA and vibe.
 */

import { DNACode } from '../variance-planner';
import { Vibe } from './harmony/constraints';

/**
 * Content tone configuration for AI-generated copy
 */
export interface ContentToneConfig {
  /** How headlines should be written */
  headlineStyle: 'punchy' | 'sophisticated' | 'clear' | 'playful' | 'urgent';

  /** Overall voice/tone */
  tone: 'confident' | 'welcoming' | 'professional' | 'friendly' | 'urgent' | 'luxurious';

  /** Preferred sentence length */
  sentenceLength: 'short' | 'medium' | 'long';

  /** Max words per headline */
  headlineMaxWords: number;

  /** Max words per paragraph */
  paragraphMaxWords: number;

  /** CTA button style */
  ctaStyle: 'imperative' | 'invitational' | 'actionable' | 'casual';

  /** Example CTA phrases that match this tone */
  ctaExamples: string[];

  /** Words/phrases to avoid */
  avoid: string[];

  /** Words/phrases to prefer */
  prefer: string[];
}

/**
 * Get content tone configuration based on DNA and vibe
 *
 * @param dna - The DNA code configuration
 * @param vibe - Optional vibe for additional context
 * @returns Content tone configuration for AI prompts
 */
export function getContentTone(dna: DNACode, vibe?: Vibe): ContentToneConfig {
  const chaos = vibe?.chaos ?? dna.chaos ?? 0.3;

  // Brutalist/Bold design (D7, D2, D12) with high chaos
  if (chaos > 0.6 || ['D7', 'D12'].includes(dna.design)) {
    return {
      headlineStyle: 'punchy',
      tone: 'confident',
      sentenceLength: 'short',
      headlineMaxWords: 5,
      paragraphMaxWords: 25,
      ctaStyle: 'imperative',
      ctaExamples: ['Get it now', 'Start today', 'Let\'s go', 'Book now'],
      avoid: ['please', 'kindly', 'perhaps', 'maybe', 'we think', 'possibly'],
      prefer: ['bold', 'fast', 'proven', 'guaranteed', 'now'],
    };
  }

  // Elegant serif typography (T2) or elegant design (D5, D6)
  if (dna.typography === 'T2' || ['D5', 'D6'].includes(dna.design)) {
    return {
      headlineStyle: 'sophisticated',
      tone: 'luxurious',
      sentenceLength: 'medium',
      headlineMaxWords: 8,
      paragraphMaxWords: 40,
      ctaStyle: 'invitational',
      ctaExamples: ['Discover more', 'Explore our services', 'Begin your journey', 'Schedule a consultation'],
      avoid: ['cheap', 'fast', 'hurry', 'deal', 'discount', 'free'],
      prefer: ['exclusive', 'curated', 'refined', 'exceptional', 'distinguished'],
    };
  }

  // Playful/friendly design (T4, D8)
  if (dna.typography === 'T4' || dna.design === 'D8') {
    return {
      headlineStyle: 'playful',
      tone: 'friendly',
      sentenceLength: 'short',
      headlineMaxWords: 6,
      paragraphMaxWords: 30,
      ctaStyle: 'casual',
      ctaExamples: ['Let\'s chat', 'Say hello', 'Get started', 'Learn more'],
      avoid: ['formal', 'corporate', 'synergy', 'leverage', 'utilize'],
      prefer: ['awesome', 'great', 'amazing', 'love', 'help'],
    };
  }

  // Emergency/urgent services (often with D3 heavy shadow or red colors)
  if (dna.design === 'D3' || dna.color === 'C9') {
    return {
      headlineStyle: 'urgent',
      tone: 'urgent',
      sentenceLength: 'short',
      headlineMaxWords: 5,
      paragraphMaxWords: 25,
      ctaStyle: 'imperative',
      ctaExamples: ['Call now', 'Get help now', 'Emergency service', '24/7 response'],
      avoid: ['whenever', 'eventually', 'consider', 'might'],
      prefer: ['now', 'immediate', 'fast', 'emergency', '24/7', 'today'],
    };
  }

  // Minimal design (D4, N9) - clear and concise
  if (dna.design === 'D4' || dna.nav === 'N9') {
    return {
      headlineStyle: 'clear',
      tone: 'professional',
      sentenceLength: 'medium',
      headlineMaxWords: 6,
      paragraphMaxWords: 35,
      ctaStyle: 'actionable',
      ctaExamples: ['Get started', 'Contact us', 'Learn more', 'View services'],
      avoid: ['amazing', 'incredible', 'revolutionary', 'game-changing'],
      prefer: ['simple', 'easy', 'straightforward', 'reliable', 'trusted'],
    };
  }

  // Default: Professional and clear
  return {
    headlineStyle: 'clear',
    tone: 'professional',
    sentenceLength: 'medium',
    headlineMaxWords: 7,
    paragraphMaxWords: 35,
    ctaStyle: 'actionable',
    ctaExamples: ['Get a quote', 'Contact us', 'Schedule service', 'Learn more'],
    avoid: ['utilize', 'leverage', 'synergy', 'paradigm'],
    prefer: ['professional', 'reliable', 'trusted', 'experienced', 'quality'],
  };
}

/**
 * Generate AI prompt instructions based on tone config
 */
export function generateTonePrompt(config: ContentToneConfig): string {
  return `
Writing Style Guidelines:
- Headline style: ${config.headlineStyle} (max ${config.headlineMaxWords} words)
- Overall tone: ${config.tone}
- Sentence length: ${config.sentenceLength} (paragraphs max ${config.paragraphMaxWords} words)
- CTA style: ${config.ctaStyle}
- Example CTAs: ${config.ctaExamples.join(', ')}

Words to avoid: ${config.avoid.join(', ')}
Words to prefer: ${config.prefer.join(', ')}
`.trim();
}

/**
 * Validate content against tone config
 * Returns suggestions for improvement
 */
export function validateContentTone(
  content: string,
  config: ContentToneConfig
): { valid: boolean; suggestions: string[] } {
  const suggestions: string[] = [];
  const words = content.split(/\s+/);

  // Check for avoided words
  for (const avoid of config.avoid) {
    if (content.toLowerCase().includes(avoid.toLowerCase())) {
      suggestions.push(`Consider removing "${avoid}" - doesn't match ${config.tone} tone`);
    }
  }

  // Check sentence length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const avgWords = words.length / sentences.length;

  if (config.sentenceLength === 'short' && avgWords > 12) {
    suggestions.push('Sentences may be too long for the punchy style - aim for under 12 words');
  } else if (config.sentenceLength === 'long' && avgWords < 8) {
    suggestions.push('Sentences may be too short for the sophisticated style - expand for flow');
  }

  return {
    valid: suggestions.length === 0,
    suggestions,
  };
}

/**
 * Get tone config for a specific industry
 */
export function getToneForIndustry(industry: string): ContentToneConfig {
  const industryTones: Record<string, Partial<ContentToneConfig>> = {
    // Emergency services need urgent tone
    plumber: { tone: 'urgent', ctaStyle: 'imperative', ctaExamples: ['Call now', 'Get help today'] },
    electrician: { tone: 'urgent', ctaStyle: 'imperative' },
    hvac: { tone: 'professional', ctaStyle: 'actionable' },

    // Professional services need sophisticated tone
    lawyer: { tone: 'professional', headlineStyle: 'sophisticated', ctaStyle: 'invitational' },
    accountant: { tone: 'professional', ctaStyle: 'actionable' },
    'financial-advisor': { tone: 'luxurious', headlineStyle: 'sophisticated' },

    // Healthcare needs welcoming tone
    dentist: { tone: 'welcoming', ctaStyle: 'invitational' },
    chiropractor: { tone: 'welcoming', headlineStyle: 'clear' },
    veterinarian: { tone: 'friendly', ctaStyle: 'casual' },

    // Creative needs playful/bold
    restaurant: { tone: 'welcoming', headlineStyle: 'playful' },
    photographer: { tone: 'confident', headlineStyle: 'punchy' },
  };

  const baseConfig = getContentTone({ hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1' });
  const industryOverrides = industryTones[industry] || {};

  return {
    ...baseConfig,
    ...industryOverrides,
    ctaExamples: industryOverrides.ctaExamples || baseConfig.ctaExamples,
    avoid: baseConfig.avoid,
    prefer: baseConfig.prefer,
  };
}
