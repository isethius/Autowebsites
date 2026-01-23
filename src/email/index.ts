/**
 * Unified Email Client
 *
 * Automatically uses Gmail (free, 500/day) or SendGrid (paid, high volume)
 * based on which is configured. Gmail is preferred if both are configured.
 */

import * as GmailClient from './gmail-client';
import * as SendGridClient from './sendgrid-client';
import { features } from '../utils/config';

export { EmailMessage, SendResult } from './gmail-client';

// Re-export types
export type EmailProvider = 'gmail' | 'sendgrid' | 'none';

/**
 * Get the currently configured email provider
 */
export function getEmailProvider(): EmailProvider {
  if (features.gmail) return 'gmail';
  if (features.sendgrid) return 'sendgrid';
  return 'none';
}

/**
 * Check if email sending is available
 */
export function isEmailConfigured(): boolean {
  return features.email;
}

/**
 * Send a single email using the configured provider
 */
export async function sendEmail(
  message: GmailClient.EmailMessage
): Promise<GmailClient.SendResult> {
  const provider = getEmailProvider();

  if (provider === 'gmail') {
    return GmailClient.sendEmail(message);
  } else if (provider === 'sendgrid') {
    return SendGridClient.sendEmail(message);
  }

  // No provider configured - simulate
  console.warn('No email provider configured. Email will be simulated.');
  return {
    success: true,
    messageId: `sim-${Date.now()}`,
    statusCode: 200,
  };
}

/**
 * Send multiple emails with rate limiting
 */
export async function sendBulkEmails(
  messages: GmailClient.EmailMessage[],
  options?: {
    delayMs?: number;
    onProgress?: (sent: number, total: number, lastResult: GmailClient.SendResult) => void;
  }
): Promise<GmailClient.SendResult[]> {
  const provider = getEmailProvider();

  if (provider === 'gmail') {
    return GmailClient.sendBulkEmails(messages, options);
  } else if (provider === 'sendgrid') {
    return SendGridClient.sendBulkEmails(messages, options);
  }

  // No provider - simulate all
  return messages.map((_, i) => ({
    success: true,
    messageId: `sim-${Date.now()}-${i}`,
    statusCode: 200,
  }));
}

/**
 * Verify email service connection
 */
export async function verifyConnection(): Promise<boolean> {
  const provider = getEmailProvider();

  if (provider === 'gmail') {
    return GmailClient.verifyConnection();
  } else if (provider === 'sendgrid') {
    return SendGridClient.verifyApiKey();
  }

  return false;
}

/**
 * Get email provider status and stats
 */
export async function getProviderStatus(): Promise<{
  provider: EmailProvider;
  connected: boolean;
  dailyQuota?: number;
  sent?: number;
  remaining?: number;
}> {
  const provider = getEmailProvider();

  if (provider === 'gmail') {
    const connected = await GmailClient.verifyConnection();
    const stats = await GmailClient.getDailyStats();

    return {
      provider: 'gmail',
      connected,
      dailyQuota: stats.quotaLimit,
      sent: stats.emailsSent,
      remaining: stats.quotaRemaining,
    };
  } else if (provider === 'sendgrid') {
    const connected = await SendGridClient.verifyApiKey();
    const stats = await SendGridClient.getEmailStats();

    return {
      provider: 'sendgrid',
      connected,
      // SendGrid doesn't have daily limits in the same way
    };
  }

  return {
    provider: 'none',
    connected: false,
  };
}

/**
 * Check if we can send a certain number of emails today (Gmail quota check)
 */
export async function canSendToday(count: number = 1): Promise<boolean> {
  const provider = getEmailProvider();

  if (provider === 'gmail') {
    return GmailClient.canSendToday(count);
  }

  // SendGrid doesn't have the same daily limits
  return true;
}

/**
 * Create a sendEmail function for use with SequenceEngine
 * Returns a function matching the SendEmailFunction interface
 */
export function createSendEmailFunction() {
  return async (
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ messageId: string }> => {
    const result = await sendEmail({
      to,
      from: process.env.GMAIL_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || '',
      subject,
      html,
      text,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return { messageId: result.messageId || '' };
  };
}
