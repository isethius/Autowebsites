import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Reuse the same interface as sendgrid-client for consistency
export interface EmailMessage {
  to: string;
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  categories?: string[];
  customArgs?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export interface DailyStats {
  date: string;
  emailsSent: number;
  quotaLimit: number;
  quotaRemaining: number;
}

// Configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const FROM_EMAIL = process.env.GMAIL_FROM_EMAIL || '';
const FROM_NAME = process.env.GMAIL_FROM_NAME || process.env.COMPANY_NAME || 'AutoWebsites';
const TOKEN_PATH = path.join(process.cwd(), '.gmail-token.json');
const DAILY_QUOTA = parseInt(process.env.GMAIL_DAILY_QUOTA || '500', 10);

// OAuth2 scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Supabase client for quota tracking
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required for quota tracking');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

// Create OAuth2 client
function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // Desktop app redirect
  );
}

// Load stored token
function loadToken(): any | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading token:', error);
  }
  return null;
}

// Save token
function saveToken(token: any): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log('Token saved to', TOKEN_PATH);
}

// Get authorized OAuth2 client
async function getAuthorizedClient(): Promise<OAuth2Client> {
  const oauth2Client = createOAuth2Client();
  const token = loadToken();

  if (token) {
    oauth2Client.setCredentials(token);

    // Check if token needs refresh
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        saveToken(credentials);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Token refresh failed. Please re-authorize.');
      }
    }

    return oauth2Client;
  }

  throw new Error('Not authorized. Run Gmail client interactively first to authorize.');
}

// Interactive authorization flow
async function authorize(): Promise<OAuth2Client> {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  });

  console.log('\nAuthorize this app by visiting this URL:\n');
  console.log(authUrl);
  console.log('\nAfter authorization, you will receive a code. Enter it below.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code: ', async (code) => {
      rl.close();

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        saveToken(tokens);
        console.log('\nAuthorization successful!');
        resolve(oauth2Client);
      } catch (error) {
        reject(new Error(`Error getting token: ${error}`));
      }
    });
  });
}

// Encode email message to base64url format
function encodeEmail(message: EmailMessage): string {
  const boundary = `----=_Part_${Date.now()}`;

  const headers = [
    `From: ${message.fromName || FROM_NAME} <${message.from || FROM_EMAIL}>`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    `MIME-Version: 1.0`,
  ];

  if (message.replyTo) {
    headers.push(`Reply-To: ${message.replyTo}`);
  }

  let body: string;

  if (message.html && message.text) {
    // Multipart message with both text and HTML
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message.text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      message.html,
      '',
      `--${boundary}--`,
    ].join('\r\n');
  } else if (message.html) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    body = '\r\n' + message.html;
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    body = '\r\n' + (message.text || '');
  }

  const email = headers.join('\r\n') + '\r\n' + body;

  // Base64url encode
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get daily email stats
export async function getDailyStats(): Promise<DailyStats> {
  const today = getTodayDate();

  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('email_daily_stats')
      .select('*')
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        date: data.date,
        emailsSent: data.emails_sent,
        quotaLimit: data.quota_limit,
        quotaRemaining: data.quota_limit - data.emails_sent,
      };
    }

    // No record for today yet
    return {
      date: today,
      emailsSent: 0,
      quotaLimit: DAILY_QUOTA,
      quotaRemaining: DAILY_QUOTA,
    };
  } catch (error) {
    console.error('Error getting daily stats:', error);
    // Return defaults if database is unavailable
    return {
      date: today,
      emailsSent: 0,
      quotaLimit: DAILY_QUOTA,
      quotaRemaining: DAILY_QUOTA,
    };
  }
}

// Check if we can send more emails today
export async function canSendToday(count: number = 1): Promise<boolean> {
  const stats = await getDailyStats();
  return stats.quotaRemaining >= count;
}

// Increment daily send count
async function incrementSendCount(): Promise<void> {
  const today = getTodayDate();

  try {
    const db = getSupabase();

    // Upsert: insert or update the count
    const { error } = await db
      .from('email_daily_stats')
      .upsert({
        date: today,
        emails_sent: 1,
        quota_limit: DAILY_QUOTA,
      }, {
        onConflict: 'date',
        ignoreDuplicates: false,
      });

    if (error) {
      // If upsert failed, try incrementing
      await db.rpc('increment_email_daily_count', { target_date: today });
    }
  } catch (error) {
    console.error('Error incrementing send count:', error);
  }
}

// Simulate send for testing
function simulateSend(message: EmailMessage): SendResult {
  console.log('\n SIMULATED GMAIL SEND:');
  console.log('-'.repeat(50));
  console.log(`To: ${message.to}`);
  console.log(`From: ${message.fromName || FROM_NAME} <${message.from || FROM_EMAIL}>`);
  console.log(`Subject: ${message.subject}`);
  console.log('-'.repeat(50));
  console.log(message.text?.slice(0, 500) || '[HTML content]');
  console.log('-'.repeat(50));

  return {
    success: true,
    messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    statusCode: 200,
  };
}

// Send a single email
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  // Check if Gmail is configured
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Gmail not configured. Email will be simulated.');
    return simulateSend(message);
  }

  // Check daily quota
  const canSend = await canSendToday();
  if (!canSend) {
    return {
      success: false,
      error: 'Daily email quota exceeded. Try again tomorrow.',
      statusCode: 429,
    };
  }

  try {
    const auth = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = encodeEmail(message);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    // Track the send
    await incrementSendCount();

    return {
      success: true,
      messageId: response.data.id || undefined,
      statusCode: 200,
    };
  } catch (error: any) {
    console.error('Gmail send error:', error);

    // Handle specific errors
    if (error.message?.includes('Not authorized')) {
      return {
        success: false,
        error: 'Gmail not authorized. Run: npx tsx src/email/gmail-client.ts',
        statusCode: 401,
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown Gmail error',
      statusCode: error.code || 500,
    };
  }
}

// Send bulk emails with rate limiting
export async function sendBulkEmails(
  messages: EmailMessage[],
  options?: {
    delayMs?: number;
    onProgress?: (sent: number, total: number, lastResult: SendResult) => void;
  }
): Promise<SendResult[]> {
  const { delayMs = 1000, onProgress } = options || {};
  const results: SendResult[] = [];

  // Check if we have enough quota
  const canSend = await canSendToday(messages.length);
  if (!canSend) {
    const stats = await getDailyStats();
    console.warn(`Only ${stats.quotaRemaining} emails remaining today. ${messages.length} requested.`);

    // Send what we can
    const toSend = messages.slice(0, stats.quotaRemaining);
    const skipped = messages.slice(stats.quotaRemaining);

    // Add skipped results
    for (const _ of skipped) {
      results.push({
        success: false,
        error: 'Quota exceeded',
        statusCode: 429,
      });
    }

    messages = toSend;
  }

  for (let i = 0; i < messages.length; i++) {
    const result = await sendEmail(messages[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, messages.length, result);
    }

    // Rate limiting delay
    if (i < messages.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Verify Gmail connection/authorization
export async function verifyConnection(): Promise<boolean> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return false;
  }

  try {
    const auth = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Try to get profile - this validates the connection
    const response = await gmail.users.getProfile({ userId: 'me' });
    return !!response.data.emailAddress;
  } catch (error) {
    return false;
  }
}

// Get the authorized email address
export async function getAuthorizedEmail(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return null;
  }

  try {
    const auth = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const response = await gmail.users.getProfile({ userId: 'me' });
    return response.data.emailAddress || null;
  } catch {
    return null;
  }
}

// Check if Gmail is configured (has credentials)
export function isConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const testEmail = args.find(a => a.includes('@'));
  const forceAuth = args.includes('--auth');

  async function main() {
    console.log('\n--- Gmail Client ---\n');

    // Check configuration
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log('Gmail not configured.');
      console.log('\nTo configure Gmail:');
      console.log('1. Go to https://console.cloud.google.com');
      console.log('2. Create a project and enable Gmail API');
      console.log('3. Create OAuth2 credentials (Desktop app)');
      console.log('4. Add to .env:');
      console.log('   GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com');
      console.log('   GMAIL_CLIENT_SECRET=GOCSPX-xxx');
      console.log('   GMAIL_FROM_EMAIL=youremail@gmail.com');
      return;
    }

    // Force re-authorization
    if (forceAuth) {
      console.log('Starting authorization flow...');
      await authorize();
      return;
    }

    // Check authorization status
    const token = loadToken();
    if (!token) {
      console.log('No authorization found. Starting authorization flow...');
      await authorize();
      return;
    }

    // Test connection
    console.log('Checking connection...');
    const connected = await verifyConnection();

    if (!connected) {
      console.log('Authorization expired or invalid. Re-authorizing...');
      await authorize();
      return;
    }

    const email = await getAuthorizedEmail();
    console.log(`Connected as: ${email}`);

    // Show daily stats
    const stats = await getDailyStats();
    console.log(`\nDaily quota: ${stats.emailsSent}/${stats.quotaLimit} sent (${stats.quotaRemaining} remaining)`);

    // Send test email if address provided
    if (testEmail) {
      console.log(`\nSending test email to ${testEmail}...`);

      const result = await sendEmail({
        to: testEmail,
        from: FROM_EMAIL,
        fromName: FROM_NAME,
        subject: 'Test Email from AutoWebsites (Gmail)',
        text: 'This is a test email from AutoWebsites to verify Gmail integration.',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from AutoWebsites to verify Gmail integration.</p>
          <p>If you received this, the email system is working correctly!</p>
        `,
      });

      if (result.success) {
        console.log(`Email sent! Message ID: ${result.messageId}`);
      } else {
        console.log(`Failed: ${result.error}`);
      }
    } else {
      console.log('\nTo send a test email:');
      console.log('  npx tsx src/email/gmail-client.ts your@email.com');
      console.log('\nTo re-authorize:');
      console.log('  npx tsx src/email/gmail-client.ts --auth');
    }
  }

  main().catch(console.error);
}
