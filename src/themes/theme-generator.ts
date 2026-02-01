import { WebsiteManifest } from '../capture/manifest-generator';
import {
  DNACode,
  ThemeVariance,
  COLOR_VARIANTS,
  DESIGN_VARIANTS,
  HERO_VARIANTS,
  LAYOUT_VARIANTS,
  NAV_VARIANTS
} from './variance-planner';

export interface GeneratedTheme {
  id: string;
  name: string;
  dna: DNACode;
  html: string;
  css: string;
}

export function generateTheme(manifest: WebsiteManifest, variance: ThemeVariance): GeneratedTheme {
  const { dna } = variance;
  const colorScheme = COLOR_VARIANTS[dna.color] || COLOR_VARIANTS.C1;
  const designStyle = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = generateCSS(dna, colorScheme, designStyle);
  const html = generateHTML(manifest, variance, colorScheme);

  return {
    id: variance.id,
    name: variance.name,
    dna,
    html,
    css
  };
}

function generateCSS(
  dna: DNACode,
  colorScheme: typeof COLOR_VARIANTS.C1,
  designStyle: typeof DESIGN_VARIANTS.D1
): string {
  const { colors } = colorScheme;
  const { borderRadius, shadow, style } = designStyle;

  return `
/* Theme: ${colorScheme.name} with ${designStyle.name} */
:root {
  --bg-color: ${colors.bg};
  --text-color: ${colors.text};
  --primary-color: ${colors.primary};
  --accent-color: ${colors.accent};
  --border-radius: ${borderRadius};
  --box-shadow: ${shadow};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Navigation - ${NAV_VARIANTS[dna.nav]?.name || 'Default'} */
.nav {
  ${dna.nav === 'N1' ? `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
  ` : dna.nav === 'N2' ? `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: transparent;
  z-index: 1000;
  ` : dna.nav === 'N7' ? `
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color);
  border-radius: 9999px;
  box-shadow: var(--box-shadow);
  z-index: 1000;
  padding: 8px 24px;
  ` : `
  background: var(--bg-color);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  `}
}

.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 24px;
  list-style: none;
}

.nav-links a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary-color);
}

/* Hero - ${HERO_VARIANTS[dna.hero]?.name || 'Default'} */
.hero {
  ${dna.hero === 'H1' ? `
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  ` : dna.hero === 'H2' ? `
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  ` : dna.hero === 'H3' ? `
  padding: 120px 0 60px;
  text-align: center;
  background: var(--bg-color);
  ` : dna.hero === 'H9' ? `
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  ` : `
  min-height: 80vh;
  display: flex;
  align-items: center;
  background: linear-gradient(to bottom, var(--bg-color), rgba(0,0,0,0.02));
  `}
}

.hero-content {
  max-width: 800px;
  padding: 40px;
}

.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
}

.hero p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 32px;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

/* Sections - ${LAYOUT_VARIANTS[dna.layout]?.name || 'Default'} */
.section {
  padding: 80px 0;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  text-align: center;
}

.section-subtitle {
  font-size: 1.125rem;
  opacity: 0.7;
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
}

/* Grid Layout */
.grid {
  display: grid;
  ${dna.layout === 'L1' ? `
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  ` : dna.layout === 'L3' ? `
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  ` : dna.layout === 'L5' ? `
  grid-template-columns: 1fr;
  max-width: 720px;
  margin: 0 auto;
  gap: 32px;
  ` : dna.layout === 'L10' ? `
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  ` : dna.layout === 'L11' ? `
  display: block;
  ` : `
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  `}
}

/* Professional Services Layout (L11) */
.service-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  margin-bottom: 120px;
}

.service-block:last-child {
  margin-bottom: 0;
}

.service-block.alternate {
  direction: rtl;
}

.service-block.alternate > * {
  direction: ltr;
}

.service-content {
  display: flex;
  flex-direction: column;
}

.service-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 24px;
  color: var(--accent-color);
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--text-color);
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.service-separator {
  width: 80px;
  height: 3px;
  background: var(--accent-color);
  margin-bottom: 24px;
}

.service-description {
  font-size: 1.1rem;
  color: rgba(0,0,0,0.6);
  line-height: 1.8;
  max-width: 600px;
}

.service-image {
  position: relative;
  overflow: hidden;
  border-radius: ${borderRadius};
  aspect-ratio: 4/3;
}

.service-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.service-image:hover img {
  transform: scale(1.05);
}

@media (max-width: 1024px) {
  .service-block {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  
  .service-block.alternate {
    direction: ltr;
  }
  
  .service-image {
    order: -1;
  }
}

/* Cards */
.card {
  background: var(--bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
  ${style === 'outlined' ? `
  border: 2px solid rgba(0,0,0,0.1);
  box-shadow: none;
  ` : style === 'glass' ? `
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  ` : style === 'brutalist' ? `
  border: 3px solid var(--text-color);
  box-shadow: 8px 8px 0 var(--text-color);
  ` : ''}
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.card h3 {
  font-size: 1.25rem;
  margin-bottom: 12px;
}

.card p {
  opacity: 0.8;
  font-size: 0.95rem;
}

/* Footer */
.footer {
  background: var(--text-color);
  color: var(--bg-color);
  padding: 60px 0 30px;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h4 {
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.footer-section a {
  display: block;
  color: inherit;
  opacity: 0.8;
  text-decoration: none;
  margin-bottom: 8px;
}

.footer-section a:hover {
  opacity: 1;
}

.footer-bottom {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid rgba(255,255,255,0.1);
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .nav-links {
    display: none;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
`;
}

function generateHTML(
  manifest: WebsiteManifest,
  variance: ThemeVariance,
  colorScheme: typeof COLOR_VARIANTS.C1
): string {
  const { summary, dom } = manifest;
  const title = summary.pageTitle || 'Welcome';
  const description = summary.pageDescription || 'Discover our amazing services and products.';

  // Extract navigation items
  const navItems = dom.navigation.slice(0, 5).map(n => n.text).filter(Boolean);
  if (navItems.length === 0) {
    navItems.push('Home', 'About', 'Services', 'Contact');
  }

  // Extract sections content
  const sections = dom.sections.slice(0, 4);
  
  // Extract images for service blocks
  const images = dom.images.slice(0, 4);

  // Generate service blocks for L11 layout
  const generateServiceBlocks = () => {
    if (variance.dna.layout !== 'L11') return '';
    
    const serviceBlocks = sections.slice(0, 4).map((section, index) => {
      const isAlternate = index % 2 === 1;
      const serviceTitle = section.text?.split('.')[0] || `Service ${index + 1}`;
      const serviceDescription = section.text || 'Professional service description.';
      const serviceImage = images[index]?.src || `https://via.placeholder.com/800x600?text=Service+${index + 1}`;
      
      // Simple icon placeholder (can be enhanced with actual icons)
      const iconSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
      </svg>`;
      
      return `
      <div class="service-block ${isAlternate ? 'alternate' : ''}">
        <div class="service-content">
          <div class="service-icon">${iconSvg}</div>
          <h2 class="service-title">${serviceTitle}</h2>
          <div class="service-separator"></div>
          <p class="service-description">${serviceDescription}</p>
        </div>
        <div class="service-image">
          <img src="${serviceImage}" alt="${serviceTitle}">
        </div>
      </div>`;
    }).join('\n');
    
    return `
    <!-- Services Section -->
    <section class="section">
      <div class="container">
        <h2 class="section-title" style="text-align: center; margin-bottom: 64px;">Our Services</h2>
        ${serviceBlocks}
      </div>
    </section>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${variance.name} Theme</title>
  <meta name="description" content="${description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
${generateCSS(variance.dna, colorScheme, DESIGN_VARIANTS[variance.dna.design])}
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="nav">
    <div class="container nav-inner">
      <a href="#" class="nav-logo">${title.split(' ')[0] || 'Brand'}</a>
      <ul class="nav-links">
        ${navItems.map(item => `<li><a href="#">${item}</a></li>`).join('\n        ')}
      </ul>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1>${title}</h1>
      <p>${description}</p>
      <div>
        <a href="#" class="btn btn-primary">Get Started</a>
        <a href="#" class="btn btn-secondary" style="margin-left: 12px;">Learn More</a>
      </div>
    </div>
  </section>

  ${variance.dna.layout === 'L11' ? generateServiceBlocks() : `
  <!-- Features Section -->
  <section class="section">
    <div class="container">
      <h2 class="section-title">What We Offer</h2>
      <p class="section-subtitle">Discover our comprehensive solutions designed to help you succeed.</p>
      <div class="grid">
        <div class="card">
          <h3>Quality Service</h3>
          <p>We deliver exceptional quality in everything we do, ensuring your complete satisfaction.</p>
        </div>
        <div class="card">
          <h3>Expert Team</h3>
          <p>Our experienced professionals are dedicated to achieving the best results for you.</p>
        </div>
        <div class="card">
          <h3>Fast Delivery</h3>
          <p>Quick turnaround times without compromising on quality or attention to detail.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section class="section" style="background: rgba(0,0,0,0.02);">
    <div class="container">
      <h2 class="section-title">About Us</h2>
      <p class="section-subtitle">${sections[0]?.text || 'Learn more about our mission and values.'}</p>
      <div class="grid">
        <div class="card">
          <h3>Our Mission</h3>
          <p>To provide innovative solutions that make a real difference in people's lives.</p>
        </div>
        <div class="card">
          <h3>Our Vision</h3>
          <p>Building a future where technology empowers everyone to achieve their goals.</p>
        </div>
      </div>
    </div>
  </section>
  `}

  <!-- CTA Section -->
  <section class="section" style="background: linear-gradient(135deg, ${colorScheme.colors.primary}, ${colorScheme.colors.accent}); color: white; text-align: center;">
    <div class="container">
      <h2 style="font-size: 2.5rem; margin-bottom: 16px;">Ready to Get Started?</h2>
      <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 32px;">Join thousands of satisfied customers today.</p>
      <a href="#" class="btn" style="background: white; color: ${colorScheme.colors.primary};">Contact Us</a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-section">
          <h4>${title.split(' ')[0] || 'Brand'}</h4>
          <p style="opacity: 0.8;">${description.slice(0, 100)}</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          ${navItems.slice(0, 4).map(item => `<a href="#">${item}</a>`).join('\n          ')}
        </div>
        <div class="footer-section">
          <h4>Contact</h4>
          <a href="#">info@example.com</a>
          <a href="#">+1 (555) 123-4567</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${title.split(' ')[0] || 'Brand'}. All rights reserved.</p>
        <p style="font-size: 0.875rem; margin-top: 8px;">Theme: ${variance.name} (DNA: ${variance.dna.hero}-${variance.dna.layout}-${variance.dna.color}-${variance.dna.nav}-${variance.dna.design})</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

export function generateThemes(manifest: WebsiteManifest, variances: ThemeVariance[]): GeneratedTheme[] {
  return variances.map(v => generateTheme(manifest, v));
}
