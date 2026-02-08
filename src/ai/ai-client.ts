/**
 * AI Client Interface
 *
 * Unified interface for interacting with different AI backends
 * (Anthropic Claude, OpenRouter, etc.)
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface CompletionResult {
  content: string;
  usage: TokenUsage;
  model: string;
  stopReason: string | null;
}

export interface CompletionOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Common interface for AI clients
 */
export interface AIClient {
  /**
   * Generate a completion from the AI model
   */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Generate a completion and parse as JSON
   */
  analyzeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T>;

  /**
   * Get cumulative token usage
   */
  getUsage(): TokenUsage;

  /**
   * Reset usage tracking
   */
  resetUsage(): void;
}

/**
 * Backend types available for content generation
 */
export type AIBackend = 'anthropic' | 'openrouter';

/**
 * Configuration for AI client creation
 */
export interface AIClientConfig {
  backend: AIBackend;
  defaultModel?: string;
  apiKey?: string;
}
