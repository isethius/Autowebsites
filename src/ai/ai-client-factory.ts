/**
 * AI Client Factory
 *
 * Creates AI clients based on configuration.
 * Provides adapters for different AI backends.
 */

import { AIClient, AIClientConfig, CompletionOptions, CompletionResult, TokenUsage } from './ai-client';
import { ClaudeClient, getClaudeClient } from './claude-client';
import { OpenRouterClient, getOpenRouterClient } from './openrouter-client';

/**
 * Adapter for ClaudeClient to implement AIClient interface
 */
class ClaudeClientAdapter implements AIClient {
  private client: ClaudeClient;

  constructor(client: ClaudeClient) {
    this.client = client;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.client.complete(prompt, {
      systemPrompt: options?.systemPrompt,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      model: options?.model,
    });
  }

  async analyzeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T> {
    return this.client.analyzeJSON<T>(prompt, {
      systemPrompt: options?.systemPrompt,
      maxTokens: options?.maxTokens,
    });
  }

  getUsage(): TokenUsage {
    return this.client.getTotalUsage();
  }

  resetUsage(): void {
    this.client.resetUsage();
  }
}

/**
 * Adapter for OpenRouterClient to implement AIClient interface
 */
class OpenRouterClientAdapter implements AIClient {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.client.complete(prompt, {
      systemPrompt: options?.systemPrompt,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      model: options?.model,
    });
  }

  async analyzeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T> {
    return this.client.analyzeJSON<T>(prompt, {
      systemPrompt: options?.systemPrompt,
      maxTokens: options?.maxTokens,
      model: options?.model,
    });
  }

  getUsage(): TokenUsage {
    return this.client.getTotalUsage();
  }

  resetUsage(): void {
    this.client.resetUsage();
  }
}

/**
 * Create an AI client based on configuration
 */
export function createAIClient(config: AIClientConfig): AIClient {
  switch (config.backend) {
    case 'openrouter':
      const openRouterClient = getOpenRouterClient({
        defaultModel: config.defaultModel,
        apiKey: config.apiKey,
      });
      return new OpenRouterClientAdapter(openRouterClient);

    case 'anthropic':
    default:
      const claudeClient = getClaudeClient({
        apiKey: config.apiKey,
      });
      return new ClaudeClientAdapter(claudeClient);
  }
}

/**
 * Get the default AI client (Anthropic/Claude)
 */
export function getDefaultAIClient(): AIClient {
  return createAIClient({ backend: 'anthropic' });
}

/**
 * Get an OpenRouter-backed AI client
 */
export function getOpenRouterAIClient(defaultModel?: string): AIClient {
  return createAIClient({ backend: 'openrouter', defaultModel });
}
