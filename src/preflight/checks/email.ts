/**
 * Email Checks
 *
 * Verifies Gmail OAuth, token validity, and test email sending.
 */

import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';
import { features } from '../../utils/config';

const CATEGORY = 'Email';

/**
 * Check Gmail configuration
 */
async function checkGmailConfig(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional) {
    return createResult(CATEGORY, 'Gmail configuration', 'skip', Date.now() - start, {
      message: 'Skipped (--skip-optional)',
    });
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const fromEmail = process.env.GMAIL_FROM_EMAIL;

  if (!clientId || !clientSecret) {
    return createResult(CATEGORY, 'Gmail configuration', 'warn', Date.now() - start, {
      message: 'Gmail OAuth not configured',
      details: {
        hint: 'Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env',
      },
    });
  }

  if (!fromEmail) {
    return createResult(CATEGORY, 'Gmail configuration', 'warn', Date.now() - start, {
      message: 'GMAIL_FROM_EMAIL not set',
    });
  }

  return createResult(CATEGORY, 'Gmail configuration', 'pass', Date.now() - start, {
    details: options.verbose ? { fromEmail } : undefined,
  });
}

/**
 * Check Gmail authorization (token exists and is valid)
 */
async function checkGmailAuth(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.gmail) {
    return createResult(CATEGORY, 'Gmail authorization', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'Gmail not configured',
    });
  }

  try {
    const { verifyConnection, isConfigured } = await import('../../email/gmail-client');

    if (!isConfigured()) {
      return createResult(CATEGORY, 'Gmail authorization', 'warn', Date.now() - start, {
        message: 'Gmail not fully configured',
      });
    }

    const isAuthorized = await verifyConnection();

    if (!isAuthorized) {
      return createResult(CATEGORY, 'Gmail authorization', 'fail', Date.now() - start, {
        message: 'Gmail not authorized',
        fixCommand: 'npx tsx src/email/gmail-client.ts --auth',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'Gmail authorization', 'pass', Date.now() - start);
  } catch (error: any) {
    return createResult(CATEGORY, 'Gmail authorization', 'fail', Date.now() - start, {
      message: `Auth check failed: ${error.message}`,
      fixCommand: 'npx tsx src/email/gmail-client.ts --auth',
    });
  }
}

/**
 * Check email daily quota
 */
async function checkEmailQuota(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.gmail) {
    return createResult(CATEGORY, 'Email quota', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'Gmail not configured',
    });
  }

  try {
    const { getDailyStats, verifyConnection } = await import('../../email/gmail-client');

    const isConnected = await verifyConnection();
    if (!isConnected) {
      return createResult(CATEGORY, 'Email quota', 'skip', Date.now() - start, {
        message: 'Gmail not authorized',
      });
    }

    const stats = await getDailyStats();

    if (stats.quotaRemaining <= 0) {
      return createResult(CATEGORY, 'Email quota', 'warn', Date.now() - start, {
        message: 'Daily email quota exhausted',
        details: stats,
      });
    }

    if (stats.quotaRemaining < 50) {
      return createResult(CATEGORY, 'Email quota', 'warn', Date.now() - start, {
        message: `Low quota: ${stats.quotaRemaining} emails remaining`,
        details: stats,
      });
    }

    return createResult(CATEGORY, 'Email quota', 'pass', Date.now() - start, {
      message: `${stats.quotaRemaining}/${stats.quotaLimit} emails remaining`,
      details: options.verbose ? stats : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Email quota', 'warn', Date.now() - start, {
      message: `Could not check quota: ${error.message}`,
    });
  }
}

/**
 * Send a test email (only if --test-email is provided)
 */
async function checkTestEmailSend(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (!options.testEmail) {
    return createResult(CATEGORY, 'Test email send', 'skip', Date.now() - start, {
      message: 'No test email specified (use --test-email)',
    });
  }

  if (!features.gmail) {
    return createResult(CATEGORY, 'Test email send', 'skip', Date.now() - start, {
      message: 'Gmail not configured',
    });
  }

  try {
    const { sendEmail, verifyConnection } = await import('../../email/gmail-client');

    const isConnected = await verifyConnection();
    if (!isConnected) {
      return createResult(CATEGORY, 'Test email send', 'fail', Date.now() - start, {
        message: 'Gmail not authorized',
        fixCommand: 'npx tsx src/email/gmail-client.ts --auth',
      });
    }

    const result = await sendEmail({
      to: options.testEmail,
      from: process.env.GMAIL_FROM_EMAIL || '',
      subject: 'AutoWebsites Pro - Preflight Test Email',
      text: `This is a test email from the AutoWebsites Pro preflight check.\n\nTimestamp: ${new Date().toISOString()}\n\nIf you received this, your email configuration is working correctly!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">AutoWebsites Pro - Preflight Test</h2>
          <p>This is a test email from the AutoWebsites Pro preflight check.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="color: #16a34a;">If you received this, your email configuration is working correctly!</p>
        </div>
      `,
    });

    if (result.success) {
      return createResult(CATEGORY, 'Test email send', 'pass', Date.now() - start, {
        message: `Email sent to ${options.testEmail}`,
        details: options.verbose ? { messageId: result.messageId } : undefined,
      });
    }

    return createResult(CATEGORY, 'Test email send', 'fail', Date.now() - start, {
      message: result.error || 'Send failed',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Test email send', 'fail', Date.now() - start, {
      message: `Send failed: ${error.message}`,
    });
  }
}

/**
 * Export all email checks
 */
export const emailChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Gmail configuration',
    required: false,
    run: checkGmailConfig,
  },
  {
    category: CATEGORY,
    name: 'Gmail authorization',
    required: false,
    run: checkGmailAuth,
  },
  {
    category: CATEGORY,
    name: 'Email quota',
    required: false,
    run: checkEmailQuota,
  },
  {
    category: CATEGORY,
    name: 'Test email send',
    required: false,
    run: checkTestEmailSend,
  },
];
