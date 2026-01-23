import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([
      { statusCode: 202, headers: { 'x-message-id': 'test-msg-id' } },
    ]),
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

describe('Email Composer', () => {
  it('should export EmailComposer class', async () => {
    const { EmailComposer } = await import('../email/composer');
    expect(EmailComposer).toBeDefined();
  });

  it('should create an instance with config', async () => {
    const { EmailComposer } = await import('../email/composer');
    const composer = new EmailComposer({
      senderName: 'Test Sender',
      senderCompany: 'Test Company',
    });
    expect(composer).toBeDefined();
  });

  it('should compose emails with required fields', async () => {
    const { EmailComposer } = await import('../email/composer');
    const composer = new EmailComposer({
      senderName: 'Test',
      senderCompany: 'Company',
    });

    const mockLead = {
      id: '123',
      business_name: 'Test Business',
      email: 'test@example.com',
      website_url: 'https://example.com',
    };

    const mockPitch = {
      subjectLines: ['Subject 1', 'Subject 2'],
      openingHook: 'Hello!',
      bodyParagraphs: ['Paragraph 1', 'Paragraph 2'],
      callToAction: 'Click here',
      closingLine: 'Best regards',
      psLine: 'P.S. This is important',
      tone: 'professional' as const,
    };

    const result = composer.composeFromPitch(mockLead as any, mockPitch);

    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
    expect(result.subject).toBe('Subject 1');
  });
});

describe('Sequence Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export SequenceEngine class', async () => {
    const { SequenceEngine } = await import('../email/sequence-engine');
    expect(SequenceEngine).toBeDefined();
  });
});

describe('Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export WebhookHandler class', async () => {
    const { WebhookHandler } = await import('../email/webhook-handler');
    expect(WebhookHandler).toBeDefined();
  });

  it('should process webhook events', async () => {
    const { WebhookHandler } = await import('../email/webhook-handler');
    const handler = new WebhookHandler();

    const events = [
      {
        event: 'open',
        email: 'test@example.com',
        timestamp: Date.now(),
        sg_message_id: 'msg-123',
      },
    ];

    const result = await handler.handleEvents(events as any);
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('errors');
  });
});

describe('Email Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export EmailAnalytics class', async () => {
    const { EmailAnalytics } = await import('../email/analytics');
    expect(EmailAnalytics).toBeDefined();
  });

  it('should have analytics methods', async () => {
    const { EmailAnalytics } = await import('../email/analytics');
    const analytics = new EmailAnalytics();

    expect(typeof analytics.getOverallMetrics).toBe('function');
    expect(typeof analytics.getSequencePerformance).toBe('function');
    expect(typeof analytics.getSubjectLinePerformance).toBe('function');
  });
});

describe('Unsubscribe Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export UnsubscribeHandler class', async () => {
    const { UnsubscribeHandler } = await import('../email/unsubscribe');
    expect(UnsubscribeHandler).toBeDefined();
  });

  it('should have unsubscribe methods', async () => {
    const { UnsubscribeHandler } = await import('../email/unsubscribe');
    const handler = new UnsubscribeHandler();

    expect(typeof handler.processUnsubscribe).toBe('function');
    expect(typeof handler.isUnsubscribed).toBe('function');
    expect(typeof handler.getUnsubscribePageData).toBe('function');
  });
});
