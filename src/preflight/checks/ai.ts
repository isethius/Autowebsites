/**
 * AI Checks
 *
 * Verifies Anthropic API key and Claude functionality.
 */

import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';
import { features } from '../../utils/config';

const CATEGORY = 'AI';

/**
 * Check Anthropic API key configuration
 */
async function checkAnthropicConfig(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional) {
    return createResult(CATEGORY, 'Anthropic config', 'skip', Date.now() - start, {
      message: 'Skipped (--skip-optional)',
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return createResult(CATEGORY, 'Anthropic config', 'warn', Date.now() - start, {
      message: 'ANTHROPIC_API_KEY not configured',
      details: {
        hint: 'AI analysis features will be disabled',
      },
    });
  }

  // Check key format
  if (!apiKey.startsWith('sk-ant-')) {
    return createResult(CATEGORY, 'Anthropic config', 'warn', Date.now() - start, {
      message: 'API key format may be invalid (should start with sk-ant-)',
    });
  }

  return createResult(CATEGORY, 'Anthropic config', 'pass', Date.now() - start, {
    details: options.verbose ? { keyPrefix: apiKey.slice(0, 10) + '...' } : undefined,
  });
}

/**
 * Test Claude API with a simple request
 */
async function checkClaudeApi(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.ai) {
    return createResult(CATEGORY, 'Claude API', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'AI not configured',
    });
  }

  try {
    const { ClaudeClient } = await import('../../ai/claude-client');

    const client = new ClaudeClient();

    // Simple test message
    const response = await client.complete('Say "preflight check passed" in exactly those words.');

    if (!response || !response.content || response.content.length === 0) {
      return createResult(CATEGORY, 'Claude API', 'fail', Date.now() - start, {
        message: 'No response from API',
      });
    }

    return createResult(CATEGORY, 'Claude API', 'pass', Date.now() - start, {
      message: 'API responding',
      details: options.verbose ? { responseLength: response.content.length } : undefined,
    });
  } catch (error: any) {
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      return createResult(CATEGORY, 'Claude API', 'fail', Date.now() - start, {
        message: 'Invalid API key',
      });
    }

    if (error.message?.includes('rate') || error.message?.includes('429')) {
      return createResult(CATEGORY, 'Claude API', 'warn', Date.now() - start, {
        message: 'Rate limited (API key is valid)',
      });
    }

    if (error.message?.includes('credit') || error.message?.includes('billing')) {
      return createResult(CATEGORY, 'Claude API', 'fail', Date.now() - start, {
        message: 'Account billing issue',
      });
    }

    return createResult(CATEGORY, 'Claude API', 'fail', Date.now() - start, {
      message: `API test failed: ${error.message}`,
    });
  }
}

/**
 * Test website analyzer (if AI is configured)
 */
async function checkWebsiteAnalyzer(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.ai) {
    return createResult(CATEGORY, 'Website analyzer', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'AI not configured',
    });
  }

  try {
    const { WebsiteAnalyzer } = await import('../../ai/website-analyzer');

    // Just verify the analyzer can be instantiated
    const analyzer = new WebsiteAnalyzer();

    return createResult(CATEGORY, 'Website analyzer', 'pass', Date.now() - start, {
      message: 'Analyzer ready',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Website analyzer', 'fail', Date.now() - start, {
      message: `Analyzer init failed: ${error.message}`,
    });
  }
}

/**
 * Test pitch generator (if AI is configured)
 */
async function checkPitchGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.ai) {
    return createResult(CATEGORY, 'Pitch generator', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'AI not configured',
    });
  }

  try {
    const { PitchGenerator } = await import('../../ai/pitch-generator');

    // Just verify the generator can be instantiated
    const generator = new PitchGenerator();

    return createResult(CATEGORY, 'Pitch generator', 'pass', Date.now() - start, {
      message: 'Generator ready',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Pitch generator', 'fail', Date.now() - start, {
      message: `Generator init failed: ${error.message}`,
    });
  }
}

/**
 * Export all AI checks
 */
export const aiChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Anthropic config',
    required: false,
    run: checkAnthropicConfig,
  },
  {
    category: CATEGORY,
    name: 'Claude API',
    required: false,
    run: checkClaudeApi,
  },
  {
    category: CATEGORY,
    name: 'Website analyzer',
    required: false,
    run: checkWebsiteAnalyzer,
  },
  {
    category: CATEGORY,
    name: 'Pitch generator',
    required: false,
    run: checkPitchGenerator,
  },
];
