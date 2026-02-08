import OpenAI from 'openai';

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

interface OpenRouterClientConfig {
  apiKey?: string;
  rateLimit?: RateLimitConfig;
  retry?: RetryConfig;
  defaultModel?: string;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface CompletionResult {
  content: string;
  usage: TokenUsage;
  model: string;
  stopReason: string | null;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerMinute: 60,
  maxTokensPerMinute: 150000,
};

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

// Cost estimates per 1M tokens (approximate for OpenRouter)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
  'anthropic/claude-3-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'openai/gpt-4-turbo': { input: 10.0, output: 30.0 },
  'openai/gpt-4o': { input: 5.0, output: 15.0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'google/gemini-1.5-pro': { input: 3.5, output: 10.5 },
  'google/gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.59, output: 0.79 },
  'mistralai/mistral-large': { input: 3.0, output: 9.0 },
};

const DEFAULT_COST = { input: 1.0, output: 3.0 };

class RateLimiter {
  private requestTimestamps: number[] = [];
  private tokenTimestamps: { tokens: number; timestamp: number }[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitForCapacity(estimatedTokens: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    this.tokenTimestamps = this.tokenTimestamps.filter(t => t.timestamp > oneMinuteAgo);

    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = oldestRequest + 60000 - now;
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    const tokensUsed = this.tokenTimestamps.reduce((sum, t) => sum + t.tokens, 0);
    if (tokensUsed + estimatedTokens > this.config.maxTokensPerMinute) {
      const oldestToken = this.tokenTimestamps[0];
      if (oldestToken) {
        const waitTime = oldestToken.timestamp + 60000 - now;
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
      }
    }
  }

  recordRequest(tokens: number): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.tokenTimestamps.push({ tokens, timestamp: now });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class OpenRouterClient {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  private retryConfig: RetryConfig;
  private defaultModel: string;
  private totalUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  constructor(config: OpenRouterClientConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.COMPANY_WEBSITE || 'https://autowebsites.pro',
        'X-Title': 'AutoWebsites Pro',
      },
    });
    this.rateLimiter = new RateLimiter(config.rateLimit || DEFAULT_RATE_LIMIT);
    this.retryConfig = config.retry || DEFAULT_RETRY;
    this.defaultModel = config.defaultModel || 'anthropic/claude-3.5-sonnet';
  }

  async complete(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<CompletionResult> {
    const {
      systemPrompt,
      maxTokens = 4096,
      temperature = 0.7,
      model = this.defaultModel,
    } = options;

    const estimatedInputTokens = Math.ceil((prompt.length + (systemPrompt?.length || 0)) / 4);

    await this.rateLimiter.waitForCapacity(estimatedInputTokens + maxTokens);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const messages: OpenAI.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages,
        });

        const inputTokens = response.usage?.prompt_tokens || estimatedInputTokens;
        const outputTokens = response.usage?.completion_tokens || 0;
        const totalTokens = inputTokens + outputTokens;

        const costs = MODEL_COSTS[model] || DEFAULT_COST;
        const estimatedCost =
          (inputTokens / 1000000) * costs.input +
          (outputTokens / 1000000) * costs.output;

        this.totalUsage.inputTokens += inputTokens;
        this.totalUsage.outputTokens += outputTokens;
        this.totalUsage.totalTokens += totalTokens;
        this.totalUsage.estimatedCost += estimatedCost;

        this.rateLimiter.recordRequest(totalTokens);

        const content = response.choices[0]?.message?.content || '';

        return {
          content,
          usage: { inputTokens, outputTokens, totalTokens, estimatedCost },
          model: response.model || model,
          stopReason: response.choices[0]?.finish_reason || null,
        };
      } catch (error: any) {
        lastError = error;

        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        const delay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(2, attempt),
          this.retryConfig.maxDelayMs
        );

        console.warn(`OpenRouter API error (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error in OpenRouter API call');
  }

  async analyzeJSON<T>(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<T> {
    const systemPrompt = `${options.systemPrompt || ''}\n\nYou must respond with valid JSON only. No markdown, no explanation, just the JSON object.`.trim();

    const result = await this.complete(prompt, {
      ...options,
      systemPrompt,
      temperature: 0.3,
    });

    try {
      let jsonStr = result.content.trim();

      if (jsonStr.startsWith('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      throw new Error(`Failed to parse OpenRouter response as JSON: ${result.content.substring(0, 200)}...`);
    }
  }

  getTotalUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  resetUsage(): void {
    this.totalUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    };
  }

  private isRetryableError(error: any): boolean {
    if (error.status === 429) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.message?.includes('overloaded')) return true;
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

let defaultClient: OpenRouterClient | null = null;

export function getOpenRouterClient(config?: OpenRouterClientConfig): OpenRouterClient {
  if (!defaultClient || config) {
    defaultClient = new OpenRouterClient(config);
  }
  return defaultClient;
}

export type { CompletionResult, TokenUsage, OpenRouterClientConfig };
