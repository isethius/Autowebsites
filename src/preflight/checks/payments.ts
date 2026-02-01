/**
 * Payments Checks
 *
 * Verifies Stripe API key configuration and connectivity.
 */

import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';
import { features } from '../../utils/config';

const CATEGORY = 'Payments';

/**
 * Check Stripe API key configuration
 */
async function checkStripeConfig(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional) {
    return createResult(CATEGORY, 'Stripe configuration', 'skip', Date.now() - start, {
      message: 'Skipped (--skip-optional)',
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    return createResult(CATEGORY, 'Stripe configuration', 'warn', Date.now() - start, {
      message: 'STRIPE_SECRET_KEY not configured',
      details: {
        hint: 'Payment features will be disabled',
      },
    });
  }

  // Check key format
  const isTestKey = secretKey.startsWith('sk_test_');
  const isLiveKey = secretKey.startsWith('sk_live_');

  if (!isTestKey && !isLiveKey) {
    return createResult(CATEGORY, 'Stripe configuration', 'warn', Date.now() - start, {
      message: 'API key format may be invalid (should start with sk_test_ or sk_live_)',
    });
  }

  // Check for webhook secret
  if (!webhookSecret) {
    return createResult(CATEGORY, 'Stripe configuration', 'warn', Date.now() - start, {
      message: 'STRIPE_WEBHOOK_SECRET not set (webhooks will not work)',
      details: {
        mode: isTestKey ? 'test' : 'live',
        hint: 'Set up webhooks at dashboard.stripe.com/webhooks',
      },
    });
  }

  return createResult(CATEGORY, 'Stripe configuration', 'pass', Date.now() - start, {
    message: isTestKey ? 'Test mode' : 'Live mode',
    details: options.verbose ? {
      mode: isTestKey ? 'test' : 'live',
      keyPrefix: secretKey.slice(0, 12) + '...',
      webhookConfigured: !!webhookSecret,
    } : undefined,
  });
}

/**
 * Test Stripe API connectivity
 */
async function checkStripeApi(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.payments) {
    return createResult(CATEGORY, 'Stripe API', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'Stripe not configured',
    });
  }

  try {
    // Dynamic import to avoid loading Stripe when not configured
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Test API by retrieving account info
    const account = await stripe.accounts.retrieve();

    return createResult(CATEGORY, 'Stripe API', 'pass', Date.now() - start, {
      message: 'API connected',
      details: options.verbose ? {
        accountId: account.id,
        country: account.country,
        defaultCurrency: account.default_currency,
      } : undefined,
    });
  } catch (error: any) {
    // Check for specific error types
    if (error.type === 'StripeAuthenticationError' || error.message?.includes('401')) {
      return createResult(CATEGORY, 'Stripe API', 'fail', Date.now() - start, {
        message: 'Invalid API key',
      });
    }

    if (error.type === 'StripeRateLimitError' || error.message?.includes('429')) {
      return createResult(CATEGORY, 'Stripe API', 'warn', Date.now() - start, {
        message: 'Rate limited (API key is valid)',
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return createResult(CATEGORY, 'Stripe API', 'fail', Date.now() - start, {
        message: 'Network error - cannot reach Stripe API',
      });
    }

    return createResult(CATEGORY, 'Stripe API', 'fail', Date.now() - start, {
      message: `API test failed: ${error.message}`,
    });
  }
}

/**
 * Check Stripe webhook configuration
 */
async function checkStripeWebhook(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.payments) {
    return createResult(CATEGORY, 'Stripe webhook', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'Stripe not configured',
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return createResult(CATEGORY, 'Stripe webhook', 'warn', Date.now() - start, {
      message: 'Webhook secret not configured',
      details: {
        hint: 'Webhooks are needed for payment notifications',
      },
    });
  }

  // Check format
  if (!webhookSecret.startsWith('whsec_')) {
    return createResult(CATEGORY, 'Stripe webhook', 'warn', Date.now() - start, {
      message: 'Webhook secret format may be invalid (should start with whsec_)',
    });
  }

  return createResult(CATEGORY, 'Stripe webhook', 'pass', Date.now() - start, {
    details: options.verbose ? {
      secretPrefix: webhookSecret.slice(0, 10) + '...',
    } : undefined,
  });
}

/**
 * Export all payment checks
 */
export const paymentsChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Stripe configuration',
    required: false,
    run: checkStripeConfig,
  },
  {
    category: CATEGORY,
    name: 'Stripe API',
    required: false,
    run: checkStripeApi,
  },
  {
    category: CATEGORY,
    name: 'Stripe webhook',
    required: false,
    run: checkStripeWebhook,
  },
];
