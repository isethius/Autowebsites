import { IndustryType, INDUSTRIES } from '../ai/industry-templates';

export const CTA_CONTEXTS = ['contact', 'purchase', 'signup', 'learn-more'] as const;
export type CTAContext = typeof CTA_CONTEXTS[number];

export interface CTAQuery {
  industry?: IndustryType | string;
  vibe?: string;
  context?: CTAContext;
}

export type CTASet = Record<CTAContext, string[]>;
export type CTASetOverrides = Partial<Record<CTAContext, string[]>>;

const DEFAULT_CTA_SET: CTASet = {
  contact: ['Contact Us', 'Call Today', 'Schedule a Consultation', 'Request a Callback'],
  purchase: ['Get a Quote', 'Book Now', 'Order Online', 'Start Your Project'],
  signup: ['Sign Up', 'Join Now', 'Start Free Trial', 'Get Updates'],
  'learn-more': ['Learn More', 'View Services', 'See Details', 'Explore Options'],
};
const EMPTY_CTA_SET: CTASetOverrides = {};

const VIBE_CTA_SETS = {
  bold: {
    contact: ['Call Now', 'Get Help Today', 'Talk to Us Now'],
    purchase: ['Book Now', 'Start Today', 'Get It Done'],
    signup: ['Join Today', 'Start Now', 'Claim Your Spot'],
    'learn-more': ['See Results', 'See How It Works', 'View Proof'],
  },
  minimal: {
    contact: ['Contact Us', 'Get in Touch', 'Send a Message'],
    purchase: ['Get Started', 'Request Pricing', 'Book Service'],
    signup: ['Sign Up', 'Create Account', 'Start Free Trial'],
    'learn-more': ['Learn More', 'View Details', 'See Services'],
  },
  playful: {
    contact: ['Say Hello', 'Let Us Chat', 'Talk With Us'],
    purchase: ['Book Your Spot', 'Save My Seat', 'Order Now'],
    signup: ['Join the Fun', 'Start the Trial', 'Sign Me Up'],
    'learn-more': ['Take a Peek', 'See the Fun', 'Learn the Details'],
  },
  creative: {
    contact: ['Start a Project', 'Collaborate With Us', 'Let Us Create'],
    purchase: ['Get a Quote', 'Request a Proposal', 'Reserve Your Date'],
    signup: ['Join the Studio', 'Get Updates', 'Join the List'],
    'learn-more': ['See the Work', 'Explore the Portfolio', 'Discover the Process'],
  },
  executive: {
    contact: ['Schedule a Consultation', 'Request a Briefing', 'Talk to an Expert'],
    purchase: ['Request a Proposal', 'Get a Quote', 'Start a Project'],
    signup: ['Create an Account', 'Enroll Now', 'Start Free Trial'],
    'learn-more': ['Review Our Services', 'See Case Studies', 'Explore Solutions'],
  },
  elegant: {
    contact: ['Schedule a Visit', 'Request Details', 'Speak With Us'],
    purchase: ['Begin Your Experience', 'Reserve Now', 'Book a Session'],
    signup: ['Join the List', 'Become a Member', 'Start Your Journey'],
    'learn-more': ['Discover More', 'Explore the Collection', 'See the Details'],
  },
  trustworthy: {
    contact: ['Talk to a Specialist', 'Contact Us', 'Call Today'],
    purchase: ['Get a Quote', 'Schedule Service', 'Book Now'],
    signup: ['Sign Up', 'Start Free Trial', 'Get Updates'],
    'learn-more': ['Learn More', 'View Services', 'See Our Process'],
  },
  maverick: {
    contact: ['Talk to Us', 'Make the Switch', 'Start Something New'],
    purchase: ['Start Now', 'Get Moving', 'Book It'],
    signup: ['Join the Movement', 'Claim Your Spot', 'Get Started'],
    'learn-more': ['See What Is Different', 'Explore the Edge', 'Discover the Shift'],
  },
  friendly: {
    contact: ['Say Hello', 'Let Us Help', 'Contact Us'],
    purchase: ['Book a Visit', 'Get Started', 'Schedule Service'],
    signup: ['Join Us', 'Start Free Trial', 'Sign Up'],
    'learn-more': ['Learn More', 'See How We Help', 'View Services'],
  },
} as const satisfies Record<string, CTASetOverrides>;

export type CTAVibeId = keyof typeof VIBE_CTA_SETS;

const INDUSTRY_CTA_SETS: Record<IndustryType, CTASetOverrides> = {
  plumbers: {
    contact: ['Call Now', 'Schedule Service', 'Request a Callback'],
    purchase: ['Get a Free Quote', 'Book Emergency Repair', 'Schedule Service'],
    signup: ['Join the Maintenance Plan', 'Get Service Reminders'],
    'learn-more': ['View Plumbing Services', 'See Emergency Pricing', 'Learn About Maintenance Plans'],
  },
  lawyers: {
    contact: ['Free Consultation', 'Schedule a Consultation', 'Talk to an Attorney'],
    purchase: ['Request a Case Review', 'Get Legal Help', 'Start Your Case'],
    signup: ['Get Legal Updates', 'Join Our Newsletter'],
    'learn-more': ['View Practice Areas', 'See Case Results', 'Meet the Attorneys'],
  },
  restaurants: {
    contact: ['Reserve a Table', 'Call for a Reservation', 'Contact Us'],
    purchase: ['Order Online', 'View Menu', 'Buy a Gift Card'],
    signup: ['Join the VIP List', 'Get Special Offers'],
    'learn-more': ['See the Menu', 'View Hours', 'Explore Our Story'],
  },
  dentists: {
    contact: ['Book an Appointment', 'Schedule a Visit', 'Call the Office'],
    purchase: ['Get New Patient Offer', 'Schedule a Cleaning', 'Request a Consultation'],
    signup: ['Join Our Patient List', 'Get Appointment Reminders'],
    'learn-more': ['View Dental Services', 'Meet the Team', 'See Insurance Options'],
  },
  contractors: {
    contact: ['Get a Free Estimate', 'Schedule a Walkthrough', 'Request a Callback'],
    purchase: ['Start Your Project', 'Request a Proposal', 'Get Pricing'],
    signup: ['Get Project Updates', 'Join Our Builder List'],
    'learn-more': ['View Our Work', 'See Project Timelines', 'Explore Services'],
  },
  hvac: {
    contact: ['Schedule Service', 'Call for Emergency', 'Book Maintenance'],
    purchase: ['Get a Free Estimate', 'Request a Quote', 'Start Installation'],
    signup: ['Join the Maintenance Plan', 'Get Seasonal Reminders'],
    'learn-more': ['View HVAC Services', 'Learn About Financing', 'See Service Plans'],
  },
  salons: {
    contact: ['Book an Appointment', 'Call the Salon', 'Reserve Your Spot'],
    purchase: ['Book Your Service', 'Buy a Gift Card', 'Get Pricing'],
    signup: ['Join Our List', 'Get Style Tips'],
    'learn-more': ['View Services', 'Meet the Stylists', 'See Our Work'],
  },
  doctors: {
    contact: ['Schedule a Visit', 'Request an Appointment', 'Call the Clinic'],
    purchase: ['Book a Consultation', 'Start Your Care Plan', 'Schedule a Checkup'],
    signup: ['Become a Patient', 'Get Health Updates'],
    'learn-more': ['View Medical Services', 'Meet Our Providers', 'See Accepted Insurance'],
  },
  accountants: {
    contact: ['Schedule a Consultation', 'Talk to a CPA', 'Contact Us'],
    purchase: ['Get Tax Help', 'Request a Proposal', 'Start Your Filing'],
    signup: ['Get Tax Tips', 'Join Our Client List'],
    'learn-more': ['View Accounting Services', 'See Pricing', 'Meet the Team'],
  },
  realtors: {
    contact: ['Schedule a Showing', 'Contact an Agent', 'Get in Touch'],
    purchase: ['View Listings', 'Get a Home Valuation', 'Start Your Search'],
    signup: ['Get Listing Alerts', 'Join Our Newsletter'],
    'learn-more': ['Explore Neighborhoods', 'See Market Insights', 'Read Buying Tips'],
  },
  'auto-repair': {
    contact: ['Book Service', 'Call the Shop', 'Schedule a Repair'],
    purchase: ['Get a Free Estimate', 'Start Diagnostics', 'Book an Oil Change'],
    signup: ['Get Service Reminders', 'Join Our Maintenance Plan'],
    'learn-more': ['View Auto Repair Services', 'See Certifications', 'Learn About Warranties'],
  },
  fitness: {
    contact: ['Book a Tour', 'Talk to a Trainer', 'Contact Us'],
    purchase: ['Join Now', 'Start Free Trial', 'Buy a Class Pack'],
    signup: ['Create an Account', 'Get Class Updates'],
    'learn-more': ['View Class Schedule', 'Meet the Coaches', 'See Membership Options'],
  },
  cleaning: {
    contact: ['Book a Cleaning', 'Request a Quote', 'Call Today'],
    purchase: ['Schedule Service', 'Get a Free Estimate', 'Start a Recurring Plan'],
    signup: ['Join a Recurring Plan', 'Get Cleaning Tips'],
    'learn-more': ['View Cleaning Services', 'See Pricing', 'Learn About Supplies'],
  },
  landscaping: {
    contact: ['Schedule an Estimate', 'Request a Quote', 'Call Today'],
    purchase: ['Start Your Project', 'Book Seasonal Service', 'Get a Free Estimate'],
    signup: ['Get Seasonal Reminders', 'Join Our Lawn Tips List'],
    'learn-more': ['View Landscaping Services', 'See Our Work', 'Explore Seasonal Packages'],
  },
  photography: {
    contact: ['Book a Session', 'Inquire Now', 'Contact the Studio'],
    purchase: ['View Packages', 'Reserve Your Date', 'Get Pricing'],
    signup: ['Join the Waitlist', 'Get Session Updates'],
    'learn-more': ['View Portfolio', 'See Packages', 'Explore the Experience'],
  },
  other: {
    contact: ['Contact Us', 'Talk to Us', 'Schedule a Call'],
    purchase: ['Get Started', 'Request a Quote', 'Book Now'],
    signup: ['Sign Up', 'Join Now', 'Get Updates'],
    'learn-more': ['Learn More', 'View Services', 'See Details'],
  },
} as const;

const VIBE_ALIASES: Record<string, CTAVibeId> = {
  professional: 'executive',
  corporate: 'executive',
  refined: 'elegant',
  luxury: 'elegant',
  luxurious: 'elegant',
  minimal: 'minimal',
  minimalist: 'minimal',
  clean: 'minimal',
  simple: 'minimal',
  playful: 'playful',
  fun: 'playful',
  friendly: 'friendly',
  warm: 'friendly',
  bold: 'bold',
  strong: 'bold',
  urgent: 'bold',
  creative: 'creative',
  artistic: 'creative',
  edgy: 'maverick',
  disruptive: 'maverick',
  trustworthy: 'trustworthy',
  trusted: 'trustworthy',
  reliable: 'trustworthy',
};

const INDUSTRY_ALIASES: Record<string, IndustryType> = {
  plumber: 'plumbers',
  plumbing: 'plumbers',
  attorney: 'lawyers',
  legal: 'lawyers',
  law: 'lawyers',
  restaurant: 'restaurants',
  diner: 'restaurants',
  cafe: 'restaurants',
  dentist: 'dentists',
  dental: 'dentists',
  contractor: 'contractors',
  construction: 'contractors',
  builder: 'contractors',
  heating: 'hvac',
  cooling: 'hvac',
  ac: 'hvac',
  salon: 'salons',
  spa: 'salons',
  hair: 'salons',
  doctor: 'doctors',
  medical: 'doctors',
  clinic: 'doctors',
  accountant: 'accountants',
  accounting: 'accountants',
  cpa: 'accountants',
  realtor: 'realtors',
  'real-estate': 'realtors',
  'real-estate-agent': 'realtors',
  auto: 'auto-repair',
  'auto-repair': 'auto-repair',
  'car-repair': 'auto-repair',
  mechanic: 'auto-repair',
  fitness: 'fitness',
  gym: 'fitness',
  cleaning: 'cleaning',
  cleaner: 'cleaning',
  janitorial: 'cleaning',
  landscaping: 'landscaping',
  landscaper: 'landscaping',
  'lawn-care': 'landscaping',
  photography: 'photography',
  photographer: 'photography',
};

const INDUSTRY_KEYS = new Set<IndustryType>(INDUSTRIES);
const VIBE_KEYS = new Set<CTAVibeId>(Object.keys(VIBE_CTA_SETS) as CTAVibeId[]);

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolveIndustry(industry?: IndustryType | string): IndustryType {
  if (!industry) {
    return 'other';
  }

  const normalized = normalizeKey(String(industry));
  if (INDUSTRY_KEYS.has(normalized as IndustryType)) {
    return normalized as IndustryType;
  }

  return INDUSTRY_ALIASES[normalized] || 'other';
}

function resolveVibe(vibe?: string): CTAVibeId | undefined {
  if (!vibe) {
    return undefined;
  }

  const normalized = normalizeKey(String(vibe));
  if (VIBE_KEYS.has(normalized as CTAVibeId)) {
    return normalized as CTAVibeId;
  }

  return VIBE_ALIASES[normalized];
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

function mergeLists(...lists: Array<string[] | undefined>): string[] {
  const merged: string[] = [];

  for (const list of lists) {
    if (list && list.length) {
      merged.push(...list);
    }
  }

  return dedupe(merged);
}

function buildCTASet(industry?: IndustryType | string, vibe?: string): CTASet {
  const industryKey = resolveIndustry(industry);
  const vibeKey = resolveVibe(vibe);
  const industrySet = INDUSTRY_CTA_SETS[industryKey] ?? EMPTY_CTA_SET;
  const vibeSet = vibeKey ? (VIBE_CTA_SETS[vibeKey] ?? EMPTY_CTA_SET) : EMPTY_CTA_SET;

  return {
    contact: mergeLists(industrySet.contact, vibeSet.contact, DEFAULT_CTA_SET.contact),
    purchase: mergeLists(industrySet.purchase, vibeSet.purchase, DEFAULT_CTA_SET.purchase),
    signup: mergeLists(industrySet.signup, vibeSet.signup, DEFAULT_CTA_SET.signup),
    'learn-more': mergeLists(industrySet['learn-more'], vibeSet['learn-more'], DEFAULT_CTA_SET['learn-more']),
  };
}

function flattenCTASet(ctaSet: CTASet): string[] {
  const all: string[] = [];
  for (const context of CTA_CONTEXTS) {
    all.push(...ctaSet[context]);
  }
  return dedupe(all);
}

/**
 * Get a full CTA set for an industry, optionally influenced by vibe.
 */
export function getCTASet(industry?: IndustryType | string, vibe?: string): CTASet {
  return buildCTASet(industry, vibe);
}

/**
 * Get CTAs for a specific context with optional industry/vibe hints.
 */
export function getCTAs(query: CTAQuery): string[] {
  const ctaSet = buildCTASet(query.industry, query.vibe);
  if (query.context && CTA_CONTEXTS.includes(query.context)) {
    return [...ctaSet[query.context]];
  }
  return flattenCTASet(ctaSet);
}

/**
 * Get a single CTA for a context, returning the first available option.
 */
export function getPrimaryCTA(query: CTAQuery): string {
  const ctas = getCTAs(query);
  return ctas[0] || '';
}

/**
 * Pick a random CTA for a context.
 */
export function getRandomCTA(query: CTAQuery): string {
  const ctas = getCTAs(query);
  if (!ctas.length) {
    return '';
  }
  return ctas[Math.floor(Math.random() * ctas.length)];
}

/**
 * Pick multiple random CTAs for a context.
 */
export function getRandomCTAs(query: CTAQuery, count = 3): string[] {
  const ctas = getCTAs(query);
  if (ctas.length <= count) {
    return [...ctas];
  }

  const pool = [...ctas];
  const selections: string[] = [];

  while (selections.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    selections.push(pool.splice(index, 1)[0]);
  }

  return selections;
}
