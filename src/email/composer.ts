import mjml2html from 'mjml';
import { Lead } from '../crm/lead-model';
import { PitchEmail } from '../ai/pitch-generator';

export interface EmailTemplate {
  name: string;
  subject: string;
  mjml: string;
  variables: string[];
}

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
  preheader?: string;
}

export interface TemplateVariables {
  business_name?: string;
  contact_name?: string;
  sender_name?: string;
  sender_company?: string;
  preview_url?: string;
  before_after_gif_url?: string;
  gallery_video_url?: string;
  video_thumbnail_url?: string;
  theme_grid_url?: string;
  unsubscribe_url?: string;
  [key: string]: string | undefined;
}

// Base MJML wrapper
const BASE_TEMPLATE = `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" />
      <mj-text font-size="15px" line-height="1.6" color="#333333" />
      <mj-button background-color="#2563eb" border-radius="6px" font-weight="500" />
    </mj-attributes>
    <mj-style>
      .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
      a { color: #2563eb; }
    </mj-style>
    {{#if preheader}}
    <mj-preview>{{preheader}}</mj-preview>
    {{/if}}
  </mj-head>
  <mj-body background-color="#f4f4f5">
    <mj-section padding="20px 0">
      <mj-column>
        {{content}}
      </mj-column>
    </mj-section>
    <mj-section padding="10px 0">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#9ca3af">
          {{sender_company}}<br/>
          <a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

// Pre-built templates
const TEMPLATES: Record<string, EmailTemplate> = {
  initial_outreach: {
    name: 'Initial Outreach',
    subject: 'Quick question about {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      {{opening_hook}}
    </mj-text>
    <mj-text>
      {{problem_statement}}
    </mj-text>
    <mj-text>
      {{solution_preview}}
    </mj-text>
    {{#if preview_url}}
    <mj-button href="{{preview_url}}">
      View Your Free Preview
    </mj-button>
    {{/if}}
    <mj-text font-style="italic" color="#666666">
      {{social_proof}}
    </mj-text>
    <mj-text>
      {{call_to_action}}
    </mj-text>
    <mj-text>
      {{closing}}<br/><br/>
      {{signature}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'opening_hook', 'problem_statement', 'solution_preview', 'preview_url', 'social_proof', 'call_to_action', 'closing', 'signature'],
  },

  follow_up_1: {
    name: 'Follow Up #1',
    subject: 'Following up - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      I wanted to follow up on my previous email about {{business_name}}'s website.
    </mj-text>
    <mj-text>
      I know you're busy, so I'll keep this short: I found some specific issues that might be costing you customers, and I put together a free preview showing what an updated site could look like.
    </mj-text>
    {{#if preview_url}}
    <mj-button href="{{preview_url}}">
      See Your Preview
    </mj-button>
    {{/if}}
    <mj-text>
      Would you have 10 minutes this week for a quick call?
    </mj-text>
    <mj-text>
      Best,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'preview_url', 'sender_name'],
  },

  follow_up_2: {
    name: 'Follow Up #2 (Final)',
    subject: 'Last chance - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      This will be my last email, and I wanted to share one more thing:
    </mj-text>
    <mj-text>
      {{urgency_point}}
    </mj-text>
    {{#if preview_url}}
    <mj-text>
      The preview I created for {{business_name}} is still available:
    </mj-text>
    <mj-button href="{{preview_url}}">
      View Preview
    </mj-button>
    {{/if}}
    <mj-text>
      If now isn't the right time, I understand. Feel free to reach out whenever you're ready to talk about improving your online presence.
    </mj-text>
    <mj-text>
      Best of luck,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'urgency_point', 'preview_url', 'sender_name'],
  },

  proposal_sent: {
    name: 'Proposal Delivery',
    subject: 'Your website proposal - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      Thank you for your interest in working with us! I've put together a proposal based on our conversation and my analysis of {{business_name}}'s current website.
    </mj-text>
    <mj-button href="{{proposal_url}}">
      View Your Proposal
    </mj-button>
    <mj-text>
      <strong>What's included:</strong>
    </mj-text>
    <mj-text>
      • Detailed analysis of current website issues<br/>
      • Recommended solutions and approach<br/>
      • Multiple investment options<br/>
      • Project timeline
    </mj-text>
    <mj-text>
      This proposal is valid for 30 days. I'm happy to schedule a call to walk through it together and answer any questions.
    </mj-text>
    <mj-text>
      Looking forward to your thoughts,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'proposal_url', 'sender_name'],
  },

  contract_sent: {
    name: 'Contract Delivery',
    subject: "Let's make it official - {{business_name}}",
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      Great news! I've prepared the contract for your {{tier_name}} website project.
    </mj-text>
    <mj-button href="{{contract_url}}">
      Review & Sign Contract
    </mj-button>
    <mj-text>
      <strong>Project Summary:</strong><br/>
      Investment: {{total_amount_display}}<br/>
      Deposit: {{deposit_amount_display}}<br/>
      Timeline: {{timeline}}
    </mj-text>
    <mj-text>
      Once signed and the deposit is received, we'll schedule a kickoff call to get started.
    </mj-text>
    <mj-text>
      Questions? Just reply to this email.<br/><br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'tier_name', 'contract_url', 'total_amount_display', 'deposit_amount_display', 'timeline', 'sender_name'],
  },

  payment_reminder: {
    name: 'Payment Reminder',
    subject: 'Invoice reminder - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      This is a friendly reminder that your invoice for {{amount_display}} is due {{due_date}}.
    </mj-text>
    <mj-button href="{{payment_url}}">
      Pay Now
    </mj-button>
    <mj-text>
      If you've already sent payment, please disregard this message. If you have any questions about the invoice, just reply to this email.
    </mj-text>
    <mj-text>
      Thanks,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'amount_display', 'due_date', 'payment_url', 'sender_name'],
  },

  thank_you: {
    name: 'Thank You / Project Start',
    subject: 'Welcome aboard! - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text font-size="18px" font-weight="bold">
      Welcome to the family!
    </mj-text>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      Thank you for choosing us to build {{business_name}}'s new website! We're excited to get started.
    </mj-text>
    <mj-text>
      <strong>What happens next:</strong>
    </mj-text>
    <mj-text>
      1. <strong>Kickoff Call</strong> - We'll schedule a 30-minute call to discuss your goals, preferences, and gather any materials we need.<br/><br/>
      2. <strong>Discovery & Planning</strong> - We'll dive deep into your business and create a detailed project plan.<br/><br/>
      3. <strong>Design Phase</strong> - You'll see mockups of your new site for review and feedback.<br/><br/>
      4. <strong>Development</strong> - We'll build your site and keep you updated on progress.<br/><br/>
      5. <strong>Launch!</strong> - We'll deploy your new site and provide training.
    </mj-text>
    <mj-text>
      Please reply to this email with your availability for a kickoff call, or use my scheduling link below.
    </mj-text>
    <mj-button href="{{scheduling_url}}">
      Schedule Kickoff Call
    </mj-button>
    <mj-text>
      Looking forward to building something great together!<br/><br/>
      {{sender_name}}<br/>
      {{sender_company}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'scheduling_url', 'sender_name', 'sender_company'],
  },

  video_pitch: {
    name: 'Video Pitch (Before/After)',
    subject: 'Your website redesign preview - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      {{opening_hook}}
    </mj-text>
    <mj-text>
      {{problem_statement}}
    </mj-text>
    <mj-text font-weight="bold" font-size="16px" padding-top="10px">
      Here's what your site could look like:
    </mj-text>
    {{#if before_after_gif_url}}
    <mj-image src="{{before_after_gif_url}}" alt="Before and After comparison for {{business_name}}" border-radius="8px" padding="10px 0" />
    {{/if}}
    <mj-text>
      {{solution_preview}}
    </mj-text>
    {{#if preview_url}}
    <mj-button href="{{preview_url}}">
      View All 10 Design Options
    </mj-button>
    {{/if}}
    <mj-text font-style="italic" color="#666666">
      {{social_proof}}
    </mj-text>
    <mj-text>
      {{call_to_action}}
    </mj-text>
    <mj-text>
      {{closing}}<br/><br/>
      {{signature}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'opening_hook', 'problem_statement', 'solution_preview', 'before_after_gif_url', 'preview_url', 'social_proof', 'call_to_action', 'closing', 'signature'],
  },

  video_follow_up: {
    name: 'Video Follow-up',
    subject: 'Did you see your website preview? - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      I wanted to follow up on the preview I sent for {{business_name}}'s website.
    </mj-text>
    {{#if before_after_gif_url}}
    <mj-text font-weight="bold">
      Quick reminder - here's the before/after:
    </mj-text>
    <mj-image src="{{before_after_gif_url}}" alt="Before and After comparison for {{business_name}}" border-radius="8px" padding="10px 0" />
    {{/if}}
    <mj-text>
      I've identified several opportunities to improve your online presence and help you attract more customers. The full gallery shows 10 different design directions we could take.
    </mj-text>
    {{#if preview_url}}
    <mj-button href="{{preview_url}}">
      View Your Design Options
    </mj-button>
    {{/if}}
    <mj-text>
      Would you have 15 minutes this week for a quick call? I'd love to walk you through the options and answer any questions.
    </mj-text>
    <mj-text>
      Best,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'before_after_gif_url', 'preview_url', 'sender_name'],
  },

  gallery_video: {
    name: 'Gallery Video Showcase',
    subject: 'Watch: 10 design options for {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      I've put together a quick video showcasing 10 unique design directions for {{business_name}}'s website.
    </mj-text>
    {{#if video_thumbnail_url}}
    <mj-image src="{{video_thumbnail_url}}" alt="Click to watch your design preview video" border-radius="8px" padding="10px 0" href="{{gallery_video_url}}" />
    {{/if}}
    {{#if gallery_video_url}}
    <mj-button href="{{gallery_video_url}}">
      Watch Your 30-Second Preview
    </mj-button>
    {{/if}}
    <mj-text>
      Each design is tailored to your industry and built to convert visitors into customers. I'd love to hear which direction resonates with you.
    </mj-text>
    {{#if preview_url}}
    <mj-text font-size="14px" color="#666666">
      Prefer to browse? <a href="{{preview_url}}">View the full interactive gallery →</a>
    </mj-text>
    {{/if}}
    <mj-text>
      Reply to let me know your thoughts, or book a call to discuss your favorites.
    </mj-text>
    <mj-text>
      Best,<br/>
      {{sender_name}}<br/>
      {{sender_company}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'video_thumbnail_url', 'gallery_video_url', 'preview_url', 'sender_name', 'sender_company'],
  },

  theme_grid: {
    name: 'Theme Grid Preview',
    subject: '5 new looks for {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      {{opening_hook}}
    </mj-text>
    <mj-text>
      {{problem_statement}}
    </mj-text>
    <mj-text font-weight="bold" font-size="16px" padding-top="10px">
      I've created 5 design options for {{business_name}}:
    </mj-text>
    {{#if theme_grid_url}}
    <mj-image src="{{theme_grid_url}}" alt="5 design options for {{business_name}}" border-radius="8px" padding="10px 0" href="{{preview_url}}" />
    {{/if}}
    <mj-text>
      {{solution_preview}}
    </mj-text>
    {{#if preview_url}}
    <mj-button href="{{preview_url}}">
      View All 10 Designs
    </mj-button>
    {{/if}}
    <mj-text font-style="italic" color="#666666">
      {{social_proof}}
    </mj-text>
    <mj-text>
      {{call_to_action}}
    </mj-text>
    <mj-text>
      {{closing}}<br/><br/>
      {{signature}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'opening_hook', 'problem_statement', 'solution_preview', 'theme_grid_url', 'preview_url', 'social_proof', 'call_to_action', 'closing', 'signature'],
  },

  website_preview_outreach: {
    name: 'Website Preview Outreach',
    subject: 'I built you a website, {{business_name}} 👀',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      I noticed {{business_name}} {{website_status}} and took the liberty of creating a preview of what a modern site could look like:
    </mj-text>
    <mj-button href="{{preview_url}}" background-color="#2563eb" border-radius="8px" font-size="16px" padding="16px 32px">
      View Your Preview →
    </mj-button>
    <mj-text>
      I've included a few design options - take a look and let me know which style resonates with you (or if you'd like something completely different).
    </mj-text>
    <mj-text>
      This is just a preview - if you like what you see, I can have a fully customized version live within a week.
    </mj-text>
    <mj-text>
      No pressure, no obligation. Just wanted to show you what's possible.
    </mj-text>
    <mj-text>
      Best,<br/>
      {{sender_name}}<br/>
      {{sender_company}}
    </mj-text>
    <mj-text font-size="13px" color="#666666" padding-top="20px">
      P.S. The preview includes your business info I found online. Let me know if anything needs updating!
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'website_status', 'preview_url', 'sender_name', 'sender_company'],
  },

  website_preview_followup: {
    name: 'Website Preview Follow-up',
    subject: 'Did you see your new website preview? - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      I wanted to follow up on the website preview I created for {{business_name}}.
    </mj-text>
    <mj-text>
      I know you're busy running your business, so I'll keep this short:
    </mj-text>
    <mj-text>
      <strong>The preview is still available for you to check out:</strong>
    </mj-text>
    <mj-button href="{{preview_url}}" background-color="#2563eb" border-radius="8px">
      View Your Preview
    </mj-button>
    <mj-text>
      A few things the preview shows:
    </mj-text>
    <mj-text>
      • Professional design that matches your industry<br/>
      • Mobile-friendly layout (looks great on phones)<br/>
      • Clear calls-to-action to convert visitors<br/>
      • Multiple style options to choose from
    </mj-text>
    <mj-text>
      Would you have 10 minutes this week to chat about what you think? I'd love to hear your feedback.
    </mj-text>
    <mj-text>
      Best,<br/>
      {{sender_name}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'preview_url', 'sender_name'],
  },

  website_preview_final: {
    name: 'Website Preview Final',
    subject: 'Last chance to see your website preview - {{business_name}}',
    mjml: `
<mj-section background-color="#ffffff" border-radius="8px" padding="30px">
  <mj-column>
    <mj-text>
      Hi {{contact_name}},
    </mj-text>
    <mj-text>
      This will be my last email about this.
    </mj-text>
    <mj-text>
      I genuinely think {{business_name}} would benefit from having a {{website_benefit}}, but I also respect your time.
    </mj-text>
    <mj-text>
      The preview I created is still available if you'd like to take a look:
    </mj-text>
    <mj-button href="{{preview_url}}" background-color="#2563eb" border-radius="8px">
      View Preview
    </mj-button>
    <mj-text>
      If now isn't the right time, I completely understand. Feel free to reach out whenever you're ready to talk about your online presence.
    </mj-text>
    <mj-text>
      Wishing you all the best,<br/>
      {{sender_name}}<br/>
      {{sender_company}}
    </mj-text>
  </mj-column>
</mj-section>
    `,
    variables: ['contact_name', 'business_name', 'website_benefit', 'preview_url', 'sender_name', 'sender_company'],
  },
};

export class EmailComposer {
  private senderName: string;
  private senderCompany: string;
  private unsubscribeBaseUrl: string;

  constructor(config: {
    senderName: string;
    senderCompany: string;
    unsubscribeBaseUrl?: string;
  }) {
    this.senderName = config.senderName;
    this.senderCompany = config.senderCompany;
    this.unsubscribeBaseUrl = config.unsubscribeBaseUrl || 'http://localhost:3001/unsubscribe';
  }

  composeFromPitch(
    lead: Lead,
    pitch: PitchEmail,
    options: { previewUrl?: string; subjectIndex?: number; useVideoPitch?: boolean } = {}
  ): ComposedEmail {
    const subject = pitch.subjectLines[options.subjectIndex || 0] || pitch.subjectLines[0];
    const variables: TemplateVariables = {
      contact_name: lead.contact_name || 'there',
      business_name: lead.business_name,
      opening_hook: pitch.openingHook,
      problem_statement: pitch.problemStatement,
      solution_preview: pitch.solutionPreview,
      social_proof: pitch.socialProof,
      call_to_action: pitch.callToAction,
      closing: pitch.closing,
      signature: pitch.signature,
      preview_url: options.previewUrl || lead.gallery_url || '',
      before_after_gif_url: lead.before_after_gif_url || '',
      gallery_video_url: lead.gallery_video_url || '',
      video_thumbnail_url: lead.video_thumbnail_url || '',
      sender_name: this.senderName,
      sender_company: this.senderCompany,
      unsubscribe_url: `${this.unsubscribeBaseUrl}?lead_id=${lead.id}`,
    };

    // Use video_pitch template if lead has media and option is enabled
    const templateName = options.useVideoPitch && lead.before_after_gif_url
      ? 'video_pitch'
      : 'initial_outreach';

    return this.composeFromTemplate(templateName, variables, {
      subject,
      preheader: pitch.preheader,
    });
  }

  /**
   * Compose a video-focused email with before/after GIF
   */
  composeVideoPitch(
    lead: Lead,
    pitch: PitchEmail,
    options: { previewUrl?: string; subjectIndex?: number } = {}
  ): ComposedEmail {
    return this.composeFromPitch(lead, pitch, { ...options, useVideoPitch: true });
  }

  /**
   * Compose a gallery video email
   */
  composeGalleryVideo(
    lead: Lead,
    options: { previewUrl?: string } = {}
  ): ComposedEmail {
    if (!lead.gallery_video_url) {
      throw new Error('Lead does not have a gallery video URL');
    }

    const variables: TemplateVariables = {
      contact_name: lead.contact_name || 'there',
      business_name: lead.business_name,
      video_thumbnail_url: lead.video_thumbnail_url || '',
      gallery_video_url: lead.gallery_video_url,
      preview_url: options.previewUrl || lead.gallery_url || '',
      sender_name: this.senderName,
      sender_company: this.senderCompany,
      unsubscribe_url: `${this.unsubscribeBaseUrl}?lead_id=${lead.id}`,
    };

    return this.composeFromTemplate('gallery_video', variables, {
      subject: `Watch: 10 design options for ${lead.business_name}`,
      preheader: 'A quick 30-second preview of your new website designs',
    });
  }

  /**
   * Compose a theme grid preview email
   */
  composeThemeGrid(
    lead: Lead,
    pitch: PitchEmail,
    options: { previewUrl?: string; themeGridUrl?: string } = {}
  ): ComposedEmail {
    const themeGridUrl = options.themeGridUrl || (lead as any).theme_grid_url;
    if (!themeGridUrl) {
      throw new Error('Theme grid URL is required');
    }

    const variables: TemplateVariables = {
      contact_name: lead.contact_name || 'there',
      business_name: lead.business_name,
      opening_hook: pitch.openingHook,
      problem_statement: pitch.problemStatement,
      solution_preview: pitch.solutionPreview,
      social_proof: pitch.socialProof,
      call_to_action: pitch.callToAction,
      closing: pitch.closing,
      signature: pitch.signature,
      theme_grid_url: themeGridUrl,
      preview_url: options.previewUrl || lead.gallery_url || '',
      sender_name: this.senderName,
      sender_company: this.senderCompany,
      unsubscribe_url: `${this.unsubscribeBaseUrl}?lead_id=${lead.id}`,
    };

    return this.composeFromTemplate('theme_grid', variables, {
      subject: `5 new looks for ${lead.business_name}`,
      preheader: 'See the design options I created just for you',
    });
  }

  composeFromTemplate(
    templateName: string,
    variables: TemplateVariables,
    options: { subject?: string; preheader?: string } = {}
  ): ComposedEmail {
    const template = TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Add defaults
    const allVars: TemplateVariables = {
      sender_name: this.senderName,
      sender_company: this.senderCompany,
      ...variables,
    };

    // Interpolate variables in template content
    let content = template.mjml;
    let subject = options.subject || template.subject;

    // Simple variable replacement
    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
      subject = subject.replace(regex, value || '');
    }

    // Handle conditionals {{#if var}}...{{/if}}
    content = this.processConditionals(content, allVars);

    // Build full MJML
    let fullMjml = BASE_TEMPLATE
      .replace('{{content}}', content)
      .replace(/{{preheader}}/g, options.preheader || '')
      .replace(/{{#if preheader}}[\s\S]*?{{\/if}}/g, options.preheader ? `<mj-preview>${options.preheader}</mj-preview>` : '');

    // Replace remaining variables
    for (const [key, value] of Object.entries(allVars)) {
      fullMjml = fullMjml.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    // Compile MJML to HTML
    const { html, errors } = mjml2html(fullMjml, {
      validationLevel: 'soft',
    });

    if (errors.length > 0) {
      console.warn('MJML compilation warnings:', errors);
    }

    // Generate plain text version
    const text = this.generatePlainText(content, allVars);

    return {
      subject,
      html,
      text,
      preheader: options.preheader,
    };
  }

  getAvailableTemplates(): { name: string; key: string; variables: string[] }[] {
    return Object.entries(TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      variables: template.variables,
    }));
  }

  validateTemplate(templateName: string, variables: TemplateVariables): string[] {
    const template = TEMPLATES[templateName];
    if (!template) {
      return [`Template not found: ${templateName}`];
    }

    const missing: string[] = [];
    for (const required of template.variables) {
      if (!variables[required] && required !== 'preview_url') {
        missing.push(required);
      }
    }

    return missing;
  }

  private processConditionals(content: string, variables: TemplateVariables): string {
    // Match {{#if variable}}...{{/if}}
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return content.replace(ifRegex, (match, varName, innerContent) => {
      const value = variables[varName];
      return value ? innerContent : '';
    });
  }

  private generatePlainText(mjmlContent: string, variables: TemplateVariables): string {
    // Strip MJML tags and convert to plain text
    let text = mjmlContent
      .replace(/<mj-button[^>]*href="([^"]*)"[^>]*>([^<]*)<\/mj-button>/g, '$2: $1')
      .replace(/<mj-text[^>]*>/g, '')
      .replace(/<\/mj-text>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<strong>([^<]*)<\/strong>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    return text;
  }
}

export function createEmailComposer(config: {
  senderName: string;
  senderCompany: string;
  unsubscribeBaseUrl?: string;
}): EmailComposer {
  return new EmailComposer(config);
}

export { TEMPLATES };
