export const INDUSTRIES = [
  'plumbers',
  'lawyers',
  'restaurants',
  'dentists',
  'contractors',
  'hvac',
  'salons',
  'doctors',
  'accountants',
  'realtors',
  'auto-repair',
  'fitness',
  'cleaning',
  'landscaping',
  'photography',
  'other',
] as const;

export type IndustryType = typeof INDUSTRIES[number];

export interface IndustryTemplate {
  industry: IndustryType;
  displayName: string;
  valueProposition: string;
  painPoints: string[];
  keyTalkingPoints: string[];
  commonServices: string[];
  competitorWeaknesses: string[];
  conversionFactors: string[];
  averageProjectValue: { min: number; max: number };
  typicalClientProfile: string;
  seasonality: string;
  urgencyTriggers: string[];
  trustSignals: string[];
  sampleStats: {
    stat: string;
    source: string;
  }[];
}

const industryTemplates: Record<IndustryType, IndustryTemplate> = {
  plumbers: {
    industry: 'plumbers',
    displayName: 'Plumbing Services',
    valueProposition: 'Turn emergency searches into booked jobs with a website that converts panicked homeowners into customers.',
    painPoints: [
      'Losing emergency calls to competitors with better websites',
      'No online booking means missed after-hours jobs',
      'Reviews and trust signals not prominently displayed',
      'Not showing up in "plumber near me" searches',
      'Website doesn\'t work well on mobile (80% of emergency searches)',
    ],
    keyTalkingPoints: [
      '80% of plumbing searches happen on mobile during emergencies',
      'A 24/7 booking form can capture after-hours leads',
      'Prominently displayed reviews increase call rates by 45%',
      'Local SEO puts you in front of people actively searching',
      'Fast-loading pages reduce bounce rate by 40%',
    ],
    commonServices: ['Emergency repairs', 'Drain cleaning', 'Water heater', 'Repiping', 'Fixture installation'],
    competitorWeaknesses: ['Outdated designs', 'No mobile optimization', 'Hidden contact info', 'No reviews visible'],
    conversionFactors: ['Click-to-call button', 'Emergency availability', 'Pricing transparency', 'License/insurance visible'],
    averageProjectValue: { min: 2500, max: 8000 },
    typicalClientProfile: 'Local plumbing company, 2-15 employees, serves 20-50 mile radius',
    seasonality: 'Winter peaks (frozen pipes), year-round steady',
    urgencyTriggers: ['Burst pipe', 'No hot water', 'Clogged drain', 'Gas smell'],
    trustSignals: ['Licensed & insured', 'Years in business', 'Google reviews', 'BBB rating'],
    sampleStats: [
      { stat: '88% of consumers search online before calling a plumber', source: 'BrightLocal' },
      { stat: 'Plumbers with 4+ stars get 70% more calls', source: 'Harvard Business Review' },
    ],
  },

  lawyers: {
    industry: 'lawyers',
    displayName: 'Legal Services',
    valueProposition: 'Convert potential clients during their most critical moments with a professional, trustworthy online presence.',
    painPoints: [
      'Website doesn\'t convey expertise and trust',
      'No clear path to schedule consultation',
      'Practice areas not clearly explained',
      'Not ranking for local legal searches',
      'Generic template that doesn\'t differentiate',
    ],
    keyTalkingPoints: [
      '96% of people seeking legal advice use a search engine',
      'Professional design increases perceived expertise by 75%',
      'Clear CTAs can increase consultation requests by 200%',
      'Case results and testimonials build trust',
      'Mobile-friendly sites are essential - 60% search on phones',
    ],
    commonServices: ['Personal injury', 'Family law', 'Criminal defense', 'Business law', 'Estate planning'],
    competitorWeaknesses: ['Stock photos', 'Generic content', 'No personality', 'Complicated navigation'],
    conversionFactors: ['Free consultation offer', 'Case results', 'Attorney profiles', 'Clear practice areas'],
    averageProjectValue: { min: 5000, max: 15000 },
    typicalClientProfile: 'Solo practitioner or small firm, 1-10 attorneys',
    seasonality: 'Year-round, slight increase in January (resolutions) and post-holidays',
    urgencyTriggers: ['Accident', 'Arrest', 'Divorce filing', 'Business dispute'],
    trustSignals: ['Bar association', 'Super Lawyers', 'Avvo rating', 'Case results'],
    sampleStats: [
      { stat: '74% of consumers visit a law firm\'s website to take action', source: 'Google' },
      { stat: 'Law firms lose 70% of leads due to slow response', source: 'Legal Marketing Association' },
    ],
  },

  restaurants: {
    industry: 'restaurants',
    displayName: 'Restaurant & Dining',
    valueProposition: 'Fill more tables by making it effortless for hungry customers to find your menu, hours, and book a table.',
    painPoints: [
      'Menu is a PDF or hard to read on mobile',
      'No online ordering or reservation integration',
      'Poor food photography or none at all',
      'Hours and location hard to find',
      'Not appearing in "restaurants near me" searches',
    ],
    keyTalkingPoints: [
      '90% of diners research online before choosing a restaurant',
      'Online ordering can increase revenue by 30%',
      'Professional food photos increase orders by 25%',
      'Mobile-friendly menus reduce bounce rate by 50%',
      'Easy reservations mean fewer no-shows',
    ],
    commonServices: ['Dine-in', 'Takeout', 'Catering', 'Private events', 'Delivery'],
    competitorWeaknesses: ['PDF menus', 'No online ordering', 'Slow loading', 'Outdated info'],
    conversionFactors: ['Visual menu', 'Online ordering', 'Reservation button', 'Photos of food'],
    averageProjectValue: { min: 2000, max: 6000 },
    typicalClientProfile: 'Independent restaurant or small chain, 1-5 locations',
    seasonality: 'Holiday peaks, summer slowdowns in some areas',
    urgencyTriggers: ['Event planning', 'Date night', 'Business lunch', 'Family gathering'],
    trustSignals: ['Yelp reviews', 'Food photos', 'Press mentions', 'Awards'],
    sampleStats: [
      { stat: '77% of diners visit a restaurant\'s website before visiting', source: 'OpenTable' },
      { stat: 'Restaurants with online ordering see 20% larger orders', source: 'Toast' },
    ],
  },

  dentists: {
    industry: 'dentists',
    displayName: 'Dental Practice',
    valueProposition: 'Build patient trust before they walk in the door with a modern, welcoming online presence.',
    painPoints: [
      'Website looks clinical and cold',
      'No online appointment booking',
      'Services not clearly explained',
      'Before/after photos not showcased',
      'New patient forms not online',
    ],
    keyTalkingPoints: [
      '75% of patients judge a practice by its website',
      'Online booking can reduce no-shows by 30%',
      'Before/after galleries increase cosmetic inquiries by 60%',
      'Patient testimonials reduce dental anxiety',
      'Clear pricing information builds trust',
    ],
    commonServices: ['Cleanings', 'Cosmetic', 'Implants', 'Orthodontics', 'Emergency'],
    competitorWeaknesses: ['Dated design', 'No patient portal', 'Poor mobile', 'Generic stock photos'],
    conversionFactors: ['Online booking', 'New patient forms', 'Insurance info', 'Team photos'],
    averageProjectValue: { min: 4000, max: 12000 },
    typicalClientProfile: 'Private dental practice, 1-3 dentists',
    seasonality: 'Back to school peaks, year-end insurance rushes',
    urgencyTriggers: ['Tooth pain', 'Broken tooth', 'New insurance', 'Wedding/event'],
    trustSignals: ['ADA membership', 'Patient reviews', 'Years in practice', 'Technology used'],
    sampleStats: [
      { stat: '68% of patients prefer online appointment booking', source: 'Healthgrades' },
      { stat: 'Dental practices with modern websites see 40% more new patients', source: 'Dental Economics' },
    ],
  },

  contractors: {
    industry: 'contractors',
    displayName: 'General Contracting',
    valueProposition: 'Win more bids by showcasing your craftsmanship and building trust before the first meeting.',
    painPoints: [
      'Portfolio doesn\'t show quality of work',
      'No clear process explanation',
      'Missing licenses and insurance info',
      'No testimonials from past clients',
      'Hard to request a quote online',
    ],
    keyTalkingPoints: [
      '85% of homeowners research contractors online first',
      'Project galleries can increase quote requests by 50%',
      'Clear process explanations reduce client anxiety',
      'Video testimonials are 10x more effective than written',
      'Mobile-friendly is essential for on-site decisions',
    ],
    commonServices: ['Remodeling', 'Additions', 'New construction', 'Repairs', 'Commercial'],
    competitorWeaknesses: ['Poor project photos', 'No process info', 'Hidden credentials', 'No reviews'],
    conversionFactors: ['Project gallery', 'Quote request form', 'Process timeline', 'Credentials visible'],
    averageProjectValue: { min: 3000, max: 10000 },
    typicalClientProfile: 'General contractor or specialty trade, 5-25 employees',
    seasonality: 'Spring/summer peaks, winter slowdowns in cold climates',
    urgencyTriggers: ['Home purchase', 'Damage repair', 'Growing family', 'Investment property'],
    trustSignals: ['License number', 'Insurance', 'BBB', 'Houzz/Angi reviews'],
    sampleStats: [
      { stat: '84% of homeowners check reviews before hiring a contractor', source: 'Houzz' },
      { stat: 'Contractors with portfolios get 3x more leads', source: 'BuilderTrend' },
    ],
  },

  hvac: {
    industry: 'hvac',
    displayName: 'HVAC Services',
    valueProposition: 'Capture emergency calls and maintenance contracts with a website built for comfort seekers.',
    painPoints: [
      'Emergency services not prominently featured',
      'No maintenance plan information',
      'Financing options hidden or missing',
      'Service areas not clear',
      'No energy efficiency messaging',
    ],
    keyTalkingPoints: [
      '70% of HVAC emergencies start with a mobile search',
      'Maintenance plan pages can generate recurring revenue',
      'Financing info increases average job size by 40%',
      'Energy savings calculators engage visitors',
      'Seasonal promotions drive off-peak business',
    ],
    commonServices: ['AC repair', 'Heating', 'Installation', 'Maintenance plans', 'Indoor air quality'],
    competitorWeaknesses: ['No emergency emphasis', 'Poor mobile', 'No financing info', 'Generic content'],
    conversionFactors: ['24/7 service visible', 'Financing options', 'Service plans', 'Seasonal specials'],
    averageProjectValue: { min: 2500, max: 8000 },
    typicalClientProfile: 'Local HVAC company, 5-30 employees',
    seasonality: 'Summer AC peaks, winter heating peaks',
    urgencyTriggers: ['No AC in summer', 'No heat in winter', 'System failure', 'Moving'],
    trustSignals: ['NATE certified', 'Manufacturer authorized', 'EPA certified', 'Reviews'],
    sampleStats: [
      { stat: '82% of HVAC customers expect online scheduling', source: 'ServiceTitan' },
      { stat: 'HVAC companies with financing see 60% higher close rates', source: 'Synchrony' },
    ],
  },

  salons: {
    industry: 'salons',
    displayName: 'Salon & Spa',
    valueProposition: 'Turn scrollers into bookings with a beautiful online presence that reflects your style.',
    painPoints: [
      'Website doesn\'t match salon aesthetic',
      'No online booking integration',
      'Service menu hard to find or read',
      'Portfolio doesn\'t showcase talent',
      'No team member profiles',
    ],
    keyTalkingPoints: [
      '70% of salon clients book online when available',
      'Instagram-worthy design attracts ideal clients',
      'Online booking reduces phone time by 50%',
      'Before/after galleries drive service upgrades',
      'Gift card sales increase 30% with online purchase',
    ],
    commonServices: ['Haircuts', 'Color', 'Styling', 'Spa treatments', 'Nails'],
    competitorWeaknesses: ['Outdated design', 'No booking', 'Poor photos', 'No personality'],
    conversionFactors: ['Online booking', 'Service menu with prices', 'Gallery', 'Gift cards'],
    averageProjectValue: { min: 2000, max: 5000 },
    typicalClientProfile: 'Salon or spa, 3-15 stylists',
    seasonality: 'Wedding season, holidays, prom/graduation',
    urgencyTriggers: ['Event coming up', 'Bad haircut elsewhere', 'New job', 'Breakup'],
    trustSignals: ['Stylists credentials', 'Product lines', 'Reviews', 'Awards'],
    sampleStats: [
      { stat: '67% of salon clients prefer online booking', source: 'Mindbody' },
      { stat: 'Salons with online booking see 25% fewer no-shows', source: 'Vagaro' },
    ],
  },

  doctors: {
    industry: 'doctors',
    displayName: 'Medical Practice',
    valueProposition: 'Build patient confidence with a professional, informative online presence that simplifies care.',
    painPoints: [
      'Website doesn\'t convey expertise',
      'No patient portal or forms',
      'Conditions treated not clearly listed',
      'Insurance information missing',
      'Hard to find appointment options',
    ],
    keyTalkingPoints: [
      '77% of patients research doctors online before booking',
      'Online scheduling increases new patient acquisition by 30%',
      'Patient education content improves outcomes',
      'Clear insurance info reduces front desk calls',
      'HIPAA-compliant forms streamline intake',
    ],
    commonServices: ['Primary care', 'Specialty care', 'Preventive', 'Chronic disease', 'Urgent'],
    competitorWeaknesses: ['Clinical coldness', 'No portal', 'Poor mobile', 'Outdated info'],
    conversionFactors: ['Online scheduling', 'Patient portal', 'Insurance list', 'Provider bios'],
    averageProjectValue: { min: 5000, max: 15000 },
    typicalClientProfile: 'Medical practice, 1-10 providers',
    seasonality: 'Flu season, new year health resolutions',
    urgencyTriggers: ['New symptoms', 'New insurance', 'Moving to area', 'Referral'],
    trustSignals: ['Board certifications', 'Hospital affiliations', 'Reviews', 'Awards'],
    sampleStats: [
      { stat: '94% of patients use online reviews to evaluate doctors', source: 'Software Advice' },
      { stat: 'Practices with online booking see 20% more new patients', source: 'Healthgrades' },
    ],
  },

  accountants: {
    industry: 'accountants',
    displayName: 'Accounting & Tax',
    valueProposition: 'Attract quality clients year-round by positioning your firm as the trusted financial partner.',
    painPoints: [
      'Website only mentions tax season',
      'Services not clearly differentiated',
      'No client portal for documents',
      'Industries served not specified',
      'Value proposition unclear',
    ],
    keyTalkingPoints: [
      'Businesses research accountants 3-6 months before switching',
      'Industry specialization content attracts ideal clients',
      'Client portals improve document exchange by 70%',
      'Year-round services reduce seasonal revenue swings',
      'Clear pricing builds trust and qualifies leads',
    ],
    commonServices: ['Tax preparation', 'Bookkeeping', 'Payroll', 'Advisory', 'Audit'],
    competitorWeaknesses: ['Tax-only focus', 'Generic services', 'No industries', 'Outdated'],
    conversionFactors: ['Industry focus', 'Client portal', 'Service packages', 'Team expertise'],
    averageProjectValue: { min: 3000, max: 10000 },
    typicalClientProfile: 'CPA firm or tax practice, 2-20 staff',
    seasonality: 'January-April peak, but advisory is year-round',
    urgencyTriggers: ['Tax deadline', 'Audit notice', 'Business growth', 'Accountant retiring'],
    trustSignals: ['CPA license', 'Years experience', 'Industries served', 'Client retention'],
    sampleStats: [
      { stat: '60% of businesses are open to switching accountants', source: 'Accounting Today' },
      { stat: 'Firms with niches earn 20% higher fees', source: 'AICPA' },
    ],
  },

  realtors: {
    industry: 'realtors',
    displayName: 'Real Estate',
    valueProposition: 'Stand out in a crowded market with a personal brand that builds trust and generates leads.',
    painPoints: [
      'Using generic brokerage template',
      'Listings not well integrated',
      'No neighborhood expertise shown',
      'Testimonials not prominent',
      'No lead capture system',
    ],
    keyTalkingPoints: [
      '99% of home buyers use the internet in their search',
      'Personal websites generate 3x more leads than brokerage pages',
      'Video tours increase engagement by 400%',
      'Neighborhood guides establish local expertise',
      'CRM integration captures and nurtures leads',
    ],
    commonServices: ['Buying', 'Selling', 'Luxury', 'Investment', 'Relocation'],
    competitorWeaknesses: ['Generic templates', 'Poor listing display', 'No personality', 'No lead capture'],
    conversionFactors: ['IDX integration', 'Lead magnets', 'Testimonials', 'Market reports'],
    averageProjectValue: { min: 2500, max: 8000 },
    typicalClientProfile: 'Individual agent or small team',
    seasonality: 'Spring peak, summer steady, winter slower',
    urgencyTriggers: ['Job relocation', 'Growing family', 'Investment opportunity', 'Downsizing'],
    trustSignals: ['Sales volume', 'Years experience', 'Designations', 'Reviews'],
    sampleStats: [
      { stat: '52% of buyers found their agent online', source: 'NAR' },
      { stat: 'Agents with personal sites earn 30% more', source: 'Inman' },
    ],
  },

  'auto-repair': {
    industry: 'auto-repair',
    displayName: 'Auto Repair & Service',
    valueProposition: 'Build trust with drivers by showing expertise, transparency, and making service easy.',
    painPoints: [
      'No online appointment scheduling',
      'Services and pricing not clear',
      'Trust signals not visible',
      'Mobile experience poor',
      'No customer reviews displayed',
    ],
    keyTalkingPoints: [
      '70% of vehicle owners research shops online first',
      'Online scheduling can increase appointments by 35%',
      'Transparent pricing builds trust',
      'Certifications prominently displayed matter',
      'Reviews are critical for trust',
    ],
    commonServices: ['Oil change', 'Brakes', 'Diagnostics', 'Tires', 'Transmission'],
    competitorWeaknesses: ['No booking', 'Hidden prices', 'No reviews', 'Outdated'],
    conversionFactors: ['Online booking', 'Service menu', 'Coupons', 'Certifications'],
    averageProjectValue: { min: 2000, max: 6000 },
    typicalClientProfile: 'Independent shop or small chain, 3-15 employees',
    seasonality: 'Winter prep, summer road trips',
    urgencyTriggers: ['Check engine light', 'Strange noise', 'Road trip', 'Failed inspection'],
    trustSignals: ['ASE certified', 'BBB', 'Years in business', 'Warranties'],
    sampleStats: [
      { stat: '78% of consumers want online service scheduling', source: 'Cox Automotive' },
      { stat: 'Shops with reviews get 50% more calls', source: 'BrightLocal' },
    ],
  },

  fitness: {
    industry: 'fitness',
    displayName: 'Fitness & Gym',
    valueProposition: 'Convert browsers into members with a website that motivates action.',
    painPoints: [
      'No online membership signup',
      'Class schedule hard to find',
      'Facility photos outdated or missing',
      'Pricing not transparent',
      'No trainer profiles',
    ],
    keyTalkingPoints: [
      '80% of gym searchers visit the website before visiting',
      'Online signup can increase memberships by 40%',
      'Virtual tours increase visit rates',
      'Class schedule integration reduces phone calls',
      'Trainer profiles build connection',
    ],
    commonServices: ['Memberships', 'Personal training', 'Group classes', 'Nutrition', 'Recovery'],
    competitorWeaknesses: ['No online signup', 'Hidden pricing', 'Poor photos', 'No personality'],
    conversionFactors: ['Online signup', 'Free trial offer', 'Class schedule', 'Tour booking'],
    averageProjectValue: { min: 2500, max: 7000 },
    typicalClientProfile: 'Independent gym or studio',
    seasonality: 'January peak, summer slower',
    urgencyTriggers: ['New Year', 'Wedding', 'Reunion', 'Doctor\'s orders'],
    trustSignals: ['Certifications', 'Success stories', 'Reviews', 'Years open'],
    sampleStats: [
      { stat: '67% of members prefer online class booking', source: 'IHRSA' },
      { stat: 'Gyms with virtual tours see 25% more visits', source: 'Club Industry' },
    ],
  },

  cleaning: {
    industry: 'cleaning',
    displayName: 'Cleaning Services',
    valueProposition: 'Win trust and bookings by making it easy for busy people to get a clean home.',
    painPoints: [
      'No instant quote functionality',
      'Service packages unclear',
      'Trust signals missing',
      'No online booking',
      'Serving areas not defined',
    ],
    keyTalkingPoints: [
      'Busy professionals want to book cleaning in under 2 minutes',
      'Instant quotes increase conversions by 50%',
      'Background check badges build trust',
      'Before/after photos prove quality',
      'Recurring booking reduces churn',
    ],
    commonServices: ['House cleaning', 'Deep cleaning', 'Move in/out', 'Office cleaning', 'Recurring'],
    competitorWeaknesses: ['No online booking', 'No pricing', 'No trust signals', 'Poor mobile'],
    conversionFactors: ['Instant quote', 'Online booking', 'Service packages', 'Trust badges'],
    averageProjectValue: { min: 1500, max: 4000 },
    typicalClientProfile: 'Local cleaning company, 5-30 cleaners',
    seasonality: 'Spring cleaning peak, holidays',
    urgencyTriggers: ['Hosting guests', 'Moving', 'Special occasion', 'Too busy'],
    trustSignals: ['Bonded & insured', 'Background checks', 'Reviews', 'Satisfaction guarantee'],
    sampleStats: [
      { stat: '75% of cleaning customers prefer online booking', source: 'Housecall Pro' },
      { stat: 'Services with instant quotes convert 2x better', source: 'ZenMaid' },
    ],
  },

  landscaping: {
    industry: 'landscaping',
    displayName: 'Landscaping & Lawn Care',
    valueProposition: 'Showcase beautiful work and make it easy for homeowners to get their dream yard.',
    painPoints: [
      'Portfolio doesn\'t show transformation',
      'Services not clearly categorized',
      'No seasonal maintenance info',
      'Quote request form too complicated',
      'Service areas unclear',
    ],
    keyTalkingPoints: [
      'Before/after photos increase inquiries by 70%',
      'Seasonal content drives year-round engagement',
      'Simple quote forms increase submissions',
      'Maintenance plan pages create recurring revenue',
      'Gallery organization by project type helps',
    ],
    commonServices: ['Design', 'Installation', 'Maintenance', 'Hardscaping', 'Irrigation'],
    competitorWeaknesses: ['Poor portfolio', 'No before/after', 'Seasonal only', 'Hard to quote'],
    conversionFactors: ['Portfolio gallery', 'Quote form', 'Service packages', 'Maintenance plans'],
    averageProjectValue: { min: 2000, max: 8000 },
    typicalClientProfile: 'Landscaping company, 5-25 employees',
    seasonality: 'Spring/summer peak, fall prep, winter slow',
    urgencyTriggers: ['New home', 'Home sale', 'Event hosting', 'Problem area'],
    trustSignals: ['Licensed', 'Insured', 'Portfolio', 'Reviews'],
    sampleStats: [
      { stat: 'Homes with professional landscaping sell for 15% more', source: 'NAR' },
      { stat: 'Landscapers with galleries get 60% more leads', source: 'LawnStarter' },
    ],
  },

  photography: {
    industry: 'photography',
    displayName: 'Photography',
    valueProposition: 'Let your work speak for itself with a stunning portfolio that converts visitors into clients.',
    painPoints: [
      'Portfolio loads slowly',
      'Images not optimized',
      'Booking process unclear',
      'Pricing not explained',
      'Different services mixed together',
    ],
    keyTalkingPoints: [
      'Portfolio load time directly impacts bookings',
      'Gallery organization by session type helps',
      'Investment guides qualify leads',
      'Online booking increases conversions',
      'Client galleries add value',
    ],
    commonServices: ['Weddings', 'Portraits', 'Events', 'Commercial', 'Product'],
    competitorWeaknesses: ['Slow loading', 'Disorganized', 'No pricing', 'Confusing navigation'],
    conversionFactors: ['Fast gallery', 'Clear packages', 'Booking system', 'Client portal'],
    averageProjectValue: { min: 1500, max: 5000 },
    typicalClientProfile: 'Independent photographer',
    seasonality: 'Wedding season peaks, holiday portraits',
    urgencyTriggers: ['Engagement', 'Milestone', 'Business rebrand', 'Family growth'],
    trustSignals: ['Published work', 'Reviews', 'Awards', 'Client list'],
    sampleStats: [
      { stat: 'Photographers with optimized sites get 40% more inquiries', source: 'ShootProof' },
      { stat: '90% of couples visit 3+ photographer websites before booking', source: 'The Knot' },
    ],
  },

  other: {
    industry: 'other',
    displayName: 'Business Services',
    valueProposition: 'Stand out from competitors with a professional online presence that builds trust.',
    painPoints: [
      'Website looks outdated or generic',
      'Value proposition unclear',
      'No clear path to contact',
      'Mobile experience poor',
      'Not ranking in local searches',
    ],
    keyTalkingPoints: [
      '75% of consumers judge credibility by website design',
      'Clear CTAs increase conversions by 50%+',
      'Mobile-friendly is essential for modern business',
      'Local SEO puts you in front of active searchers',
      'Fast loading reduces bounce rate significantly',
    ],
    commonServices: ['Consultation', 'Services', 'Products', 'Support'],
    competitorWeaknesses: ['Outdated design', 'Unclear messaging', 'Poor mobile', 'No social proof'],
    conversionFactors: ['Clear CTA', 'Trust signals', 'Easy contact', 'Mobile-friendly'],
    averageProjectValue: { min: 2000, max: 6000 },
    typicalClientProfile: 'Local business, 1-50 employees',
    seasonality: 'Varies by industry',
    urgencyTriggers: ['Business growth', 'Competition', 'Rebranding', 'New market'],
    trustSignals: ['Years in business', 'Reviews', 'Certifications', 'Client list'],
    sampleStats: [
      { stat: '38% of visitors leave if content/layout is unattractive', source: 'Adobe' },
      { stat: 'Businesses with modern websites grow 40% faster', source: 'Forbes' },
    ],
  },
};

export function getIndustryTemplate(industry: IndustryType): IndustryTemplate {
  return industryTemplates[industry] || industryTemplates.other;
}

export function getAllIndustryTemplates(): IndustryTemplate[] {
  return Object.values(industryTemplates);
}

export function detectIndustryFromKeywords(text: string): IndustryType {
  const lowerText = text.toLowerCase();

  const keywords: Record<IndustryType, string[]> = {
    plumbers: ['plumb', 'pipe', 'drain', 'leak', 'water heater', 'faucet', 'toilet'],
    lawyers: ['law', 'attorney', 'legal', 'lawyer', 'court', 'litigation'],
    restaurants: ['restaurant', 'menu', 'dining', 'food', 'cuisine', 'chef', 'reservation'],
    dentists: ['dental', 'dentist', 'teeth', 'orthodont', 'oral', 'smile'],
    contractors: ['contractor', 'remodel', 'construction', 'renovation', 'builder'],
    hvac: ['hvac', 'heating', 'cooling', 'air condition', 'furnace', 'ac repair'],
    salons: ['salon', 'hair', 'beauty', 'spa', 'stylist', 'nail', 'wax'],
    doctors: ['doctor', 'medical', 'physician', 'clinic', 'healthcare', 'patient'],
    accountants: ['account', 'cpa', 'tax', 'bookkeep', 'financial', 'audit'],
    realtors: ['real estate', 'realtor', 'property', 'homes for sale', 'listing', 'broker'],
    'auto-repair': ['auto', 'mechanic', 'car repair', 'oil change', 'brake', 'tire'],
    fitness: ['gym', 'fitness', 'workout', 'training', 'yoga', 'crossfit'],
    cleaning: ['cleaning', 'maid', 'janitorial', 'housekeep'],
    landscaping: ['landscape', 'lawn', 'garden', 'yard', 'tree service'],
    photography: ['photo', 'wedding photo', 'portrait', 'headshot'],
    other: [],
  };

  for (const [industry, industryKeywords] of Object.entries(keywords)) {
    if (industry === 'other') continue;
    if (industryKeywords.some(keyword => lowerText.includes(keyword))) {
      return industry as IndustryType;
    }
  }

  return 'other';
}
