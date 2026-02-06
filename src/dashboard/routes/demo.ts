import { Router, Request, Response } from 'express';
import { Readable } from 'stream';
import {
  VIBES,
  buildWebsite,
  generateConstrainedDNA,
  getTotalVariantCount,
  registerExistingSections,
  type SiteContent,
} from '../../themes/engine';
import { getAllBlueprints, getBlueprintForIndustry } from '../../themes/blueprints';
import { INDUSTRY_CONFIGS } from '../../preview/industry-templates';
import { logger } from '../../utils/logger';

const router = Router();

const INDUSTRY_ALIASES: Record<string, string> = {
  plumbers: 'plumber',
  lawyers: 'lawyer',
  restaurants: 'restaurant',
  dentists: 'dentist',
  contractors: 'contractor',
  realtors: 'realtor',
  accountants: 'accountant',
  photographers: 'photographer',
  gyms: 'gym',
  fitness: 'gym',
  'financial-advisors': 'financial-advisor',
  'financial advisor': 'financial-advisor',
  'med-spa': 'medspa',
  landscaping: 'landscaper',
  'yoga-studio': 'yoga',
  cafes: 'cafe',
  bakeries: 'bakery',
  bars: 'bar',
  studios: 'studio',
  designers: 'designer',
  artists: 'artist',
};

const INDUSTRY_BUSINESS_NAMES: Record<string, string> = {
  plumber: 'Pro Plumbing Co.',
  hvac: 'Climate Control HVAC',
  electrician: 'Spark Electric',
  roofer: 'TopShield Roofing',
  contractor: 'BuildRight Construction',
  lawyer: 'Justice Law Group',
  accountant: 'Precision Accounting',
  'financial-advisor': 'Wealth Partners',
  realtor: 'Premier Realty',
  dentist: 'Smile Dental Care',
  chiropractor: 'Align Chiropractic',
  veterinarian: 'Pawsitive Pet Care',
  therapist: 'Mindful Counseling',
  gym: 'Peak Fitness',
  yoga: 'Serenity Yoga',
  restaurant: 'The Local Kitchen',
  photographer: 'Capture Studios',
};

const INDUSTRY_HEADLINES: Record<string, string> = {
  plumber: 'Expert Plumbing Help When It Matters Most',
  hvac: 'Stay Comfortable With Reliable HVAC Service',
  electrician: 'Safe, Code-Compliant Electrical Work',
  roofer: 'Protect Your Home With Quality Roofing',
  contractor: 'Craftsmanship You Can Count On',
  lawyer: 'Experienced Legal Guidance You Can Trust',
  accountant: 'Smart Financial Management for Growing Businesses',
  'financial-advisor': 'Plan Confidently for the Future',
  realtor: 'Find the Right Home With Local Experts',
  dentist: 'Healthy Smiles, Gentle Care',
  chiropractor: 'Natural Relief and Whole-Body Wellness',
  veterinarian: 'Compassionate Care for Every Pet',
  therapist: 'Supportive Therapy for Life\'s Challenges',
  gym: 'Training Programs That Deliver Results',
  yoga: 'Find Balance, Strength, and Calm',
  restaurant: 'Fresh Flavors Served With Care',
  photographer: 'Photographs That Tell Your Story',
};

const INDUSTRY_SERVICES: Record<string, Array<{ name: string; description: string }>> = {
  plumber: [
    { name: 'Emergency Repairs', description: 'Rapid response for leaks, burst pipes, and urgent plumbing issues.' },
    { name: 'Drain Cleaning', description: 'Clear stubborn clogs and restore smooth flow throughout your home.' },
    { name: 'Water Heaters', description: 'Installations, tune-ups, and replacements for reliable hot water.' },
    { name: 'Pipe Replacement', description: 'Upgrade aging pipes to prevent future damage and improve efficiency.' },
  ],
  hvac: [
    { name: 'AC Installation', description: 'Energy-efficient cooling systems sized to your space.' },
    { name: 'Heating Repair', description: 'Fast fixes to keep your home warm and safe.' },
    { name: 'Maintenance Plans', description: 'Seasonal tune-ups that extend equipment life.' },
    { name: 'Indoor Air Quality', description: 'Filtration and purification for cleaner air.' },
  ],
  electrician: [
    { name: 'Panel Upgrades', description: 'Modernize your electrical panel for safety and capacity.' },
    { name: 'Wiring & Rewiring', description: 'Install or replace wiring to meet current codes.' },
    { name: 'Lighting Solutions', description: 'Indoor, outdoor, and landscape lighting design.' },
    { name: 'Emergency Service', description: 'On-call help when electrical issues can\'t wait.' },
  ],
  roofer: [
    { name: 'Roof Replacement', description: 'Durable materials and expert installation for lasting protection.' },
    { name: 'Roof Repair', description: 'Targeted repairs for leaks, flashing, and storm damage.' },
    { name: 'Storm Restoration', description: 'Assessments and repairs after severe weather.' },
    { name: 'Inspections', description: 'Detailed inspections to catch issues early.' },
  ],
  contractor: [
    { name: 'Home Remodeling', description: 'Kitchen, bath, and whole-home transformations.' },
    { name: 'Additions', description: 'Expand your space with seamless additions.' },
    { name: 'New Construction', description: 'From foundation to finish with experienced crews.' },
    { name: 'Commercial Projects', description: 'Build-outs and renovations for growing businesses.' },
  ],
  lawyer: [
    { name: 'Personal Injury', description: 'Advocacy focused on results and fair compensation.' },
    { name: 'Family Law', description: 'Guidance through sensitive family matters.' },
    { name: 'Criminal Defense', description: 'Strategic defense when the stakes are high.' },
    { name: 'Business Law', description: 'Contracts, disputes, and compliance support.' },
  ],
  accountant: [
    { name: 'Tax Preparation', description: 'Accurate filings and proactive tax planning.' },
    { name: 'Bookkeeping', description: 'Monthly reporting with clear financial insights.' },
    { name: 'Payroll', description: 'Reliable payroll processing and compliance.' },
    { name: 'Advisory', description: 'Strategic guidance to improve profitability.' },
  ],
  'financial-advisor': [
    { name: 'Financial Planning', description: 'Customized plans aligned to your goals.' },
    { name: 'Investment Management', description: 'Diversified portfolios with ongoing oversight.' },
    { name: 'Retirement Strategies', description: 'Confident planning for life after work.' },
    { name: 'Estate Planning', description: 'Protect and transfer wealth thoughtfully.' },
  ],
  realtor: [
    { name: 'Home Buying', description: 'Guidance from search to closing.' },
    { name: 'Home Selling', description: 'Pricing, staging, and marketing expertise.' },
    { name: 'Market Analysis', description: 'Data-driven insights for smart decisions.' },
    { name: 'Investment Properties', description: 'Build your portfolio with confidence.' },
  ],
  dentist: [
    { name: 'Preventive Care', description: 'Cleanings and exams for lifelong oral health.' },
    { name: 'Cosmetic Dentistry', description: 'Whitening, veneers, and smile makeovers.' },
    { name: 'Restorative Dentistry', description: 'Fillings, crowns, and implant solutions.' },
    { name: 'Emergency Dental', description: 'Same-day care for urgent dental needs.' },
  ],
  chiropractor: [
    { name: 'Spinal Adjustments', description: 'Restore alignment and ease daily discomfort.' },
    { name: 'Pain Management', description: 'Relief for back, neck, and joint pain.' },
    { name: 'Sports Recovery', description: 'Targeted care for active lifestyles.' },
    { name: 'Wellness Care', description: 'Ongoing support for long-term health.' },
  ],
  veterinarian: [
    { name: 'Wellness Exams', description: 'Routine checkups and preventative care.' },
    { name: 'Surgical Services', description: 'Safe, compassionate surgical procedures.' },
    { name: 'Dental Care', description: 'Oral health services for pets of all ages.' },
    { name: 'Urgent Care', description: 'Responsive care when your pet needs it most.' },
  ],
  therapist: [
    { name: 'Individual Therapy', description: 'Personalized support for life\'s challenges.' },
    { name: 'Couples Therapy', description: 'Strengthen communication and connection.' },
    { name: 'Anxiety & Stress', description: 'Evidence-based techniques for relief.' },
    { name: 'Family Counseling', description: 'Guidance for healthier family dynamics.' },
  ],
  gym: [
    { name: 'Personal Training', description: 'One-on-one coaching tailored to your goals.' },
    { name: 'Group Classes', description: 'High-energy classes for every fitness level.' },
    { name: 'Strength Programs', description: 'Structured plans for lasting progress.' },
    { name: 'Nutrition Guidance', description: 'Fuel your results with smart habits.' },
  ],
  yoga: [
    { name: 'Vinyasa Flow', description: 'Dynamic movement paired with breath.' },
    { name: 'Restorative Yoga', description: 'Gentle practice for recovery and calm.' },
    { name: 'Hot Yoga', description: 'Invigorating sessions in a heated studio.' },
    { name: 'Meditation', description: 'Guided sessions to build mindfulness.' },
  ],
  restaurant: [
    { name: 'Dine-In', description: 'A welcoming space for every occasion.' },
    { name: 'Takeout', description: 'Quick, flavorful meals on the go.' },
    { name: 'Catering', description: 'Thoughtful menus for events and gatherings.' },
    { name: 'Private Events', description: 'Host celebrations with custom service.' },
  ],
  photographer: [
    { name: 'Weddings', description: 'Timeless coverage for your biggest day.' },
    { name: 'Portraits', description: 'Natural, flattering sessions for every stage.' },
    { name: 'Events', description: 'Professional coverage for corporate and social events.' },
    { name: 'Commercial', description: 'Brand imagery that elevates your business.' },
  ],
};

const CATEGORY_FALLBACKS: Record<string, Array<{ name: string; description: string }>> = {
  'service-business': [
    { name: 'Emergency Support', description: 'Responsive service when every minute counts.' },
    { name: 'Routine Maintenance', description: 'Prevent issues before they start.' },
    { name: 'Repair & Replacement', description: 'Quality work backed by skilled technicians.' },
  ],
  'professional-services': [
    { name: 'Consultations', description: 'Expert guidance tailored to your goals.' },
    { name: 'Strategic Planning', description: 'Clear plans that drive confident decisions.' },
    { name: 'Ongoing Support', description: 'Long-term partnerships you can trust.' },
  ],
  'health-wellness': [
    { name: 'Personalized Care', description: 'Plans designed around your needs.' },
    { name: 'Preventive Services', description: 'Stay ahead of issues with proactive care.' },
    { name: 'Wellness Programs', description: 'Support for long-term health and vitality.' },
  ],
  'creative-visual': [
    { name: 'Creative Direction', description: 'Distinctive concepts that stand out.' },
    { name: 'Production', description: 'Professional execution from start to finish.' },
    { name: 'Brand Storytelling', description: 'Narratives that connect with your audience.' },
  ],
};

const DEFAULT_CONTACT = {
  phone: '(555) 123-4567',
  email: 'hello@autowebsites.demo',
  address: '123 Main Street',
  city: 'Austin',
  state: 'TX',
};

const DEFAULT_HOURS: Record<string, string> = {
  'Mon-Fri': '8:00 AM - 6:00 PM',
  Sat: '9:00 AM - 2:00 PM',
  Sun: 'Closed',
};

const SUPPORTED_INDUSTRIES = new Set([
  ...getAllBlueprints().flatMap(blueprint => blueprint.industries),
  ...Object.keys(INDUSTRY_CONFIGS),
  ...Object.keys(INDUSTRY_SERVICES),
]);

const SUPPORTED_VIBES = new Set(Object.keys(VIBES));

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-');
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

function titleCase(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function ensureSectionsRegistered(): void {
  if (getTotalVariantCount() === 0) {
    registerExistingSections();
  }
}

function getIndustryDisplayName(industry: string): string {
  const config = INDUSTRY_CONFIGS[industry];
  if (config?.display_name) {
    return config.display_name;
  }
  return titleCase(industry);
}

function getIndustryTrustBadges(industry: string): string[] {
  const config = INDUSTRY_CONFIGS[industry];
  if (config?.trust_signals?.length) {
    return config.trust_signals.slice(0, 4);
  }

  const blueprint = getBlueprintForIndustry(industry);
  if (blueprint?.trustSignals?.length) {
    return blueprint.trustSignals.slice(0, 4);
  }

  return ['Licensed & Insured', 'Local Experts', 'Satisfaction Guaranteed', 'Free Estimates'];
}

function getIndustryServices(industry: string): Array<{ name: string; description: string }> {
  if (INDUSTRY_SERVICES[industry]) {
    return INDUSTRY_SERVICES[industry];
  }

  const blueprint = getBlueprintForIndustry(industry);
  if (blueprint?.id && CATEGORY_FALLBACKS[blueprint.id]) {
    return CATEGORY_FALLBACKS[blueprint.id];
  }

  return [
    { name: 'Consultation', description: 'Friendly guidance to help you get started.' },
    { name: 'Professional Service', description: 'Reliable solutions delivered by experts.' },
    { name: 'Ongoing Support', description: 'We stay available after the job is done.' },
  ];
}

function getIndustryStats(industry: string): Array<{ value: string; label: string }> {
  const blueprint = getBlueprintForIndustry(industry);
  if (blueprint?.id === 'service-business') {
    return [
      { value: '24/7', label: 'Emergency Response' },
      { value: '4.9/5', label: 'Customer Rating' },
      { value: '15+ Years', label: 'Local Experience' },
    ];
  }

  if (blueprint?.id === 'professional-services') {
    return [
      { value: '98%', label: 'Client Satisfaction' },
      { value: '10+ Years', label: 'Advisory Experience' },
      { value: '250+', label: 'Successful Engagements' },
    ];
  }

  if (blueprint?.id === 'health-wellness') {
    return [
      { value: '4.8/5', label: 'Patient Reviews' },
      { value: '20+ Years', label: 'Care Experience' },
      { value: 'Same Week', label: 'Appointments' },
    ];
  }

  if (blueprint?.id === 'creative-visual') {
    return [
      { value: '500+', label: 'Projects Delivered' },
      { value: 'Award Winning', label: 'Creative Team' },
      { value: '5/5', label: 'Client Reviews' },
    ];
  }

  return [
    { value: '4.9/5', label: 'Average Rating' },
    { value: '250+', label: 'Projects Completed' },
    { value: 'Fast', label: 'Response Times' },
  ];
}

function getIndustryFaqs(industry: string): Array<{ question: string; answer: string }> {
  const displayName = getIndustryDisplayName(industry).toLowerCase();
  return [
    {
      question: `What ${displayName} services do you offer?`,
      answer: 'We provide tailored solutions based on your needs. Contact us for a detailed scope and transparent pricing.',
    },
    {
      question: 'How quickly can we get started?',
      answer: 'Most projects can begin within a few days. Urgent requests are prioritized when possible.',
    },
    {
      question: 'Do you offer ongoing support?',
      answer: 'Yes. We stand behind our work and remain available for ongoing support or future projects.',
    },
  ];
}

function buildDemoContent(industry: string, vibeId: string): SiteContent {
  const displayName = getIndustryDisplayName(industry);
  const businessName = INDUSTRY_BUSINESS_NAMES[industry] || `${displayName} Co.`;
  const vibe = VIBES[vibeId];
  const headline = INDUSTRY_HEADLINES[industry] || `Trusted ${displayName} Services`;
  const tagline = `Experience ${vibe.name.toLowerCase()} ${displayName.toLowerCase()} solutions from a local team.`;

  return {
    businessName,
    industry,
    headline,
    tagline,
    description: `${businessName} delivers ${displayName.toLowerCase()} services with clear communication and reliable results.`,
    services: getIndustryServices(industry),
    testimonials: [
      {
        text: `"${businessName} was prompt, professional, and delivered exactly what we needed."`,
        author: 'Jordan W.',
        rating: 5,
      },
      {
        text: `"We appreciated the clear updates and the quality of the final work."`,
        author: 'Taylor M.',
        rating: 5,
      },
    ],
    stats: getIndustryStats(industry),
    faqs: getIndustryFaqs(industry),
    contact: { ...DEFAULT_CONTACT },
    hours: { ...DEFAULT_HOURS },
    trustBadges: getIndustryTrustBadges(industry),
  };
}

router.get('/:industry/:vibe', async (req: Request, res: Response) => {
  try {
    const rawIndustry = String(req.params.industry || '');
    const rawVibe = String(req.params.vibe || '');
    const normalizedIndustry = normalizeSlug(rawIndustry);
    const normalizedVibe = normalizeSlug(rawVibe);

    if (!normalizedIndustry || !normalizedVibe || !isValidSlug(normalizedIndustry) || !isValidSlug(normalizedVibe)) {
      return res.status(400).json({
        error: 'Invalid parameters. Expected /demo/:industry/:vibe with URL-safe values.',
      });
    }

    const resolvedIndustry = INDUSTRY_ALIASES[normalizedIndustry] || normalizedIndustry;

    if (!SUPPORTED_INDUSTRIES.has(resolvedIndustry)) {
      return res.status(400).json({
        error: `Invalid industry '${rawIndustry}'.`,
        allowedIndustries: Array.from(SUPPORTED_INDUSTRIES).sort(),
      });
    }

    if (!SUPPORTED_VIBES.has(normalizedVibe)) {
      return res.status(400).json({
        error: `Invalid vibe '${rawVibe}'.`,
        allowedVibes: Array.from(SUPPORTED_VIBES).sort(),
      });
    }

    ensureSectionsRegistered();

    const dna = generateConstrainedDNA(VIBES[normalizedVibe]);
    const content = buildDemoContent(resolvedIndustry, normalizedVibe);
    const html = buildWebsite(content, { dna });

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    Readable.from([html]).pipe(res);
  } catch (error: any) {
    logger.error('Failed to generate demo preview', {
      error: error.message,
      industry: req.params.industry,
      vibe: req.params.vibe,
    });

    res.status(500).json({ error: 'Failed to generate demo preview' });
  }
});

export default router;
