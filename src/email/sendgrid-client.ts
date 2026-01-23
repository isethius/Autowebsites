import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

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

const API_KEY = process.env.SENDGRID_API_KEY || '';
const DEFAULT_FROM = process.env.SENDGRID_FROM_EMAIL || 'hello@example.com';
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'AutoWebsites';

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not set. Email will be simulated.');
    return simulateSend(message);
  }

  const payload = {
    personalizations: [{
      to: [{ email: message.to }],
      custom_args: message.customArgs
    }],
    from: {
      email: message.from || DEFAULT_FROM,
      name: message.fromName || DEFAULT_FROM_NAME
    },
    reply_to: message.replyTo ? { email: message.replyTo } : undefined,
    subject: message.subject,
    content: [
      message.text ? { type: 'text/plain', value: message.text } : null,
      message.html ? { type: 'text/html', value: message.html } : null
    ].filter(Boolean),
    tracking_settings: {
      open_tracking: { enable: message.trackOpens !== false },
      click_tracking: { enable: message.trackClicks !== false }
    },
    categories: message.categories
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 202) {
          const messageId = res.headers['x-message-id'] as string;
          resolve({
            success: true,
            messageId,
            statusCode: res.statusCode
          });
        } else {
          let error = 'Unknown error';
          try {
            const errorData = JSON.parse(data);
            error = errorData.errors?.[0]?.message || data;
          } catch {
            error = data || `Status code: ${res.statusCode}`;
          }
          resolve({
            success: false,
            error,
            statusCode: res.statusCode
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    req.write(postData);
    req.end();
  });
}

function simulateSend(message: EmailMessage): SendResult {
  console.log('\n📧 SIMULATED EMAIL SEND:');
  console.log('─'.repeat(50));
  console.log(`To: ${message.to}`);
  console.log(`From: ${message.fromName || DEFAULT_FROM_NAME} <${message.from || DEFAULT_FROM}>`);
  console.log(`Subject: ${message.subject}`);
  console.log('─'.repeat(50));
  console.log(message.text?.slice(0, 500) || '[HTML content]');
  console.log('─'.repeat(50));

  return {
    success: true,
    messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    statusCode: 202
  };
}

export async function sendBulkEmails(
  messages: EmailMessage[],
  options?: {
    delayMs?: number;
    onProgress?: (sent: number, total: number, lastResult: SendResult) => void;
  }
): Promise<SendResult[]> {
  const { delayMs = 1000, onProgress } = options || {};
  const results: SendResult[] = [];

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

export async function verifyApiKey(): Promise<boolean> {
  if (!API_KEY) {
    return false;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/user/credits',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

export function getEmailStats(): Promise<any> {
  if (!API_KEY) {
    return Promise.resolve({ error: 'API key not configured' });
  }

  return new Promise((resolve) => {
    const today = new Date().toISOString().split('T')[0];
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: `/v3/stats?start_date=${today}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ error: 'Failed to parse stats' });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

// CLI entry point
if (require.main === module) {
  const testEmail = process.argv[2];

  if (testEmail) {
    console.log(`\n📧 Sending test email to ${testEmail}...\n`);

    sendEmail({
      to: testEmail,
      from: DEFAULT_FROM,
      fromName: DEFAULT_FROM_NAME,
      subject: 'Test Email from AutoWebsites',
      text: 'This is a test email from AutoWebsites to verify SendGrid integration.',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from AutoWebsites to verify SendGrid integration.</p>
        <p>If you received this, the email system is working correctly! ✅</p>
      `,
      categories: ['test']
    })
      .then(result => {
        if (result.success) {
          console.log(`✅ Email sent! Message ID: ${result.messageId}`);
        } else {
          console.log(`❌ Failed: ${result.error}`);
        }
      });
  } else {
    // Verify API key
    verifyApiKey().then(valid => {
      if (valid) {
        console.log('✅ SendGrid API key is valid');
      } else {
        console.log('❌ SendGrid API key is invalid or not configured');
        console.log('   Set SENDGRID_API_KEY in your .env file');
      }
    });
  }
}
