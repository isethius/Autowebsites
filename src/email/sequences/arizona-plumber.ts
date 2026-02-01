/**
 * Arizona Plumber Email Sequence
 *
 * A 4-step email sequence optimized for plumbers in Arizona (Phoenix, Tucson).
 * Tailored for desert climate concerns, hard water issues, and local market conditions.
 *
 * Sequence:
 *   1. Day 0: Opening - Quick question with website audit hook
 *   2. Day 3: Value Add - Competitor comparison, mobile/speed angle
 *   3. Day 7: Preview - Personalized mockup delivery
 *   4. Day 14: Closer - Final follow-up with scarcity
 */

import { SequenceStep } from '../sequence-engine';
import { SequenceEngine, createSequenceEngine } from '../sequence-engine';
import { EmailComposer, createEmailComposer } from '../composer';
import { LeadModel } from '../../crm/lead-model';
import { ActivityLogger } from '../../crm/activity-logger';
import { sendEmail, createSendEmailFunction } from '../index';

/**
 * Arizona Plumber sequence definition
 */
export const ARIZONA_PLUMBER_SEQUENCE: {
  name: string;
  description: string;
  steps: SequenceStep[];
} = {
  name: 'Arizona Plumber Outreach',
  description: 'Optimized 4-step sequence for plumbers in Phoenix/Tucson, AZ. Focuses on hard water issues, desert climate concerns, and emergency service positioning.',
  steps: [
    // Step 1: The Opener (Day 0)
    {
      delay_days: 0,
      subject: 'Quick question about {{business_name}}',
      template: 'arizona_plumber_opener',
      condition: 'always',
      custom_variables: {
        email_type: 'opener',
        hook_type: 'audit',
      },
    },
    // Step 2: The Value Add (Day 3)
    {
      delay_days: 3,
      subject: 'Why {{competitor_name}} is getting your calls',
      template: 'arizona_plumber_value',
      condition: 'not_opened',
      custom_variables: {
        email_type: 'value',
        hook_type: 'competitor',
      },
    },
    // Step 3: The Preview (Day 7)
    {
      delay_days: 7,
      subject: 'I made this for {{business_name}}',
      template: 'arizona_plumber_preview',
      condition: 'not_replied',
      custom_variables: {
        email_type: 'preview',
        hook_type: 'mockup',
      },
    },
    // Step 4: The Closer (Day 14)
    {
      delay_days: 14,
      subject: 'Last one from me',
      template: 'arizona_plumber_closer',
      condition: 'not_replied',
      custom_variables: {
        email_type: 'closer',
        hook_type: 'scarcity',
      },
    },
  ],
};

/**
 * Email templates specific to Arizona plumbers
 */
export const ARIZONA_PLUMBER_TEMPLATES = {
  arizona_plumber_opener: {
    name: 'Arizona Plumber - Opener',
    subject: 'Quick question about {{business_name}}',
    body: `Hi {{contact_name}},

I was looking for plumbers in {{city}} and came across {{business_name}}.

Your site caught my attention — not because it's bad, but because I think it could be working a lot harder for you.

I ran a quick audit and found a few things:
{{#if issue_1}}• {{issue_1}}{{/if}}
{{#if issue_2}}• {{issue_2}}{{/if}}
{{#if issue_3}}• {{issue_3}}{{/if}}

In Arizona's heat, homeowners search for plumbers on their phones while dealing with emergencies — burst pipes from thermal expansion, water heaters failing in the 115° summer, AC drain lines backing up. They need to call someone fast.

Want me to send over a mockup of what a refresh could look like? No cost, no obligation — just want to show you what's possible.

Best,
{{sender_name}}
{{sender_company}}

P.S. I only take on 3 new plumbing clients per month to ensure quality. Happy to chat if you're interested.`,
  },

  arizona_plumber_value: {
    name: 'Arizona Plumber - Value Add',
    subject: 'Why {{competitor_name}} is getting your calls',
    body: `Hi {{contact_name}},

Quick follow-up on my note from earlier this week.

I looked at a few other plumbers in {{city}}, and one thing stood out: {{competitor_name}} has a site that's built for mobile — click to call, service area map, emergency button right at the top.

Here's the thing about Arizona:
• 85% of emergency plumbing searches happen on phones
• Hard water is a HUGE issue here — tankless heater maintenance, water softener installs
• Monsoon season means flooded yards and backed-up drains
• Summer AC drain clogs are a goldmine

If your site doesn't load fast and make it easy to call, you're losing jobs to competitors who show up first in "plumber near me" searches.

I put together a preview of what {{business_name}} could look like — want me to send it over?

{{sender_name}}`,
  },

  arizona_plumber_preview: {
    name: 'Arizona Plumber - Preview',
    subject: 'I made this for {{business_name}}',
    body: `Hi {{contact_name}},

I know you're busy, so I went ahead and created something for you.

Here's a preview of what a new site for {{business_name}} could look like:
{{preview_url}}

This includes:
• Mobile-first design (click-to-call, emergency button prominently displayed)
• Service area map highlighting {{city}} and surrounding areas
• Trust signals (licensed, insured, ROC number visible)
• Fast loading (under 2 seconds — critical for Phoenix's impatient, overheated homeowners)
• Arizona-specific services highlighted (hard water solutions, AC drain cleaning, thermal expansion issues)

If you like it, I can have it live in 48 hours.
If not, no hard feelings — hope it at least gives you some ideas.

{{sender_name}}

P.S. The monsoon season is almost here. It's the perfect time to capture those emergency calls with a site that converts.`,
  },

  arizona_plumber_closer: {
    name: 'Arizona Plumber - Closer',
    subject: 'Last one from me',
    body: `Hi {{contact_name}},

This is my last follow-up. I don't want to clog your inbox (pun intended).

If a website refresh isn't a priority right now, I totally get it. You're busy fixing pipes, not thinking about marketing.

But if you ever want to revisit, the preview I made is still here:
{{preview_url}}

A few things to consider:
• Summer is coming — emergency calls spike when water heaters can't keep up with demand
• Hard water season never ends in Arizona
• Your competitors are investing in their online presence

I'm taking on 2 more plumbing clients in the {{city}} area this quarter. If you want to be one of them, just reply to this email.

Either way, wishing you a busy season ahead.

{{sender_name}}
{{sender_company}}`,
  },
};

/**
 * Generate personalized email content for Arizona plumber sequence
 */
export function generateArizonaPlumberEmail(
  step: number,
  leadData: {
    business_name: string;
    contact_name?: string;
    city?: string;
    preview_url?: string;
    issues?: string[];
    competitor_name?: string;
  },
  senderData: {
    sender_name: string;
    sender_company: string;
  }
): { subject: string; body: string } {
  const template = Object.values(ARIZONA_PLUMBER_TEMPLATES)[step];
  if (!template) {
    throw new Error(`Invalid step: ${step}. Must be 0-3.`);
  }

  let subject = template.subject;
  let body = template.body;

  // Replace variables
  const variables: Record<string, string> = {
    business_name: leadData.business_name,
    contact_name: leadData.contact_name || 'there',
    city: leadData.city || 'your area',
    preview_url: leadData.preview_url || '[Preview link]',
    competitor_name: leadData.competitor_name || 'a competitor down the street',
    issue_1: leadData.issues?.[0] || 'Mobile experience could be improved',
    issue_2: leadData.issues?.[1] || 'Contact info is hard to find',
    issue_3: leadData.issues?.[2] || 'No emergency service call-to-action',
    sender_name: senderData.sender_name,
    sender_company: senderData.sender_company,
  };

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  // Handle conditionals - use [\s\S] instead of 's' flag for ES5 compatibility
  body = body.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });

  return { subject, body };
}

/**
 * Create the Arizona Plumber sequence in the database
 */
export async function createArizonaPlumberSequence(
  sequenceEngine: SequenceEngine
): Promise<string> {
  const sequence = await sequenceEngine.createSequence(
    ARIZONA_PLUMBER_SEQUENCE.name,
    ARIZONA_PLUMBER_SEQUENCE.steps,
    ARIZONA_PLUMBER_SEQUENCE.description
  );

  console.log(`✅ Created Arizona Plumber sequence: ${sequence.id}`);
  return sequence.id;
}

/**
 * Enroll a lead in the Arizona Plumber sequence
 */
export async function enrollInArizonaPlumberSequence(
  sequenceEngine: SequenceEngine,
  leadId: string,
  sequenceId: string
): Promise<void> {
  await sequenceEngine.enrollLead(leadId, sequenceId, { startImmediately: true });
  console.log(`✅ Enrolled lead ${leadId} in Arizona Plumber sequence`);
}

/**
 * Sample issues to use in emails based on common Arizona plumber website problems
 */
export const COMMON_ARIZONA_PLUMBER_ISSUES = [
  // Mobile issues
  'Site loads slowly on mobile (takes over 5 seconds)',
  'Phone number requires zooming to tap',
  'No click-to-call button visible above the fold',

  // Trust issues
  'ROC license number not displayed',
  'No Google reviews visible on site',
  'Missing "Licensed & Insured" badge',

  // Service issues
  'Emergency services not prominently featured',
  'No 24/7 availability messaging',
  'Service area not clearly defined',

  // Arizona-specific
  'No mention of hard water services',
  'AC drain cleaning not listed',
  'No tankless water heater services shown',

  // Conversion issues
  'Contact form buried at bottom of page',
  'No online scheduling option',
  'Pricing information completely hidden',

  // Technical issues
  'Not optimized for local SEO',
  'Missing meta descriptions',
  'No structured data for local business',
];

/**
 * Sample competitor names for Arizona plumber market
 */
export const ARIZONA_PLUMBER_COMPETITORS = [
  'Rainforest Plumbing',
  'Robins Plumbing',
  'Hansen Family Plumbing',
  'Deer Valley Plumbing',
  'AZ Valley Plumbing',
  'Chas Roberts',
  'George Brazil',
  'Parker & Sons',
  'Goettl Air Conditioning & Plumbing',
  'American Home Water & Air',
];

// CLI entry point for testing
if (require.main === module) {
  console.log(`\n📧 Arizona Plumber Email Sequence\n`);
  console.log(`Name: ${ARIZONA_PLUMBER_SEQUENCE.name}`);
  console.log(`Description: ${ARIZONA_PLUMBER_SEQUENCE.description}`);
  console.log(`\nSteps:`);

  for (let i = 0; i < ARIZONA_PLUMBER_SEQUENCE.steps.length; i++) {
    const step = ARIZONA_PLUMBER_SEQUENCE.steps[i];
    console.log(`\n  Step ${i + 1} (Day ${step.delay_days}):`);
    console.log(`    Subject: ${step.subject}`);
    console.log(`    Template: ${step.template}`);
    console.log(`    Condition: ${step.condition || 'always'}`);
  }

  // Generate sample email
  console.log(`\n\n📝 Sample Email (Step 1):\n`);
  const sample = generateArizonaPlumberEmail(0, {
    business_name: "Joe's Plumbing",
    contact_name: 'Joe',
    city: 'Phoenix',
    issues: [
      'Site loads slowly on mobile (takes over 5 seconds)',
      'No click-to-call button visible above the fold',
      'Emergency services not prominently featured',
    ],
  }, {
    sender_name: 'Alex',
    sender_company: 'AutoWebsites Pro',
  });

  console.log(`Subject: ${sample.subject}`);
  console.log(`\n${sample.body}`);
}
