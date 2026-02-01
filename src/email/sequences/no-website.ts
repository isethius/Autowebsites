/**
 * No Website Email Sequence
 *
 * A 4-step email sequence for businesses that don't have a website at all.
 * These are the easiest leads - they already know they need a website.
 *
 * Sequence:
 *   1. Day 0: Discovery - "I couldn't find your website"
 *   2. Day 3: Value - Why they're losing customers without one
 *   3. Day 7: Preview - Show them what they could have
 *   4. Day 14: Closer - Final offer with urgency
 */

import { SequenceStep } from '../sequence-engine';

/**
 * No Website sequence definition
 */
export const NO_WEBSITE_SEQUENCE: {
  name: string;
  description: string;
  steps: SequenceStep[];
} = {
  name: 'No Website Outreach',
  description: 'Optimized 4-step sequence for businesses without a website. Focuses on the opportunities they\'re missing and makes getting online feel easy.',
  steps: [
    // Step 1: The Discovery (Day 0)
    {
      delay_days: 0,
      subject: "I couldn't find {{business_name}}'s website",
      template: 'no_website_discovery',
      condition: 'always',
      custom_variables: {
        email_type: 'discovery',
        hook_type: 'missing_website',
      },
    },
    // Step 2: The Value (Day 3)
    {
      delay_days: 3,
      subject: '97% of customers search online first',
      template: 'no_website_value',
      condition: 'not_opened',
      custom_variables: {
        email_type: 'value',
        hook_type: 'statistics',
      },
    },
    // Step 3: The Preview (Day 7)
    {
      delay_days: 7,
      subject: 'I built something for {{business_name}}',
      template: 'no_website_preview',
      condition: 'not_replied',
      custom_variables: {
        email_type: 'preview',
        hook_type: 'mockup',
      },
    },
    // Step 4: The Closer (Day 14)
    {
      delay_days: 14,
      subject: 'Quick question before I move on',
      template: 'no_website_closer',
      condition: 'not_replied',
      custom_variables: {
        email_type: 'closer',
        hook_type: 'urgency',
      },
    },
  ],
};

/**
 * Email templates for businesses without websites
 */
export const NO_WEBSITE_TEMPLATES = {
  no_website_discovery: {
    name: 'No Website - Discovery',
    subject: "I couldn't find {{business_name}}'s website",
    body: `Hi {{contact_name}},

I was looking for {{industry_display}} in {{city}} and came across {{business_name}} — great reviews on Google!

But when I tried to learn more, I couldn't find a website for you.

I'm not sure if that's intentional, but I wanted to reach out because I help local businesses like yours get online quickly and affordably.

Here's the thing: {{stat_hook}}

A simple website doesn't have to be complicated or expensive. It just needs to:
• Show up when people search for "{{industry_display}} near me"
• Display your services and contact info clearly
• Make it easy for customers to reach you

Would you be open to a quick chat about getting {{business_name}} online? I can show you exactly what it would look like — no cost, no pressure.

Best,
{{sender_name}}
{{sender_company}}`,
  },

  no_website_value: {
    name: 'No Website - Value',
    subject: '97% of customers search online first',
    body: `Hi {{contact_name}},

Quick follow-up on my note about {{business_name}}.

I wanted to share some numbers that might surprise you:

• 97% of consumers search online for local businesses
• 75% judge a company's credibility based on their website
• 88% of people who search for a local business call or visit within 24 hours
• Businesses without websites lose an estimated 70% of potential customers

Right now, when someone searches for "{{industry_display}} in {{city}}", your competitors with websites are getting those calls — not you.

The good news? Getting online is easier than you think. I can have a professional website for {{business_name}} ready in 48 hours.

Want me to show you what it could look like?

{{sender_name}}`,
  },

  no_website_preview: {
    name: 'No Website - Preview',
    subject: 'I built something for {{business_name}}',
    body: `Hi {{contact_name}},

I know you're busy running your business, so I went ahead and created something for you.

I put together a preview of what a website for {{business_name}} could look like:
{{preview_url}}

This includes:
• Professional design that matches your business
• Mobile-friendly (looks great on phones)
• Easy-to-find contact information
• Service descriptions for {{industry_display}}
• Google Maps integration showing your location
• Click-to-call button for instant contact

No strings attached — I just wanted to show you what's possible.

If you like it, we can have it live this week.
If not, no worries — I hope it at least gives you some ideas.

{{sender_name}}

P.S. Every day without a website is another day your competitors are getting the calls that could be going to you.`,
  },

  no_website_closer: {
    name: 'No Website - Closer',
    subject: 'Quick question before I move on',
    body: `Hi {{contact_name}},

This will be my last email about this.

I've been reaching out because I genuinely think {{business_name}} would benefit from having an online presence. But I also respect your time and don't want to be a pest.

Before I move on, I wanted to ask: Is there a specific reason you haven't set up a website yet?

Common concerns I hear:
• "It's too expensive" — I have packages starting at {{starter_price}}
• "It's too complicated" — I handle everything, you just review and approve
• "I don't have time" — Takes less than an hour of your time total
• "I get enough business from referrals" — A website helps referrals find you too

If any of those resonate, I'm happy to address them. If not, no hard feelings.

The preview I made is still available if you want to take a look:
{{preview_url}}

Either way, I wish you all the best with {{business_name}}.

{{sender_name}}
{{sender_company}}`,
  },
};

/**
 * Industry-specific statistics for the stat_hook variable
 */
export const INDUSTRY_STATS: Record<string, string> = {
  // Service businesses
  plumbers: '85% of people looking for a plumber start with a Google search — and they usually call the first business with a website they find.',
  hvac: '70% of HVAC emergencies start with a mobile search. Without a website, you\'re invisible when people need you most.',
  electricians: '82% of homeowners research electricians online before calling. No website means no consideration.',
  contractors: '85% of homeowners research contractors online before hiring. A website is often the difference between getting the job and being passed over.',
  cleaning: '75% of people looking for cleaning services search online first. Without a website, they can\'t find you.',
  landscaping: '73% of homeowners research landscaping services online. Your competitors with websites are getting these leads.',

  // Professional services
  lawyers: '96% of people seeking legal advice use a search engine. Without a website, you\'re missing almost every potential client.',
  accountants: '67% of small businesses search online when looking for an accountant. No website means they\'ll never find you.',
  dentists: '77% of patients research dentists online before booking. Without a website, you\'re losing patients to competitors.',
  doctors: '77% of patients research doctors online before making an appointment. A website builds trust before they walk in.',

  // Retail & food
  restaurants: '90% of diners research restaurants online before visiting. Without a website or menu online, you\'re losing hungry customers.',
  salons: '70% of salon clients search online before booking. A website lets them see your work and book appointments.',
  fitness: '81% of gym members researched online before joining. Without a website, they\'ll join your competitor instead.',

  // Default
  other: '97% of consumers search online before making a purchase or hiring a service. Without a website, they can\'t find you.',
};

/**
 * Generate personalized email content for No Website sequence
 */
export function generateNoWebsiteEmail(
  step: number,
  leadData: {
    business_name: string;
    contact_name?: string;
    city?: string;
    industry?: string;
    preview_url?: string;
  },
  senderData: {
    sender_name: string;
    sender_company: string;
    starter_price?: string;
  }
): { subject: string; body: string } {
  const templates = Object.values(NO_WEBSITE_TEMPLATES);
  const template = templates[step];
  if (!template) {
    throw new Error(`Invalid step: ${step}. Must be 0-3.`);
  }

  let subject = template.subject;
  let body = template.body;

  // Get industry display name
  const industryDisplayNames: Record<string, string> = {
    plumbers: 'plumbers',
    hvac: 'HVAC services',
    electricians: 'electricians',
    contractors: 'contractors',
    cleaning: 'cleaning services',
    landscaping: 'landscaping services',
    lawyers: 'lawyers',
    accountants: 'accountants',
    dentists: 'dentists',
    doctors: 'medical practices',
    restaurants: 'restaurants',
    salons: 'salons',
    fitness: 'gyms',
    realtors: 'real estate agents',
    'auto-repair': 'auto repair shops',
    photography: 'photographers',
    other: 'local businesses',
  };

  const industry = leadData.industry || 'other';
  const industryDisplay = industryDisplayNames[industry] || industryDisplayNames.other;
  const statHook = INDUSTRY_STATS[industry] || INDUSTRY_STATS.other;

  // Replace variables
  const variables: Record<string, string> = {
    business_name: leadData.business_name,
    contact_name: leadData.contact_name || 'there',
    city: leadData.city || 'your area',
    industry_display: industryDisplay,
    preview_url: leadData.preview_url || '[Preview will be available soon]',
    stat_hook: statHook,
    sender_name: senderData.sender_name,
    sender_company: senderData.sender_company,
    starter_price: '$' + (senderData.starter_price || '1,500'),
  };

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

/**
 * Check if a business appears to have no website
 */
export function hasNoWebsite(business: {
  url?: string;
  website_url?: string;
  website?: string;
}): boolean {
  const url = business.url || business.website_url || business.website || '';

  // No URL at all
  if (!url || url.trim() === '') return true;

  // Check for placeholder/default URLs
  const noWebsiteIndicators = [
    'facebook.com',
    'yelp.com',
    'yellowpages.com',
    'google.com/maps',
    'google.com/business',
    'linkedin.com',
    'instagram.com',
    'twitter.com',
    'nextdoor.com',
    'thumbtack.com',
    'angi.com',
    'homeadvisor.com',
    'bbb.org',
  ];

  const lowerUrl = url.toLowerCase();
  return noWebsiteIndicators.some(indicator => lowerUrl.includes(indicator));
}

// CLI entry point for testing
if (require.main === module) {
  console.log(`\n📧 No Website Email Sequence\n`);
  console.log(`Name: ${NO_WEBSITE_SEQUENCE.name}`);
  console.log(`Description: ${NO_WEBSITE_SEQUENCE.description}`);
  console.log(`\nSteps:`);

  for (let i = 0; i < NO_WEBSITE_SEQUENCE.steps.length; i++) {
    const step = NO_WEBSITE_SEQUENCE.steps[i];
    console.log(`\n  Step ${i + 1} (Day ${step.delay_days}):`);
    console.log(`    Subject: ${step.subject}`);
    console.log(`    Template: ${step.template}`);
    console.log(`    Condition: ${step.condition || 'always'}`);
  }

  // Generate sample email
  console.log(`\n\n📝 Sample Email (Step 1 - Plumber):\n`);
  const sample = generateNoWebsiteEmail(0, {
    business_name: "Mike's Plumbing",
    contact_name: 'Mike',
    city: 'Austin',
    industry: 'plumbers',
  }, {
    sender_name: 'Alex',
    sender_company: 'AutoWebsites Pro',
  });

  console.log(`Subject: ${sample.subject}`);
  console.log(`\n${sample.body}`);

  // Test hasNoWebsite function
  console.log(`\n\n🔍 Website Detection Test:\n`);
  const testCases = [
    { url: '', expected: true },
    { url: 'https://facebook.com/mikesplumbing', expected: true },
    { url: 'https://yelp.com/biz/mikes-plumbing', expected: true },
    { url: 'https://mikesplumbing.com', expected: false },
    { url: 'https://www.mikesplumbing.com', expected: false },
  ];

  for (const test of testCases) {
    const result = hasNoWebsite({ url: test.url });
    const status = result === test.expected ? '✓' : '✗';
    console.log(`  ${status} "${test.url || '(empty)'}" -> hasNoWebsite: ${result}`);
  }
}
