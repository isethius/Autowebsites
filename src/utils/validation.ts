import { z } from 'zod';

// Common validation schemas

// Email
export const emailSchema = z.string().email('Invalid email address').toLowerCase();

// URL
export const urlSchema = z.string().url('Invalid URL').refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'URL must start with http:// or https://' }
);

// Phone (basic - accepts various formats)
export const phoneSchema = z.string().regex(
  /^[\d\s\-\+\(\)\.]+$/,
  'Invalid phone number format'
).transform((val) => val.replace(/\D/g, '')); // Normalize to digits only

// UUID
export const uuidSchema = z.string().uuid('Invalid ID format');

// Date
export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Lead schemas
export const createLeadSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(255),
  website_url: urlSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  contact_name: z.string().max(255).optional(),
  contact_title: z.string().max(255).optional(),
  industry: z.string().default('other'),
  company_size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).default('US'),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(10000).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  pipeline_stage: z.enum(['new', 'qualified', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  budget_range: z.enum(['low', 'medium', 'high', 'enterprise']).optional(),
  decision_maker: z.boolean().optional(),
  website_score: z.number().min(0).max(10).optional(),
  lead_score: z.number().min(0).max(100).optional(),
});

// Proposal schemas
export const createProposalSchema = z.object({
  lead_id: uuidSchema,
  discount_percent: z.number().min(0).max(50).optional(),
  custom_pricing: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    description: z.string(),
    features: z.array(z.string()),
    timeline: z.string(),
    recommended: z.boolean().optional(),
  })).optional(),
});

// Email sequence schemas
export const sequenceStepSchema = z.object({
  delay_days: z.number().int().min(0).max(90),
  subject: z.string().min(1).max(200),
  template: z.string(),
  condition: z.enum(['always', 'not_opened', 'not_clicked', 'not_replied', 'opened', 'clicked']).optional(),
  custom_variables: z.record(z.string()).optional(),
});

export const createSequenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  steps: z.array(sequenceStepSchema).min(1).max(10),
});

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().max(100).optional(),
});

// Validation helper
export function validate<T>(schema: z.Schema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  );

  return { success: false, errors };
}

// Express middleware for validation
export function validateBody<T>(schema: z.Schema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validate(schema, req.body);

    if (result.success === false) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.Schema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validate(schema, req.query);

    if (result.success === false) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.errors,
      });
    }

    req.query = result.data;
    next();
  };
}

export function validateParams<T>(schema: z.Schema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validate(schema, req.params);

    if (result.success === false) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: result.errors,
      });
    }

    req.params = result.data;
    next();
  };
}

// Custom validators
export function isValidBusinessWebsite(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Reject common non-business domains
    const blockedDomains = [
      'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
      'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
      'yelp.com', 'google.com', 'yahoo.com', 'bing.com',
    ];

    const hostname = parsed.hostname.toLowerCase().replace('www.', '');

    if (blockedDomains.some(d => hostname.includes(d))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isValidIndustry(industry: string): boolean {
  const validIndustries = [
    'plumbers', 'lawyers', 'restaurants', 'dentists', 'contractors',
    'hvac', 'salons', 'doctors', 'accountants', 'realtors',
    'auto-repair', 'fitness', 'cleaning', 'landscaping', 'photography', 'other',
  ];

  return validIndustries.includes(industry.toLowerCase());
}
