import Anthropic from '@anthropic-ai/sdk';

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

interface ClaudeClientConfig {
  apiKey?: string;
  rateLimit?: RateLimitConfig;
  retry?: RetryConfig;
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
  maxRequestsPerMinute: 50,
  maxTokensPerMinute: 100000,
};

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

// Cost per 1M tokens (Claude 3.5 Sonnet)
const INPUT_COST_PER_MILLION = 3.0;
const OUTPUT_COST_PER_MILLION = 15.0;

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

    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    this.tokenTimestamps = this.tokenTimestamps.filter(t => t.timestamp > oneMinuteAgo);

    // Check request limit
    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = oldestRequest + 60000 - now;
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    // Check token limit
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

export class ClaudeClient {
  private client: Anthropic;
  private rateLimiter: RateLimiter;
  private retryConfig: RetryConfig;
  private totalUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  constructor(config: ClaudeClientConfig = {}) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({ apiKey });
    this.rateLimiter = new RateLimiter(config.rateLimit || DEFAULT_RATE_LIMIT);
    this.retryConfig = config.retry || DEFAULT_RETRY;
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
      model = 'claude-sonnet-4-20250514',
    } = options;

    // Estimate tokens (rough: 4 chars per token)
    const estimatedInputTokens = Math.ceil((prompt.length + (systemPrompt?.length || 0)) / 4);

    await this.rateLimiter.waitForCapacity(estimatedInputTokens + maxTokens);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const messages: Anthropic.MessageParam[] = [
          { role: 'user', content: prompt }
        ];

        const response = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages,
        });

        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const totalTokens = inputTokens + outputTokens;
        const estimatedCost =
          (inputTokens / 1000000) * INPUT_COST_PER_MILLION +
          (outputTokens / 1000000) * OUTPUT_COST_PER_MILLION;

        // Update totals
        this.totalUsage.inputTokens += inputTokens;
        this.totalUsage.outputTokens += outputTokens;
        this.totalUsage.totalTokens += totalTokens;
        this.totalUsage.estimatedCost += estimatedCost;

        // Record for rate limiting
        this.rateLimiter.recordRequest(totalTokens);

        // Extract text content
        const content = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as Anthropic.TextBlock).text)
          .join('\n');

        return {
          content,
          usage: { inputTokens, outputTokens, totalTokens, estimatedCost },
          model: response.model,
          stopReason: response.stop_reason,
        };
      } catch (error: any) {
        lastError = error;

        // Check if retryable
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(2, attempt),
          this.retryConfig.maxDelayMs
        );

        console.warn(`Claude API error (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error in Claude API call');
  }

  async analyzeJSON<T>(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
    } = {}
  ): Promise<T> {
    const systemPrompt = `${options.systemPrompt || ''}\n\nYou must respond with valid JSON only. No markdown, no explanation, just the JSON object.`.trim();

    const result = await this.complete(prompt, {
      ...options,
      systemPrompt,
      temperature: 0.3, // Lower temperature for structured output
    });

    try {
      // Try to extract JSON from the response
      let jsonStr = result.content.trim();

      // Handle markdown code blocks
      if (jsonStr.startsWith('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      throw new Error(`Failed to parse Claude response as JSON: ${result.content.substring(0, 200)}...`);
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
    // Rate limit errors
    if (error.status === 429) return true;

    // Server errors
    if (error.status >= 500 && error.status < 600) return true;

    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;

    // Overloaded
    if (error.message?.includes('overloaded')) return true;

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let defaultClient: ClaudeClient | null = null;

export function getClaudeClient(config?: ClaudeClientConfig): ClaudeClient {
  if (!defaultClient || config) {
    defaultClient = new ClaudeClient(config);
  }
  return defaultClient;
}

export type { CompletionResult, TokenUsage, ClaudeClientConfig };
