import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              businessName: 'Test Business',
              industry: 'plumbers',
              industryConfidence: 88,
              businessType: 'local',
              targetAudience: 'Homeowners needing plumbing help',
              overallScore: 6,
              issues: [
                {
                  category: 'design',
                  severity: 'major',
                  title: 'Outdated Design',
                  description: 'The website looks dated',
                  businessImpact: 'Reduces trust and call volume',
                  fixDifficulty: 'medium',
                },
              ],
              strengths: ['Clear service list'],
              recommendations: [
                {
                  priority: 2,
                  title: 'Modern Redesign',
                  description: 'Modernize the design',
                  expectedOutcome: 'Higher trust and conversion',
                  timeframe: 'short-term',
                },
              ],
              estimatedImpact: {
                currentMonthlyVisitors: '1,500',
                potentialIncrease: '20-30%',
                estimatedRevenueLoss: '$2,000/month',
              },
              talkingPoints: ['Update design to improve trust'],
              visualStyle: {
                colorSchemes: ['light'],
                dominantColors: ['#ffffff', '#0a4ea1'],
                typography: {
                  primaryFonts: ['Inter'],
                  secondaryFonts: ['Georgia'],
                  style: 'mixed',
                  notes: ['Primary fonts: Inter, Georgia'],
                },
                layoutPatterns: ['hero', 'card-grid'],
                designTraits: ['rounded', 'shadow'],
              },
              vibe: {
                currentVibe: {
                  id: 'trustworthy',
                  name: 'Trustworthy',
                  confidence: 70,
                  rationale: 'Clean palette and reassuring layout',
                },
                recommendedVibes: [
                  {
                    id: 'friendly',
                    name: 'Friendly',
                    fit: 65,
                    rationale: 'Softer tone could improve approachability',
                    adjustments: ['Use warmer palette accents'],
                  },
                ],
              },
            }),
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        usage: { input_tokens: 100, output_tokens: 200 },
      }),
    },
  })),
}));

// Mock playwright for website analyzer
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(null),
          content: vi.fn().mockResolvedValue('<html><body><h1>Test</h1></body></html>'),
          title: vi.fn().mockResolvedValue('Test Business'),
          close: vi.fn(),
        }),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('Claude Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  });

  it('should export ClaudeClient class', async () => {
    const { ClaudeClient } = await import('../ai/claude-client');
    expect(ClaudeClient).toBeDefined();
  });

  it('should create a client instance', async () => {
    const { getClaudeClient } = await import('../ai/claude-client');
    const client = getClaudeClient();
    expect(client).toBeDefined();
  });
});

describe('Website Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  });

  it('should export WebsiteAnalyzer class', async () => {
    const { WebsiteAnalyzer } = await import('../ai/website-analyzer');
    expect(WebsiteAnalyzer).toBeDefined();
  });

  it('should analyze a website and return structured data', async () => {
    const { WebsiteAnalyzer } = await import('../ai/website-analyzer');
    const analyzer = new WebsiteAnalyzer();

    const analysis = await analyzer.analyze({ url: 'https://example.com' });

    expect(analysis).toHaveProperty('businessName');
    expect(analysis).toHaveProperty('industry');
    expect(analysis).toHaveProperty('overallScore');
    expect(analysis).toHaveProperty('issues');
    expect(analysis).toHaveProperty('strengths');
    expect(analysis).toHaveProperty('recommendations');
    expect(analysis).toHaveProperty('estimatedImpact');
    expect(analysis).toHaveProperty('talkingPoints');
    expect(analysis).toHaveProperty('visualStyle');
    expect(analysis).toHaveProperty('vibe');

    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(10);
  });
});

describe('Pitch Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  });

  it('should export PitchGenerator class', async () => {
    const { PitchGenerator } = await import('../ai/pitch-generator');
    expect(PitchGenerator).toBeDefined();
  });
});

describe('Industry Templates', () => {
  it('should export industry templates', async () => {
    const { getIndustryTemplate, INDUSTRIES } = await import('../ai/industry-templates');
    expect(typeof getIndustryTemplate).toBe('function');
    expect(Array.isArray(INDUSTRIES)).toBe(true);
  });

  it('should return template for known industries', async () => {
    const { getIndustryTemplate, INDUSTRIES } = await import('../ai/industry-templates');

    for (const industry of INDUSTRIES.slice(0, 5)) {
      const template = getIndustryTemplate(industry);
      expect(template).toHaveProperty('industry');
      expect(template).toHaveProperty('painPoints');
      expect(template).toHaveProperty('keyTalkingPoints');
      expect(template).toHaveProperty('commonServices');
      expect(template).toHaveProperty('sampleStats');
    }
  });

  it('should return default template for unknown industry', async () => {
    const { getIndustryTemplate } = await import('../ai/industry-templates');
    const template = getIndustryTemplate('unknown-industry-xyz' as any);
    expect(template).toHaveProperty('industry', 'other');
  });
});

describe('Objection Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  });

  it('should export ObjectionHandler class', async () => {
    const { ObjectionHandler } = await import('../ai/objection-handler');
    expect(ObjectionHandler).toBeDefined();
  });

  it('should have common objection categories', async () => {
    const { ObjectionHandler } = await import('../ai/objection-handler');
    const handler = new ObjectionHandler();

    // Should have methods for handling objections
    expect(typeof handler.generateObjectionResponses).toBe('function');
    expect(typeof handler.handleSpecificObjection).toBe('function');
    expect(typeof handler.generateROICalculator).toBe('function');
  });
});
