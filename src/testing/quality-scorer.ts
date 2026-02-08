/**
 * Quality Scorer
 *
 * Automated quality metrics for AI-generated content.
 * Scores content on various dimensions to enable model comparison.
 */

import { PreviewContent } from '../overnight/types';
import {
  QualityBreakdown,
  HeadlineMetrics,
  ServicesMetrics,
  AboutMetrics,
  QualityScoringConfig,
} from './types';

// Default weights for quality components
const DEFAULT_WEIGHTS = {
  headline: 0.25,
  services: 0.35,
  about: 0.40,
};

// Industry keywords for various industries
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  landscaping: ['landscape', 'lawn', 'garden', 'outdoor', 'yard', 'plants', 'design', 'maintenance', 'irrigation'],
  plumbers: ['plumbing', 'pipe', 'drain', 'water', 'leak', 'repair', 'installation', 'emergency'],
  hvac: ['heating', 'cooling', 'air', 'climate', 'ventilation', 'temperature', 'comfort', 'energy'],
  dentists: ['dental', 'teeth', 'smile', 'oral', 'care', 'health', 'dentist', 'cleaning'],
  salons: ['hair', 'beauty', 'style', 'salon', 'cut', 'color', 'spa', 'treatment'],
  fitness: ['fitness', 'gym', 'health', 'workout', 'training', 'exercise', 'wellness', 'strength'],
};

/**
 * Score the quality of generated content
 */
export function scoreContent(
  content: PreviewContent,
  config: QualityScoringConfig = {}
): { score: number; breakdown: QualityBreakdown } {
  const weights = {
    headline: config.headlineWeight ?? DEFAULT_WEIGHTS.headline,
    services: config.servicesWeight ?? DEFAULT_WEIGHTS.services,
    about: config.aboutWeight ?? DEFAULT_WEIGHTS.about,
  };

  // Score each component
  const headlineMetrics = scoreHeadline(content.headline, config);
  const servicesMetrics = scoreServices(content.services, config);
  const aboutMetrics = scoreAbout(content.about, config);

  // Calculate weighted overall score
  const overall = Math.round(
    headlineMetrics.score * weights.headline +
    servicesMetrics.score * weights.services +
    aboutMetrics.score * weights.about
  );

  const breakdown: QualityBreakdown = {
    headline: headlineMetrics,
    services: servicesMetrics,
    about: aboutMetrics,
    overall,
  };

  return { score: overall, breakdown };
}

/**
 * Score the headline
 */
function scoreHeadline(
  headline: string,
  config: QualityScoringConfig
): HeadlineMetrics {
  const words = headline.trim().split(/\s+/);
  const wordCount = words.length;

  // Check for location
  const location = config.expectedLocation?.toLowerCase() || '';
  const hasLocation = location ? headline.toLowerCase().includes(location.split(',')[0].toLowerCase()) : false;

  // Check for industry keywords
  const keywords = config.industryKeywords || [];
  const hasIndustryKeyword = keywords.some(kw =>
    headline.toLowerCase().includes(kw.toLowerCase())
  );

  // Check if headline is compelling (subjective heuristics)
  const isCompelling =
    wordCount >= 4 &&
    wordCount <= 12 &&
    !headline.includes('{{') && // No template markers
    /[A-Z]/.test(headline[0]); // Starts with capital

  // Calculate score
  let score = 50; // Base score

  // Word count bonus (ideal: 6-10 words)
  if (wordCount >= 6 && wordCount <= 10) {
    score += 20;
  } else if (wordCount >= 4 && wordCount <= 12) {
    score += 10;
  }

  // Location bonus
  if (hasLocation) {
    score += 15;
  }

  // Industry keyword bonus
  if (hasIndustryKeyword) {
    score += 10;
  }

  // Compelling bonus
  if (isCompelling) {
    score += 5;
  }

  return {
    score: Math.min(100, score),
    wordCount,
    hasLocation,
    hasIndustryKeyword,
    isCompelling,
  };
}

/**
 * Score the services section
 */
function scoreServices(
  services: PreviewContent['services'],
  config: QualityScoringConfig
): ServicesMetrics {
  const count = services.length;
  const minServices = config.minServices ?? 3;

  // Calculate average description length
  const totalDescLength = services.reduce((sum, s) => sum + s.description.length, 0);
  const avgDescriptionLength = count > 0 ? Math.round(totalDescLength / count) : 0;

  // Check for relevant services
  const keywords = config.industryKeywords || [];
  const hasRelevantServices = services.some(service =>
    keywords.some(kw =>
      service.name.toLowerCase().includes(kw.toLowerCase()) ||
      service.description.toLowerCase().includes(kw.toLowerCase())
    )
  );

  // Calculate score
  let score = 40; // Base score

  // Service count bonus
  if (count >= minServices && count <= 6) {
    score += 25;
  } else if (count >= 2) {
    score += 15;
  }

  // Description length bonus (ideal: 50-150 chars)
  if (avgDescriptionLength >= 50 && avgDescriptionLength <= 150) {
    score += 20;
  } else if (avgDescriptionLength >= 30) {
    score += 10;
  }

  // Relevance bonus
  if (hasRelevantServices) {
    score += 15;
  }

  return {
    score: Math.min(100, score),
    count,
    avgDescriptionLength,
    hasRelevantServices,
  };
}

/**
 * Score the about section
 */
function scoreAbout(
  about: string,
  config: QualityScoringConfig
): AboutMetrics {
  const words = about.trim().split(/\s+/);
  const wordCount = words.length;

  // Count paragraphs (split by double newline or single newline with blank)
  const paragraphs = about.split(/\n\s*\n|\n{2,}/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Check for professional tone (basic heuristics)
  const hasProfessionalTone =
    !about.includes('{{') && // No template markers
    about.length > 100 && // Substantial content
    /we|our|you|your/i.test(about); // Addresses reader or uses we

  // Calculate score
  let score = 40; // Base score

  // Word count bonus (ideal: 100-200 words)
  if (wordCount >= 100 && wordCount <= 200) {
    score += 25;
  } else if (wordCount >= 50 && wordCount <= 300) {
    score += 15;
  } else if (wordCount >= 30) {
    score += 5;
  }

  // Paragraph count bonus (ideal: 2-3 paragraphs)
  if (paragraphCount >= 2 && paragraphCount <= 3) {
    score += 20;
  } else if (paragraphCount >= 1) {
    score += 10;
  }

  // Professional tone bonus
  if (hasProfessionalTone) {
    score += 15;
  }

  return {
    score: Math.min(100, score),
    wordCount,
    paragraphCount,
    hasProfessionalTone,
  };
}

/**
 * Get industry keywords for a given industry
 */
export function getIndustryKeywords(industry: string): string[] {
  return INDUSTRY_KEYWORDS[industry.toLowerCase()] || [];
}

/**
 * Create scoring config from content generation input
 */
export function createScoringConfig(
  industry: string,
  city?: string,
  state?: string
): QualityScoringConfig {
  const location = [city, state].filter(Boolean).join(', ');

  return {
    industryKeywords: getIndustryKeywords(industry),
    expectedLocation: location || undefined,
    minServices: 3,
  };
}
