/**
 * A/B Testing Types
 *
 * Type definitions for the model comparison testing framework.
 */

import { PreviewContent } from '../overnight/types';
import { ContentGenerationInput } from '../preview/content-generator';
import { ModelId, ModelKey } from '../ai/model-router';
import { TokenUsage } from '../ai/ai-client';

/**
 * Configuration for an A/B test
 */
export interface ABTestConfig {
  /** Unique test identifier */
  testId: string;
  /** Business input for content generation */
  businessInput: ContentGenerationInput;
  /** Models to compare */
  modelsToTest: ModelId[];
  /** Number of iterations per model (default: 1) */
  iterations?: number;
  /** Whether to run models in parallel (default: false for rate limiting) */
  parallel?: boolean;
}

/**
 * Result for a single model run
 */
export interface ModelRunResult {
  /** Model used for this run */
  model: ModelId;
  /** Iteration number */
  iteration: number;
  /** Generated content */
  content: PreviewContent;
  /** Token usage */
  usage: TokenUsage;
  /** Generation latency in milliseconds */
  latencyMs: number;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Detailed quality breakdown */
  qualityBreakdown: QualityBreakdown;
  /** Whether the run was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Detailed quality breakdown
 */
export interface QualityBreakdown {
  /** Headline quality (0-100) */
  headline: HeadlineMetrics;
  /** Services quality (0-100) */
  services: ServicesMetrics;
  /** About section quality (0-100) */
  about: AboutMetrics;
  /** Overall content quality */
  overall: number;
}

/**
 * Headline quality metrics
 */
export interface HeadlineMetrics {
  score: number;
  wordCount: number;
  hasLocation: boolean;
  hasIndustryKeyword: boolean;
  isCompelling: boolean;
}

/**
 * Services section quality metrics
 */
export interface ServicesMetrics {
  score: number;
  count: number;
  avgDescriptionLength: number;
  hasRelevantServices: boolean;
}

/**
 * About section quality metrics
 */
export interface AboutMetrics {
  score: number;
  wordCount: number;
  paragraphCount: number;
  hasProfessionalTone: boolean;
}

/**
 * Complete A/B test result
 */
export interface ABTestResult {
  /** Test identifier */
  testId: string;
  /** Timestamp when test started */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Business input used */
  businessInput: ContentGenerationInput;
  /** Results per model */
  results: ModelRunResult[];
  /** Summary statistics */
  summary: ABTestSummary;
}

/**
 * Summary of A/B test results
 */
export interface ABTestSummary {
  /** Model rankings by quality score */
  rankingByQuality: Array<{
    model: ModelId;
    avgQualityScore: number;
    rank: number;
  }>;
  /** Model rankings by cost efficiency */
  rankingByCost: Array<{
    model: ModelId;
    avgCost: number;
    rank: number;
  }>;
  /** Model rankings by speed */
  rankingBySpeed: Array<{
    model: ModelId;
    avgLatencyMs: number;
    rank: number;
  }>;
  /** Best overall model (quality/cost ratio) */
  bestOverall: ModelId;
  /** Best quality model */
  bestQuality: ModelId;
  /** Best cost model */
  bestCost: ModelId;
  /** Best speed model */
  bestSpeed: ModelId;
}

/**
 * Quality scoring configuration
 */
export interface QualityScoringConfig {
  /** Weight for headline quality (0-1) */
  headlineWeight?: number;
  /** Weight for services quality (0-1) */
  servicesWeight?: number;
  /** Weight for about section quality (0-1) */
  aboutWeight?: number;
  /** Industry keywords to check for */
  industryKeywords?: string[];
  /** Location to check for */
  expectedLocation?: string;
  /** Minimum expected services count */
  minServices?: number;
}

/**
 * Report format options
 */
export type ReportFormat = 'markdown' | 'json' | 'html';

/**
 * Report generation options
 */
export interface ReportOptions {
  format?: ReportFormat;
  includeRawContent?: boolean;
  includeSampleContent?: boolean;
  outputPath?: string;
}
