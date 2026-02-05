import { IndustryType } from '../ai/industry-templates';

export type IconLibrary = 'lucide' | 'heroicons-outline' | 'heroicons-solid';

export interface IconRef {
  library: IconLibrary;
  name: string;
}

export const ICON_CONTEXTS = ['hero', 'services', 'features', 'stats', 'cta', 'trust'] as const;
export type IconContext = typeof ICON_CONTEXTS[number];

export type IndustryIconSet = Record<IconContext, IconRef[]>;
export type IndustryIconMap = Record<IndustryType, IndustryIconSet>;

const lucide = (name: string): IconRef => ({ library: 'lucide', name });
const heroOutline = (name: string): IconRef => ({ library: 'heroicons-outline', name });
const heroSolid = (name: string): IconRef => ({ library: 'heroicons-solid', name });

const COMMON_STATS: IconRef[] = [
  heroOutline('ArrowTrendingUpIcon'),
  heroOutline('UsersIcon'),
  heroOutline('StarIcon'),
];

const COMMON_CTA: IconRef[] = [
  heroSolid('PhoneIcon'),
  heroSolid('CalendarDaysIcon'),
];

const COMMON_TRUST: IconRef[] = [
  heroSolid('CheckBadgeIcon'),
  lucide('ShieldCheck'),
  lucide('BadgeCheck'),
];

const DEFAULT_ICON_SET: IndustryIconSet = {
  hero: [
    lucide('Star'),
    lucide('Sparkles'),
    heroOutline('BriefcaseIcon'),
  ],
  services: [
    lucide('Star'),
    lucide('Briefcase'),
    lucide('Settings'),
    lucide('ShieldCheck'),
    lucide('Users'),
  ],
  features: [
    heroOutline('ShieldCheckIcon'),
    heroOutline('ClockIcon'),
    heroOutline('MapPinIcon'),
  ],
  stats: [...COMMON_STATS],
  cta: [...COMMON_CTA],
  trust: [...COMMON_TRUST],
};

export const INDUSTRY_ICON_SETS: IndustryIconMap = {
  plumbers: {
    hero: [
      lucide('Wrench'),
      heroOutline('WrenchScrewdriverIcon'),
      lucide('Droplet'),
    ],
    services: [
      lucide('Droplet'),
      lucide('Wrench'),
      lucide('Flame'),
      lucide('AlertTriangle'),
      lucide('Thermometer'),
    ],
    features: [
      heroOutline('ClockIcon'),
      heroOutline('MapPinIcon'),
      lucide('ShieldCheck'),
      lucide('PhoneCall'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  lawyers: {
    hero: [
      lucide('Scale'),
      heroOutline('ScaleIcon'),
      lucide('Gavel'),
    ],
    services: [
      lucide('Scale'),
      lucide('Gavel'),
      lucide('FileText'),
      lucide('Briefcase'),
      lucide('Landmark'),
    ],
    features: [
      lucide('ShieldCheck'),
      lucide('UserCheck'),
      heroOutline('ClockIcon'),
      heroOutline('ChatBubbleLeftRightIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      lucide('Award'),
      lucide('ShieldCheck'),
    ],
  },
  restaurants: {
    hero: [
      lucide('Utensils'),
      lucide('ChefHat'),
      heroOutline('BuildingStorefrontIcon'),
    ],
    services: [
      lucide('Utensils'),
      lucide('ChefHat'),
      lucide('Coffee'),
      lucide('Wine'),
      heroOutline('TruckIcon'),
    ],
    features: [
      heroOutline('MapPinIcon'),
      heroOutline('ClockIcon'),
      heroOutline('TruckIcon'),
      lucide('Smartphone'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      heroSolid('StarIcon'),
      lucide('Award'),
    ],
  },
  dentists: {
    hero: [
      lucide('Tooth'),
      lucide('Sparkles'),
      heroOutline('SparklesIcon'),
    ],
    services: [
      lucide('Tooth'),
      lucide('Sparkles'),
      lucide('Smile'),
      lucide('Syringe'),
      lucide('ShieldCheck'),
    ],
    features: [
      heroOutline('CalendarDaysIcon'),
      heroOutline('ShieldCheckIcon'),
      lucide('HeartPulse'),
      lucide('ClipboardCheck'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      lucide('BadgeCheck'),
      lucide('ShieldCheck'),
    ],
  },
  contractors: {
    hero: [
      lucide('Hammer'),
      lucide('HardHat'),
      heroOutline('HomeIcon'),
    ],
    services: [
      lucide('Hammer'),
      lucide('Wrench'),
      lucide('Ruler'),
      lucide('Paintbrush'),
      lucide('Home'),
    ],
    features: [
      heroOutline('ClipboardDocumentCheckIcon'),
      heroOutline('ClockIcon'),
      lucide('ShieldCheck'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      lucide('ShieldCheck'),
      lucide('Award'),
    ],
  },
  hvac: {
    hero: [
      lucide('Thermometer'),
      lucide('Snowflake'),
      lucide('Flame'),
    ],
    services: [
      lucide('Thermometer'),
      lucide('Snowflake'),
      lucide('Flame'),
      lucide('Wind'),
      lucide('Wrench'),
    ],
    features: [
      heroOutline('ClockIcon'),
      heroOutline('ShieldCheckIcon'),
      lucide('Leaf'),
      lucide('Gauge'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  salons: {
    hero: [
      lucide('Scissors'),
      lucide('Sparkles'),
      heroOutline('SparklesIcon'),
    ],
    services: [
      lucide('Scissors'),
      lucide('Sparkles'),
      lucide('Paintbrush'),
      lucide('Droplet'),
      lucide('Smile'),
    ],
    features: [
      heroOutline('CalendarDaysIcon'),
      heroOutline('HeartIcon'),
      heroOutline('SparklesIcon'),
      lucide('Users'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      lucide('BadgeCheck'),
      lucide('ShieldCheck'),
    ],
  },
  doctors: {
    hero: [
      lucide('Stethoscope'),
      lucide('HeartPulse'),
      heroOutline('HeartIcon'),
    ],
    services: [
      lucide('Stethoscope'),
      lucide('HeartPulse'),
      lucide('Pill'),
      lucide('Syringe'),
      lucide('Clipboard'),
    ],
    features: [
      heroOutline('ShieldCheckIcon'),
      heroOutline('ClockIcon'),
      heroOutline('MapPinIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [
      heroSolid('CheckBadgeIcon'),
      lucide('BadgeCheck'),
      lucide('ShieldCheck'),
    ],
  },
  accountants: {
    hero: [
      lucide('Calculator'),
      lucide('Receipt'),
      heroOutline('BanknotesIcon'),
    ],
    services: [
      lucide('Calculator'),
      lucide('Receipt'),
      lucide('FileText'),
      lucide('PieChart'),
      heroOutline('PresentationChartLineIcon'),
    ],
    features: [
      heroOutline('ClipboardDocumentCheckIcon'),
      heroOutline('ShieldCheckIcon'),
      lucide('Briefcase'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  realtors: {
    hero: [
      lucide('Home'),
      heroOutline('HomeModernIcon'),
      heroOutline('KeyIcon'),
    ],
    services: [
      lucide('Home'),
      heroOutline('KeyIcon'),
      heroOutline('MapPinIcon'),
      lucide('Building'),
      heroOutline('PresentationChartLineIcon'),
    ],
    features: [
      heroOutline('ClipboardDocumentCheckIcon'),
      heroOutline('CameraIcon'),
      heroOutline('MapPinIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  'auto-repair': {
    hero: [
      lucide('Car'),
      lucide('Wrench'),
      heroOutline('Cog6ToothIcon'),
    ],
    services: [
      lucide('Car'),
      lucide('Wrench'),
      lucide('Gauge'),
      lucide('BatteryCharging'),
      lucide('Settings'),
    ],
    features: [
      heroOutline('ClockIcon'),
      heroOutline('ShieldCheckIcon'),
      heroOutline('MapPinIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  fitness: {
    hero: [
      lucide('Dumbbell'),
      lucide('Activity'),
      heroOutline('HeartIcon'),
    ],
    services: [
      lucide('Dumbbell'),
      lucide('Activity'),
      lucide('HeartPulse'),
      lucide('Timer'),
      lucide('Flame'),
    ],
    features: [
      heroOutline('UsersIcon'),
      heroOutline('CalendarDaysIcon'),
      lucide('Trophy'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  cleaning: {
    hero: [
      lucide('Sparkles'),
      lucide('SprayCan'),
      heroOutline('ShieldCheckIcon'),
    ],
    services: [
      lucide('Sparkles'),
      lucide('SprayCan'),
      lucide('Droplet'),
      lucide('Wind'),
      lucide('ShieldCheck'),
    ],
    features: [
      heroOutline('ClockIcon'),
      heroOutline('ShieldCheckIcon'),
      heroOutline('LeafIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  landscaping: {
    hero: [
      lucide('Leaf'),
      lucide('TreePine'),
      heroOutline('SunIcon'),
    ],
    services: [
      lucide('Leaf'),
      lucide('TreePine'),
      lucide('Flower2'),
      lucide('Droplet'),
      lucide('Sun'),
    ],
    features: [
      heroOutline('SunIcon'),
      heroOutline('LeafIcon'),
      heroOutline('MapPinIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  photography: {
    hero: [
      lucide('Camera'),
      lucide('Aperture'),
      heroOutline('CameraIcon'),
    ],
    services: [
      lucide('Camera'),
      lucide('Aperture'),
      lucide('Image'),
      lucide('Film'),
      lucide('Sparkles'),
    ],
    features: [
      heroOutline('CalendarDaysIcon'),
      heroOutline('MapPinIcon'),
      heroOutline('UsersIcon'),
    ],
    stats: [...COMMON_STATS],
    cta: [...COMMON_CTA],
    trust: [...COMMON_TRUST],
  },
  other: DEFAULT_ICON_SET,
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

const INDUSTRY_KEYS = new Set<IndustryType>(Object.keys(INDUSTRY_ICON_SETS) as IndustryType[]);

function normalizeIndustryKey(industry: string): string {
  return industry
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolveIndustry(industry: IndustryType | string): IndustryType {
  if (!industry) {
    return 'other';
  }

  const normalized = normalizeIndustryKey(String(industry));
  if (INDUSTRY_KEYS.has(normalized as IndustryType)) {
    return normalized as IndustryType;
  }

  return INDUSTRY_ALIASES[normalized] || 'other';
}

function cloneIconSet(iconSet: IndustryIconSet): IndustryIconSet {
  return {
    hero: [...iconSet.hero],
    services: [...iconSet.services],
    features: [...iconSet.features],
    stats: [...iconSet.stats],
    cta: [...iconSet.cta],
    trust: [...iconSet.trust],
  };
}

/**
 * Get the full icon set for an industry.
 */
export function getIndustryIconSet(industry: IndustryType | string): IndustryIconSet {
  return cloneIconSet(INDUSTRY_ICON_SETS[resolveIndustry(industry)]);
}

/**
 * Get icons for a specific industry and context (hero, services, etc).
 */
export function getIndustryIcons(industry: IndustryType | string, context: IconContext): IconRef[] {
  const iconSet = getIndustryIconSet(industry);
  return iconSet[context];
}

/**
 * Get the primary icon for an industry/context.
 */
export function getPrimaryIndustryIcon(
  industry: IndustryType | string,
  context: IconContext = 'hero'
): IconRef {
  const icons = getIndustryIcons(industry, context);
  return icons[0] || DEFAULT_ICON_SET[context][0];
}

/**
 * Get icon names for an industry/context, optionally filtered by library.
 */
export function getIndustryIconNames(
  industry: IndustryType | string,
  context: IconContext,
  library?: IconLibrary
): string[] {
  const icons = getIndustryIcons(industry, context);
  return icons
    .filter((icon) => !library || icon.library === library)
    .map((icon) => icon.name);
}
