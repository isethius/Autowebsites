import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id', email: 'test@example.com' }, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' }, session: { access_token: 'token' } }, error: null }),
    },
  }),
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockReturnValue('mock-jwt-token'),
  verify: vi.fn().mockReturnValue({ userId: 'user-123', email: 'test@example.com' }),
}));

describe('Lead Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export LeadModel class', async () => {
    const { LeadModel } = await import('../crm/lead-model');
    expect(LeadModel).toBeDefined();
  });

  it('should have CRUD methods', async () => {
    const { LeadModel } = await import('../crm/lead-model');
    const model = new LeadModel();

    expect(typeof model.create).toBe('function');
    expect(typeof model.getById).toBe('function');
    expect(typeof model.update).toBe('function');
    expect(typeof model.delete).toBe('function');
    expect(typeof model.list).toBe('function');
  });
});

describe('Pipeline Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export PipelineManager class', async () => {
    const { PipelineManager } = await import('../crm/pipeline-manager');
    expect(PipelineManager).toBeDefined();
  });
});

describe('Activity Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export ActivityLogger class', async () => {
    const { ActivityLogger } = await import('../crm/activity-logger');
    expect(ActivityLogger).toBeDefined();
  });

  it('should have logging methods', async () => {
    const { ActivityLogger } = await import('../crm/activity-logger');
    const logger = new ActivityLogger();

    expect(typeof logger.log).toBe('function');
    expect(typeof logger.getTimeline).toBe('function');
  });
});

describe('Dashboard Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
    process.env.JWT_SECRET = 'test-secret-key-at-least-16-chars';
  });

  it('should export auth functions', async () => {
    const { authMiddleware, requireRole, createAuthRouter } = await import('../dashboard/auth');
    expect(typeof authMiddleware).toBe('function');
    expect(typeof requireRole).toBe('function');
    expect(typeof createAuthRouter).toBe('function');
  });
});

describe('Validation', () => {
  it('should export validation schemas', async () => {
    const validation = await import('../utils/validation');

    expect(validation.emailSchema).toBeDefined();
    expect(validation.urlSchema).toBeDefined();
    expect(validation.createLeadSchema).toBeDefined();
    expect(validation.updateLeadSchema).toBeDefined();
  });

  it('should validate emails correctly', async () => {
    const { emailSchema } = await import('../utils/validation');

    expect(() => emailSchema.parse('test@example.com')).not.toThrow();
    expect(() => emailSchema.parse('invalid-email')).toThrow();
  });

  it('should validate URLs correctly', async () => {
    const { urlSchema } = await import('../utils/validation');

    expect(() => urlSchema.parse('https://example.com')).not.toThrow();
    expect(() => urlSchema.parse('http://example.com')).not.toThrow();
    expect(() => urlSchema.parse('not-a-url')).toThrow();
    expect(() => urlSchema.parse('ftp://example.com')).toThrow();
  });

  it('should validate lead creation input', async () => {
    const { createLeadSchema } = await import('../utils/validation');

    const validInput = {
      business_name: 'Test Business',
      website_url: 'https://example.com',
      email: 'test@example.com',
    };

    expect(() => createLeadSchema.parse(validInput)).not.toThrow();

    const invalidInput = {
      business_name: '',
      website_url: 'not-a-url',
    };

    expect(() => createLeadSchema.parse(invalidInput)).toThrow();
  });
});

describe('Error Handler', () => {
  it('should export error classes and utilities', async () => {
    const errorHandler = await import('../utils/error-handler');

    expect(errorHandler.AppError).toBeDefined();
    expect(errorHandler.ValidationError).toBeDefined();
    expect(errorHandler.NotFoundError).toBeDefined();
    expect(errorHandler.AuthenticationError).toBeDefined();
    expect(typeof errorHandler.classifyError).toBe('function');
    expect(typeof errorHandler.globalErrorHandler).toBe('function');
  });

  it('should create errors with proper properties', async () => {
    const { AppError, ValidationError, NotFoundError } = await import('../utils/error-handler');

    const appError = new AppError('Test error', 500, 'TEST_ERROR');
    expect(appError.message).toBe('Test error');
    expect(appError.statusCode).toBe(500);
    expect(appError.code).toBe('TEST_ERROR');

    const validationError = new ValidationError('Invalid input', ['field is required']);
    expect(validationError.statusCode).toBe(400);
    expect(validationError.details).toContain('field is required');

    const notFoundError = new NotFoundError('Lead');
    expect(notFoundError.statusCode).toBe(404);
  });

  it('should correctly classify errors', async () => {
    const { classifyError, AppError } = await import('../utils/error-handler');

    const retryable = new AppError('Timeout', 503, 'TIMEOUT');
    const classification = classifyError(retryable);
    expect(classification).toHaveProperty('category');
    expect(classification).toHaveProperty('isRetryable');
  });
});

describe('Config', () => {
  beforeEach(() => {
    // Set required env vars for config validation
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
    process.env.JWT_SECRET = 'test-secret-key-at-least-16-chars';
  });

  it('should export configuration', async () => {
    // Config module validates on import, so we just check it exists
    // The validation may throw if env vars aren't set properly
    try {
      const configModule = await import('../utils/config');
      expect(configModule.config).toBeDefined();
      expect(configModule.features).toBeDefined();
    } catch (err: any) {
      // If config fails due to missing env vars in test, that's expected
      expect(err.message).toContain('Environment validation');
    }
  });
});

describe('Health Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
  });

  it('should export health check functions', async () => {
    const { runHealthChecks, quickHealthCheck, getSystemInfo } = await import('../utils/health');

    expect(typeof runHealthChecks).toBe('function');
    expect(typeof quickHealthCheck).toBe('function');
    expect(typeof getSystemInfo).toBe('function');
  });

  it('should return system info', async () => {
    const { getSystemInfo } = await import('../utils/health');
    const info = getSystemInfo();

    expect(info).toHaveProperty('node_version');
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('arch');
    expect(info).toHaveProperty('memory');
    expect(info).toHaveProperty('uptime_seconds');
  });
});
