import {
  IndustryType,
  INDUSTRIES,
  detectIndustryFromKeywords,
  getIndustryTemplate,
} from '../ai/industry-templates';

export interface VibeCopyContext {
  businessName?: string;
  location?: string;
  audience?: string;
  primaryService?: string;
  services?: string[];
  differentiators?: string[];
  benefits?: string[];
  trustSignals?: string[];
  painPoints?: string[];
  offer?: string;
  urgency?: string;
}

export interface VibeCopyOptions {
  headlineCount?: number;
  taglineCount?: number;
  bodyCount?: number;
  ctaCount?: number;
}

export interface VibeCopyAlternatives {
  headlines: string[];
  taglines: string[];
  bodies: string[];
  ctas: string[];
}

export interface VibeCopyResult {
  industry: IndustryType;
  vibe: VibeCopyId;
  headline: string;
  tagline: string;
  body: string;
  cta: string;
  alternatives: VibeCopyAlternatives;
}

export interface VibeCopyRequest {
  industry: IndustryType | string;
  vibe?: string;
  context?: VibeCopyContext;
  options?: VibeCopyOptions;
}

export interface VibeCopyProfile {
  name: string;
  headlineTemplates: string[];
  taglineTemplates: string[];
  bodyTemplates: string[];
  ctaTemplates: string[];
}

const VIBE_COPY_PROFILES = {
  bold: {
    name: 'Bold',
    headlineTemplates: [
      '{{primaryService}} that hits fast.',
      'Bold {{industryNounLower}}. Real results.',
      '{{businessName}} built to deliver.',
    ],
    taglineTemplates: [
      'No fluff. Just {{differentiatorLower}}.',
      'Move fast. Get it done.',
      '{{trustSignal}} when it counts.',
    ],
    bodyTemplates: [
      'Need {{primaryServiceLower}} fast? {{urgencySentence}} {{businessName}} brings {{differentiatorLower}} and a team that moves. {{offerSentence}}',
      'We help {{audience}} in {{location}} with {{serviceList}} that hold up under pressure. {{trustSentence}}',
      '{{businessName}} delivers {{primaryServiceLower}} without delays or excuses. Clear updates. Solid results.',
    ],
    ctaTemplates: ['Book now', 'Get started', 'Call today', 'Schedule service'],
  },
  minimal: {
    name: 'Minimal',
    headlineTemplates: [
      '{{primaryService}} made simple.',
      'Clear {{industryNounLower}}.',
      '{{businessName}} for {{audience}}.',
    ],
    taglineTemplates: [
      'Quietly excellent.',
      'Straightforward service.',
      'Simple process. Real outcomes.',
    ],
    bodyTemplates: [
      '{{businessName}} provides {{serviceList}} for {{audience}} in {{location}}. Clear timelines, clear pricing, no surprises.',
      'Everything you need for {{primaryServiceLower}}, nothing you do not. {{trustSentence}} {{benefitSentence}}',
      'Focused {{industryNounLower}} with a modern, reliable approach. {{differentiatorSentence}}',
    ],
    ctaTemplates: ['Get started', 'Contact us', 'View services', 'Request details'],
  },
  playful: {
    name: 'Playful',
    headlineTemplates: [
      'Good {{industryNounLower}} starts here.',
      '{{primaryService}} with a smile.',
      'Make {{primaryServiceLower}} feel easy.',
    ],
    taglineTemplates: [
      'Friendly faces. Real results.',
      '{{audience}} love working with us.',
      'Let us make this easy.',
    ],
    bodyTemplates: [
      '{{businessName}} helps {{audience}} in {{location}} with {{serviceList}} that feel effortless. {{differentiatorSentence}}',
      'From first hello to final check, we keep it simple and upbeat. {{trustSentence}}',
      'You bring the goal. We bring the know-how for {{primaryServiceLower}}. {{benefitSentence}} {{offerSentence}}',
    ],
    ctaTemplates: ['Say hello', 'Let us chat', 'Get started', 'Book a spot'],
  },
  creative: {
    name: 'Creative',
    headlineTemplates: [
      '{{industryNoun}} with character.',
      'Designed for bold {{audience}}.',
      '{{businessName}} brings {{primaryServiceLower}} to life.',
    ],
    taglineTemplates: [
      'Distinctive by design.',
      'Make it memorable.',
      'Crafted for impact.',
    ],
    bodyTemplates: [
      '{{businessName}} pairs craft and clarity for {{primaryServiceLower}} that stands out. {{differentiatorSentence}} {{benefitSentence}}',
      'We help {{audience}} in {{location}} with {{serviceList}} that feel unique and effortless.',
      'A fresh take on {{industryNounLower}} with details you can feel. {{offerSentence}}',
    ],
    ctaTemplates: ['See the work', 'Start a project', 'Explore options', 'Get a quote'],
  },
  executive: {
    name: 'Executive',
    headlineTemplates: [
      '{{industryNoun}} you can trust.',
      'Strategic {{primaryServiceLower}} for serious outcomes.',
      '{{businessName}}. Clear. Capable.',
    ],
    taglineTemplates: [
      'Professional, reliable, accountable.',
      'Built for decision-makers.',
      'Results with clarity.',
    ],
    bodyTemplates: [
      '{{businessName}} supports {{audience}} in {{location}} with {{serviceList}} delivered on time and on budget. {{trustSentence}}',
      'A disciplined approach to {{primaryServiceLower}} with clear communication at every step. {{differentiatorSentence}} {{benefitSentence}}',
      'We help teams reduce risk and move forward with confidence. {{offerSentence}}',
    ],
    ctaTemplates: ['Schedule a consultation', 'Request a quote', 'Talk to an expert', 'Contact us'],
  },
  elegant: {
    name: 'Elegant',
    headlineTemplates: [
      'Refined {{industryNounLower}} for modern {{audience}}.',
      'Elevated {{primaryServiceLower}}.',
      '{{businessName}} with a refined touch.',
    ],
    taglineTemplates: [
      'Thoughtful service. Beautifully delivered.',
      'Grace in every detail.',
      'A calmer, better experience.',
    ],
    bodyTemplates: [
      '{{businessName}} offers {{serviceList}} for {{audience}} in {{location}} with a calm, curated experience. {{differentiatorSentence}}',
      'Where craft meets care, and {{primaryServiceLower}} feels effortless. {{trustSentence}} {{benefitSentence}}',
      'A polished approach to {{industryNounLower}} with details that matter. {{offerSentence}}',
    ],
    ctaTemplates: ['Discover more', 'Schedule a visit', 'Begin your experience', 'Request details'],
  },
  trustworthy: {
    name: 'Trustworthy',
    headlineTemplates: [
      '{{industryNoun}} done right.',
      'Trusted {{primaryServiceLower}} in {{location}}.',
      '{{businessName}} you can rely on.',
    ],
    taglineTemplates: [
      'Proven, dependable, local.',
      'Straight answers. Solid work.',
      'Trusted by {{audience}}.',
    ],
    bodyTemplates: [
      '{{businessName}} delivers {{serviceList}} for {{audience}} in {{location}} with honest guidance and consistent results. {{trustSentence}} {{benefitSentence}}',
      'From first call to final check, you get clear communication and reliable work. {{differentiatorSentence}}',
      'We show up, do it right, and stand behind it. {{offerSentence}}',
    ],
    ctaTemplates: ['Get a quote', 'Call today', 'Schedule service', 'Contact us'],
  },
  maverick: {
    name: 'Maverick',
    headlineTemplates: [
      '{{industryNoun}} without the beige.',
      'Break the mold with {{primaryServiceLower}}.',
      '{{businessName}} does it differently.',
    ],
    taglineTemplates: [
      'Make a statement.',
      'Not your average {{industryNounLower}}.',
      'Built to stand out.',
    ],
    bodyTemplates: [
      '{{businessName}} flips the script on {{industryNounLower}} with bold ideas and fast execution. {{differentiatorSentence}}',
      'For {{audience}} in {{location}} who want more than the usual. {{serviceList}} with edge and clarity. {{painPointSentence}}',
      'Sharper, faster, more memorable. {{offerSentence}}',
    ],
    ctaTemplates: ['Make the switch', 'Start something new', 'Talk to us', 'Get started'],
  },
  friendly: {
    name: 'Friendly',
    headlineTemplates: [
      '{{industryNoun}} with heart.',
      '{{businessName}} is here to help.',
      'Care you can count on.',
    ],
    taglineTemplates: [
      'Warm service, real results.',
      'Friendly, local, dependable.',
      'Good people, great work.',
    ],
    bodyTemplates: [
      '{{businessName}} helps {{audience}} in {{location}} with {{serviceList}} and a friendly, no-pressure approach. {{trustSentence}}',
      'We take the time to explain options and make {{primaryServiceLower}} easy to understand. {{differentiatorSentence}} {{benefitSentence}}',
      'If you have questions, we are here. {{offerSentence}}',
    ],
    ctaTemplates: ['Let us chat', 'Book a visit', 'Get help', 'Contact us'],
  },
} as const satisfies Record<string, VibeCopyProfile>;

export type VibeCopyId = keyof typeof VIBE_COPY_PROFILES;

const VIBE_ALIASES: Record<string, VibeCopyId> = {
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
  lawyer: 'lawyers',
  legal: 'lawyers',
  restaurant: 'restaurants',
  dentist: 'dentists',
  contractor: 'contractors',
  builder: 'contractors',
  'general-contractor': 'contractors',
  'auto repair': 'auto-repair',
  mechanic: 'auto-repair',
  realtor: 'realtors',
  'real estate': 'realtors',
  salon: 'salons',
  doctor: 'doctors',
  medical: 'doctors',
  accounting: 'accountants',
  fitness: 'fitness',
  gym: 'fitness',
  cleaning: 'cleaning',
  landscape: 'landscaping',
  landscaping: 'landscaping',
  photo: 'photography',
  photographer: 'photography',
};

const INDUSTRY_AUDIENCE: Record<IndustryType, string> = {
  plumbers: 'homeowners',
  lawyers: 'clients',
  restaurants: 'diners',
  dentists: 'patients',
  contractors: 'homeowners',
  hvac: 'homeowners',
  salons: 'clients',
  doctors: 'patients',
  accountants: 'business owners',
  realtors: 'buyers and sellers',
  'auto-repair': 'drivers',
  fitness: 'members',
  cleaning: 'homeowners',
  landscaping: 'property owners',
  photography: 'clients',
  other: 'customers',
};

const INDUSTRY_NOUNS: Record<IndustryType, string> = {
  plumbers: 'plumbing',
  lawyers: 'legal',
  restaurants: 'restaurant',
  dentists: 'dental care',
  contractors: 'construction',
  hvac: 'heating and cooling',
  salons: 'beauty',
  doctors: 'medical care',
  accountants: 'accounting',
  realtors: 'real estate',
  'auto-repair': 'auto repair',
  fitness: 'fitness',
  cleaning: 'cleaning',
  landscaping: 'landscaping',
  photography: 'photography',
  other: 'business',
};

const INDUSTRY_DEFAULT_VIBES: Record<IndustryType, VibeCopyId> = {
  plumbers: 'trustworthy',
  lawyers: 'executive',
  restaurants: 'playful',
  dentists: 'friendly',
  contractors: 'bold',
  hvac: 'trustworthy',
  salons: 'playful',
  doctors: 'trustworthy',
  accountants: 'executive',
  realtors: 'elegant',
  'auto-repair': 'bold',
  fitness: 'bold',
  cleaning: 'trustworthy',
  landscaping: 'trustworthy',
  photography: 'creative',
  other: 'trustworthy',
};

const DEFAULT_COPY_OPTIONS: Required<VibeCopyOptions> = {
  headlineCount: 3,
  taglineCount: 3,
  bodyCount: 3,
  ctaCount: 3,
};

export function generateVibeCopy(request: VibeCopyRequest): VibeCopyResult {
  const industry = normalizeIndustry(request.industry);
  const vibeId = normalizeVibeId(request.vibe, industry);
  const profile = VIBE_COPY_PROFILES[vibeId];
  const template = getIndustryTemplate(industry);
  const tokens = buildTokens(industry, template, request.context);
  const options = { ...DEFAULT_COPY_OPTIONS, ...(request.options || {}) };

  const headlines = buildVariants(profile.headlineTemplates, tokens, options.headlineCount);
  const taglines = buildVariants(profile.taglineTemplates, tokens, options.taglineCount);
  const bodies = buildVariants(profile.bodyTemplates, tokens, options.bodyCount);
  const ctas = buildVariants(profile.ctaTemplates, tokens, options.ctaCount);

  return {
    industry,
    vibe: vibeId,
    headline: headlines[0] || '',
    tagline: taglines[0] || '',
    body: bodies[0] || '',
    cta: ctas[0] || '',
    alternatives: {
      headlines,
      taglines,
      bodies,
      ctas,
    },
  };
}

export function getVibeCopyProfile(vibe: string, industry?: IndustryType | string): VibeCopyProfile {
  const resolvedIndustry = industry ? normalizeIndustry(industry) : 'other';
  const vibeId = normalizeVibeId(vibe, resolvedIndustry);
  return VIBE_COPY_PROFILES[vibeId];
}

function normalizeIndustry(industry: IndustryType | string): IndustryType {
  const raw = String(industry || '').trim().toLowerCase();
  if (!raw) return 'other';
  if ((INDUSTRIES as readonly string[]).includes(raw)) {
    return raw as IndustryType;
  }
  if (raw in INDUSTRY_ALIASES) {
    return INDUSTRY_ALIASES[raw];
  }
  const detected = detectIndustryFromKeywords(raw);
  return detected || 'other';
}

function normalizeVibeId(vibe: string | undefined, industry: IndustryType): VibeCopyId {
  if (vibe) {
    const key = vibe.trim().toLowerCase();
    if (key in VIBE_COPY_PROFILES) return key as VibeCopyId;
    if (key in VIBE_ALIASES) return VIBE_ALIASES[key];
  }
  return INDUSTRY_DEFAULT_VIBES[industry] || 'trustworthy';
}

function buildTokens(
  industry: IndustryType,
  template: ReturnType<typeof getIndustryTemplate>,
  context?: VibeCopyContext
): Record<string, string> {
  const businessName = cleanToken(context?.businessName) || template.displayName;
  const audience = cleanToken(context?.audience) || INDUSTRY_AUDIENCE[industry];
  const location = cleanToken(context?.location) || 'your area';
  const industryNoun = cleanToken(INDUSTRY_NOUNS[industry] || template.displayName);
  const primaryService = cleanToken(
    context?.primaryService ||
    context?.services?.[0] ||
    template.commonServices[0] ||
    industryNoun
  );
  const services = context?.services && context.services.length > 0
    ? context.services
    : template.commonServices;
  const serviceList = formatList(services, 2) || primaryService;
  const differentiator = cleanToken(
    context?.differentiators?.[0] ||
    context?.trustSignals?.[0] ||
    template.trustSignals[0] ||
    'experienced guidance'
  );
  const trustSignal = cleanToken(context?.trustSignals?.[0] || template.trustSignals[0] || 'trusted locally');
  const offer = cleanToken(context?.offer);
  const benefit = cleanToken(context?.benefits?.[0]);
  const painPoint = cleanToken(context?.painPoints?.[0]);
  const urgency = cleanToken(context?.urgency);

  const differentiatorSentence = ensureSentence(differentiator);
  const trustSentence = ensureSentence(trustSignal);
  const offerSentence = offer ? ensureSentence(offer) : '';
  const benefitSentence = benefit ? ensureSentence(benefit) : '';
  const painPointSentence = painPoint ? ensureSentence(painPoint) : '';
  const urgencySentence = urgency ? ensureSentence(urgency) : '';

  return {
    businessName,
    industryNoun,
    industryNounLower: industryNoun.toLowerCase(),
    primaryService,
    primaryServiceLower: primaryService.toLowerCase(),
    audience,
    location,
    serviceList,
    differentiator,
    differentiatorLower: differentiator.toLowerCase(),
    differentiatorSentence,
    trustSignal,
    trustSentence,
    offer,
    offerSentence,
    benefitSentence,
    painPointSentence,
    urgencySentence,
  };
}

function buildVariants(templates: string[], tokens: Record<string, string>, count: number): string[] {
  const filled = templates.map((template) => fillTemplate(template, tokens))
    .map(cleanCopy)
    .filter(Boolean);
  const unique = Array.from(new Set(filled));
  return unique.slice(0, Math.max(count, 1));
}

function fillTemplate(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] || '');
}

function cleanCopy(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s([?.!,])/g, '$1')
    .trim();
}

function cleanToken(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/[.!?]+$/, '');
}

function ensureSentence(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function formatList(items: string[], maxItems: number): string {
  const filtered = items.map(item => item.trim()).filter(Boolean);
  if (filtered.length === 0) return '';
  const slice = filtered.slice(0, maxItems);
  if (slice.length === 1) return slice[0];
  if (slice.length === 2) return `${slice[0]} and ${slice[1]}`;
  return `${slice[0]}, ${slice[1]}, and ${slice[2]}`;
}
