/**
 * Composition Checks
 *
 * Verifies MJML compilation and email template validation.
 */

import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Composition';

/**
 * Check MJML library is installed
 */
async function checkMjmlLibrary(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const mjml2html = (await import('mjml')).default;

    // Test basic MJML compilation
    const result = mjml2html(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Test</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);

    if (!result.html || result.errors?.length > 0) {
      return createResult(CATEGORY, 'MJML library', 'fail', Date.now() - start, {
        message: `MJML compilation failed: ${result.errors?.[0]?.message || 'Unknown error'}`,
      });
    }

    return createResult(CATEGORY, 'MJML library', 'pass', Date.now() - start, {
      details: options.verbose ? { htmlLength: result.html.length } : undefined,
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return createResult(CATEGORY, 'MJML library', 'fail', Date.now() - start, {
        message: 'MJML not installed',
        fixCommand: 'npm install mjml',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'MJML library', 'fail', Date.now() - start, {
      message: `MJML error: ${error.message}`,
    });
  }
}

/**
 * Check email composer
 */
async function checkEmailComposer(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { EmailComposer } = await import('../../email/composer');

    const composer = new EmailComposer({
      senderName: 'Test Sender',
      senderCompany: 'Test Company',
    });

    // Test composing a basic email
    const mockLead = {
      id: 'test-id',
      business_name: 'Test Business',
      email: 'test@example.com',
      website_url: 'https://example.com',
      contact_name: 'John Doe',
    };

    const mockPitch = {
      subjectLines: ['Test Subject'],
      openingHook: 'Hello there!',
      bodyParagraphs: ['This is a test.'],
      callToAction: 'Reply to this email',
      tone: 'professional',
    };

    const composed = composer.composeFromPitch(mockLead as any, mockPitch as any);

    if (!composed.subject || !composed.html) {
      return createResult(CATEGORY, 'Email composer', 'fail', Date.now() - start, {
        message: 'Composed email missing required fields',
      });
    }

    return createResult(CATEGORY, 'Email composer', 'pass', Date.now() - start, {
      details: options.verbose ? {
        subject: composed.subject,
        htmlLength: composed.html.length,
        textLength: composed.text?.length || 0,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Email composer', 'fail', Date.now() - start, {
      message: `Composer failed: ${error.message}`,
    });
  }
}

/**
 * Test all email templates compile correctly
 */
async function checkEmailTemplates(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const mjml2html = (await import('mjml')).default;

    // Test templates
    const templates = [
      {
        name: 'initial_outreach',
        mjml: `
          <mjml>
            <mj-body>
              <mj-section background-color="#ffffff" padding="20px">
                <mj-column>
                  <mj-text>Hi {{contact_name}},</mj-text>
                  <mj-text>{{opening_hook}}</mj-text>
                  <mj-button href="{{preview_url}}">View Preview</mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
      },
      {
        name: 'follow_up',
        mjml: `
          <mjml>
            <mj-body>
              <mj-section background-color="#ffffff" padding="20px">
                <mj-column>
                  <mj-text>Hi {{contact_name}},</mj-text>
                  <mj-text>Just following up on my previous email...</mj-text>
                  <mj-image src="{{before_after_gif_url}}" alt="Before/After" />
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
      },
      {
        name: 'media_showcase',
        mjml: `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text font-size="20px">Your New Website Designs</mj-text>
                  <mj-image src="{{theme_grid_url}}" />
                  <mj-button href="{{preview_url}}">View All Themes</mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
      },
    ];

    const results: { name: string; valid: boolean; error?: string }[] = [];

    for (const template of templates) {
      const result = mjml2html(template.mjml);
      results.push({
        name: template.name,
        valid: !!result.html && (!result.errors || result.errors.length === 0),
        error: result.errors?.[0]?.message,
      });
    }

    const invalid = results.filter(r => !r.valid);

    if (invalid.length > 0) {
      return createResult(CATEGORY, 'Email templates', 'fail', Date.now() - start, {
        message: `${invalid.length} template(s) invalid: ${invalid.map(i => i.name).join(', ')}`,
        details: { results },
      });
    }

    return createResult(CATEGORY, 'Email templates', 'pass', Date.now() - start, {
      message: `All ${templates.length} templates valid`,
      details: options.verbose ? { templates: results.map(r => r.name) } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Email templates', 'fail', Date.now() - start, {
      message: `Template check failed: ${error.message}`,
    });
  }
}

/**
 * Test email generator (simple email generation)
 */
async function checkEmailGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { generateEmail } = await import('../../outreach/email-generator');

    const mockLead = {
      id: 'test-id',
      business_name: 'Test Business',
      website_url: 'https://example.com',
      email: 'test@example.com',
    };

    const mockScore = {
      overall: 5,
      design: { score: 5, issues: [] },
      mobile: { score: 5, issues: [] },
      performance: { score: 5, issues: [] },
      seo: { score: 5, issues: [] },
    };

    const email = generateEmail({
      lead: mockLead as any,
      score: mockScore as any,
      previewUrl: 'https://preview.example.com',
    });

    if (!email.subject || !email.body) {
      return createResult(CATEGORY, 'Email generator', 'fail', Date.now() - start, {
        message: 'Generated email missing required fields',
      });
    }

    return createResult(CATEGORY, 'Email generator', 'pass', Date.now() - start, {
      message: 'Generator working',
      details: options.verbose ? {
        subjectLength: email.subject.length,
        bodyLength: email.body.length,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Email generator', 'fail', Date.now() - start, {
      message: `Generator failed: ${error.message}`,
    });
  }
}

/**
 * Export all composition checks
 */
export const compositionChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'MJML library',
    required: true,
    run: checkMjmlLibrary,
  },
  {
    category: CATEGORY,
    name: 'Email composer',
    required: true,
    run: checkEmailComposer,
  },
  {
    category: CATEGORY,
    name: 'Email templates',
    required: true,
    run: checkEmailTemplates,
  },
  {
    category: CATEGORY,
    name: 'Email generator',
    required: true,
    run: checkEmailGenerator,
  },
];
