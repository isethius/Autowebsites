/**
 * Model Router for OpenRouter
 *
 * Provides intelligent model selection based on task type.
 * Uses the Template + Flash Model approach for cost-effective content generation.
 */

export const MODELS = {
  // Premium models (for templates, complex content)
  'claude-opus': 'anthropic/claude-3-opus:beta',
  'claude-sonnet': 'anthropic/claude-3.5-sonnet',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  'gpt-4o': 'openai/gpt-4o',
  'gemini-pro': 'google/gemini-pro-1.5',

  // Flash models (for personalization, simple tasks)
  'claude-haiku': 'anthropic/claude-3.5-haiku',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gemini-flash': 'google/gemini-2.0-flash-001',

  // Open-source alternatives
  'llama-70b': 'meta-llama/llama-3.1-70b-instruct',
  'mistral-large': 'mistralai/mistral-large',
} as const;

export type ModelKey = keyof typeof MODELS;
export type ModelId = typeof MODELS[ModelKey];

export type ContentTaskType =
  | 'template_creation'    // High-quality industry template generation
  | 'personalization'      // Adapt template with business details
  | 'seo_optimization'     // Meta tags, schema markup
  | 'content_rewrite'      // Improve existing content
  | 'copy_generation'      // Headlines, CTAs, descriptions
  | 'analysis'             // Website analysis, competitor research
  | 'code_generation'      // HTML, CSS, JavaScript generation
  | 'simple_task'          // Basic tasks, formatting
  // Content-specific task types for multi-model approach
  | 'content_template'         // Industry template content (use Opus)
  | 'content_personalization'  // Business customization (use Haiku)
  | 'headline_generation'      // Short headlines/CTAs (use Haiku)
  | 'long_form_about';         // About sections (use Sonnet)

export interface ContentTask {
  type: ContentTaskType;
  complexity?: 'low' | 'medium' | 'high';
  preferSpeed?: boolean;
  preferCost?: boolean;
}

export interface ModelSelection {
  model: ModelId;
  reason: string;
  estimatedCostPer1K: number;
}

// Cost per 1K completions (rough estimate based on avg token usage)
const MODEL_COST_ESTIMATES: Record<ModelId, number> = {
  'anthropic/claude-3-opus:beta': 0.075,
  'anthropic/claude-3.5-sonnet': 0.015,
  'anthropic/claude-3.5-haiku': 0.001,
  'openai/gpt-4-turbo': 0.04,
  'openai/gpt-4o': 0.02,
  'openai/gpt-4o-mini': 0.0006,
  'google/gemini-pro-1.5': 0.014,
  'google/gemini-2.0-flash-001': 0.0003,
  'meta-llama/llama-3.1-70b-instruct': 0.0014,
  'mistralai/mistral-large': 0.012,
};

/**
 * Select the optimal model for a given task.
 *
 * Strategy:
 * - Template creation: Use premium models (Opus, GPT-4) for quality
 * - Personalization: Use flash models (Haiku, Gemini Flash) for speed/cost
 * - Analysis: Use Sonnet for balance of quality and cost
 * - Code generation: Use Sonnet or GPT-4o for accuracy
 */
export function selectModel(task: ContentTask): ModelSelection {
  const { type, complexity = 'medium', preferSpeed = false, preferCost = false } = task;

  // If cost is priority, always use flash models
  if (preferCost) {
    return {
      model: MODELS['gemini-flash'],
      reason: 'Cost-optimized: Using Gemini Flash for lowest cost',
      estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['gemini-flash']],
    };
  }

  // If speed is priority, use Haiku or Gemini Flash
  if (preferSpeed) {
    return {
      model: MODELS['claude-haiku'],
      reason: 'Speed-optimized: Using Claude Haiku for fastest response',
      estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-haiku']],
    };
  }

  switch (type) {
    case 'template_creation':
      // Use Sonnet for template quality (Opus often unavailable)
      return {
        model: MODELS['claude-sonnet'],
        reason: 'Template creation: Using Sonnet for quality templates',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-sonnet']],
      };

    case 'personalization':
      // Flash models are perfect for simple customization
      return {
        model: MODELS['claude-haiku'],
        reason: 'Personalization: Using Haiku for fast, cost-effective customization',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-haiku']],
      };

    case 'seo_optimization':
      // Gemini Flash is great for structured SEO content
      return {
        model: MODELS['gemini-flash'],
        reason: 'SEO optimization: Using Gemini Flash for structured meta content',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['gemini-flash']],
      };

    case 'content_rewrite':
      return {
        model: complexity === 'high' ? MODELS['claude-sonnet'] : MODELS['claude-haiku'],
        reason: complexity === 'high'
          ? 'Complex rewrite: Using Sonnet for nuanced improvements'
          : 'Simple rewrite: Using Haiku for quick improvements',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[
          complexity === 'high' ? MODELS['claude-sonnet'] : MODELS['claude-haiku']
        ],
      };

    case 'copy_generation':
      // Headlines and CTAs need quality, but not Opus-level
      return {
        model: MODELS['claude-sonnet'],
        reason: 'Copy generation: Using Sonnet for compelling copy',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-sonnet']],
      };

    case 'analysis':
      // Analysis benefits from reasoning capabilities
      return {
        model: MODELS['claude-sonnet'],
        reason: 'Analysis: Using Sonnet for balanced analysis quality',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-sonnet']],
      };

    case 'code_generation':
      // Code needs accuracy
      return {
        model: complexity === 'high' ? MODELS['gpt-4o'] : MODELS['claude-sonnet'],
        reason: complexity === 'high'
          ? 'Complex code: Using GPT-4o for accurate code generation'
          : 'Code generation: Using Sonnet for reliable code',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[
          complexity === 'high' ? MODELS['gpt-4o'] : MODELS['claude-sonnet']
        ],
      };

    case 'content_template':
      // High-quality industry templates - use Sonnet (Opus often unavailable on OpenRouter)
      return {
        model: MODELS['claude-sonnet'],
        reason: 'Content template: Using Sonnet for premium industry content',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-sonnet']],
      };

    case 'content_personalization':
      // Personalization with business details is simple substitution
      return {
        model: MODELS['claude-haiku'],
        reason: 'Content personalization: Using Haiku for fast customization',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-haiku']],
      };

    case 'headline_generation':
      // Short headlines are simple, use flash model
      return {
        model: MODELS['claude-haiku'],
        reason: 'Headline generation: Using Haiku for quick headline creation',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-haiku']],
      };

    case 'long_form_about':
      // About sections need balanced quality
      return {
        model: MODELS['claude-sonnet'],
        reason: 'Long-form about: Using Sonnet for quality narrative content',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-sonnet']],
      };

    case 'simple_task':
    default:
      return {
        model: MODELS['claude-haiku'],
        reason: 'Simple task: Using Haiku for fast, cheap execution',
        estimatedCostPer1K: MODEL_COST_ESTIMATES[MODELS['claude-haiku']],
      };
  }
}

/**
 * Get a fallback model if the primary model fails.
 */
export function getFallbackModel(primaryModel: ModelId): ModelId {
  const fallbacks: Record<string, ModelId> = {
    // Claude fallbacks
    'anthropic/claude-3-opus:beta': 'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-sonnet': 'openai/gpt-4o',
    'anthropic/claude-3.5-haiku': 'openai/gpt-4o-mini',

    // OpenAI fallbacks
    'openai/gpt-4-turbo': 'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o': 'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini': 'anthropic/claude-3.5-haiku',

    // Google fallbacks
    'google/gemini-pro-1.5': 'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash-001': 'anthropic/claude-3.5-haiku',

    // Open source fallbacks
    'meta-llama/llama-3.1-70b-instruct': 'anthropic/claude-3.5-haiku',
    'mistralai/mistral-large': 'anthropic/claude-3.5-sonnet',
  };

  return fallbacks[primaryModel] || MODELS['claude-sonnet'];
}

/**
 * Estimate cost savings vs always using Sonnet.
 */
export function estimateSavings(tasks: ContentTask[]): {
  optimizedCost: number;
  sonnetOnlyCost: number;
  savings: number;
  savingsPercent: number;
} {
  const sonnetCost = MODEL_COST_ESTIMATES[MODELS['claude-sonnet']];

  let optimizedCost = 0;
  for (const task of tasks) {
    const selection = selectModel(task);
    optimizedCost += selection.estimatedCostPer1K;
  }

  const sonnetOnlyCost = tasks.length * sonnetCost;
  const savings = sonnetOnlyCost - optimizedCost;
  const savingsPercent = (savings / sonnetOnlyCost) * 100;

  return {
    optimizedCost,
    sonnetOnlyCost,
    savings,
    savingsPercent: Math.round(savingsPercent),
  };
}

/**
 * Get all available models with their costs.
 */
export function listModels(): Array<{
  key: ModelKey;
  id: ModelId;
  tier: 'premium' | 'standard' | 'flash';
  costPer1K: number;
}> {
  const premiumModels: ModelKey[] = ['claude-opus', 'gpt-4-turbo'];
  const flashModels: ModelKey[] = ['claude-haiku', 'gpt-4o-mini', 'gemini-flash'];

  return (Object.keys(MODELS) as ModelKey[]).map(key => ({
    key,
    id: MODELS[key],
    tier: premiumModels.includes(key) ? 'premium' : flashModels.includes(key) ? 'flash' : 'standard',
    costPer1K: MODEL_COST_ESTIMATES[MODELS[key]],
  }));
}
