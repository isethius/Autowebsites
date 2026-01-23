import { WebsiteManifest } from '../capture/manifest-generator';

export interface WebsiteScore {
  overall: number;
  design: ScoreCategory;
  mobile: ScoreCategory;
  performance: ScoreCategory;
  seo: ScoreCategory;
  recommendations: string[];
}

export interface ScoreCategory {
  score: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  notes?: string;
}

export function scoreWebsite(manifest: WebsiteManifest): WebsiteScore {
  const design = scoreDesign(manifest);
  const mobile = scoreMobile(manifest);
  const performance = scorePerformance(manifest);
  const seo = scoreSEO(manifest);

  const overall = Math.round(
    (design.score + mobile.score + performance.score + seo.score) / 4
  );

  const recommendations = generateRecommendations(manifest, {
    design,
    mobile,
    performance,
    seo
  });

  return {
    overall,
    design,
    mobile,
    performance,
    seo,
    recommendations
  };
}

function scoreDesign(manifest: WebsiteManifest): ScoreCategory {
  const factors: ScoreFactor[] = [];
  const { styles, dom } = manifest;

  // Color consistency (0-2)
  const colorCount = styles.colors.primary.length + styles.colors.accent.length;
  const colorScore = colorCount >= 2 && colorCount <= 5 ? 2 : colorCount > 5 ? 1 : 0;
  factors.push({
    name: 'Color Palette',
    score: colorScore,
    maxScore: 2,
    notes: colorCount > 5 ? 'Too many colors' : colorCount < 2 ? 'Limited color palette' : undefined
  });

  // Typography (0-2)
  const fontCount = styles.fonts.families.length;
  const fontScore = fontCount >= 1 && fontCount <= 3 ? 2 : fontCount > 3 ? 1 : 0;
  factors.push({
    name: 'Typography',
    score: fontScore,
    maxScore: 2,
    notes: fontCount > 3 ? 'Too many fonts' : fontCount === 0 ? 'No custom fonts' : undefined
  });

  // Visual hierarchy (0-2)
  const headingCount = dom.headings.length;
  const hasH1 = dom.headings.some(h => h.level === 1);
  const hierarchyScore = hasH1 && headingCount >= 3 ? 2 : hasH1 ? 1 : 0;
  factors.push({
    name: 'Visual Hierarchy',
    score: hierarchyScore,
    maxScore: 2,
    notes: !hasH1 ? 'Missing H1 heading' : headingCount < 3 ? 'Limited heading structure' : undefined
  });

  // Layout structure (0-2)
  const sectionCount = dom.sections.length;
  const layoutScore = sectionCount >= 4 ? 2 : sectionCount >= 2 ? 1 : 0;
  factors.push({
    name: 'Layout Structure',
    score: layoutScore,
    maxScore: 2,
    notes: sectionCount < 2 ? 'Minimal page structure' : undefined
  });

  // Modern CSS features (0-2)
  const hasGrid = styles.layout.hasGrid;
  const hasFlex = styles.layout.hasFlex;
  const modernScore = hasGrid && hasFlex ? 2 : hasGrid || hasFlex ? 1 : 0;
  factors.push({
    name: 'Modern CSS',
    score: modernScore,
    maxScore: 2,
    notes: !hasGrid && !hasFlex ? 'No modern layout techniques' : undefined
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

  return {
    score: Math.round((totalScore / maxScore) * 10),
    factors
  };
}

function scoreMobile(manifest: WebsiteManifest): ScoreCategory {
  const factors: ScoreFactor[] = [];
  const { styles } = manifest;

  // Responsive design (0-3)
  const responsiveScore = styles.layout.responsive ? 3 : 0;
  factors.push({
    name: 'Responsive Design',
    score: responsiveScore,
    maxScore: 3,
    notes: !styles.layout.responsive ? 'No responsive breakpoints found' : undefined
  });

  // Flexbox/Grid (0-2)
  const layoutScore = styles.layout.hasGrid || styles.layout.hasFlex ? 2 : 0;
  factors.push({
    name: 'Flexible Layout',
    score: layoutScore,
    maxScore: 2,
    notes: !styles.layout.hasGrid && !styles.layout.hasFlex ? 'No flexible layout system' : undefined
  });

  // Max-width constraint (0-2)
  const hasMaxWidth = !!styles.layout.maxWidth;
  factors.push({
    name: 'Content Width',
    score: hasMaxWidth ? 2 : 0,
    maxScore: 2,
    notes: !hasMaxWidth ? 'No max-width constraint' : undefined
  });

  // Font scaling (0-3) - checking for relative units would require deeper analysis
  // For now, assume modern sites use relative units
  factors.push({
    name: 'Font Scaling',
    score: 2,
    maxScore: 3,
    notes: 'Assumed relative units'
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

  return {
    score: Math.round((totalScore / maxScore) * 10),
    factors
  };
}

function scorePerformance(manifest: WebsiteManifest): ScoreCategory {
  const factors: ScoreFactor[] = [];
  const { dom, styles } = manifest;

  // Image optimization (0-3)
  const imageCount = dom.images.length;
  const imagesWithAlt = dom.images.filter(img => img.alt).length;
  const altRatio = imageCount > 0 ? imagesWithAlt / imageCount : 1;
  factors.push({
    name: 'Image Optimization',
    score: Math.round(altRatio * 3),
    maxScore: 3,
    notes: altRatio < 0.5 ? 'Many images missing alt text' : undefined
  });

  // External resources (0-2) - fewer is generally better
  const externalFontScore = styles.fonts.families.length <= 2 ? 2 : 1;
  factors.push({
    name: 'External Resources',
    score: externalFontScore,
    maxScore: 2,
    notes: styles.fonts.families.length > 2 ? 'Multiple external fonts' : undefined
  });

  // Framework overhead (0-2)
  const frameworkCount = styles.framework.js.length;
  const frameworkScore = frameworkCount <= 1 ? 2 : frameworkCount <= 2 ? 1 : 0;
  factors.push({
    name: 'Framework Overhead',
    score: frameworkScore,
    maxScore: 2,
    notes: frameworkCount > 2 ? 'Multiple JS frameworks detected' : undefined
  });

  // Link count (0-3) - moderate number is ideal
  const linkCount = manifest.links.length;
  const linkScore = linkCount < 50 ? 3 : linkCount < 100 ? 2 : 1;
  factors.push({
    name: 'Page Complexity',
    score: linkScore,
    maxScore: 3,
    notes: linkCount > 100 ? 'Very high link count' : undefined
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

  return {
    score: Math.round((totalScore / maxScore) * 10),
    factors
  };
}

function scoreSEO(manifest: WebsiteManifest): ScoreCategory {
  const factors: ScoreFactor[] = [];
  const { dom, summary } = manifest;

  // Title tag (0-2)
  const hasTitle = summary.pageTitle && summary.pageTitle !== 'Untitled';
  const titleLength = summary.pageTitle?.length || 0;
  const titleScore = hasTitle && titleLength > 10 && titleLength < 70 ? 2 : hasTitle ? 1 : 0;
  factors.push({
    name: 'Title Tag',
    score: titleScore,
    maxScore: 2,
    notes: !hasTitle ? 'Missing title tag' : titleLength > 70 ? 'Title too long' : titleLength < 10 ? 'Title too short' : undefined
  });

  // Meta description (0-2)
  const hasDescription = !!summary.pageDescription;
  const descLength = summary.pageDescription?.length || 0;
  const descScore = hasDescription && descLength > 50 && descLength < 160 ? 2 : hasDescription ? 1 : 0;
  factors.push({
    name: 'Meta Description',
    score: descScore,
    maxScore: 2,
    notes: !hasDescription ? 'Missing meta description' : descLength > 160 ? 'Description too long' : descLength < 50 ? 'Description too short' : undefined
  });

  // Heading structure (0-3)
  const hasH1 = dom.headings.some(h => h.level === 1);
  const h1Count = dom.headings.filter(h => h.level === 1).length;
  const headingScore = hasH1 && h1Count === 1 ? 3 : hasH1 ? 2 : 0;
  factors.push({
    name: 'Heading Structure',
    score: headingScore,
    maxScore: 3,
    notes: !hasH1 ? 'Missing H1' : h1Count > 1 ? 'Multiple H1 tags' : undefined
  });

  // Image alt text (0-2)
  const imageCount = dom.images.length;
  const imagesWithAlt = dom.images.filter(img => img.alt).length;
  const altScore = imageCount === 0 ? 2 : imagesWithAlt === imageCount ? 2 : imagesWithAlt > imageCount / 2 ? 1 : 0;
  factors.push({
    name: 'Image Alt Text',
    score: altScore,
    maxScore: 2,
    notes: imageCount > 0 && imagesWithAlt < imageCount ? `${imageCount - imagesWithAlt} images missing alt text` : undefined
  });

  // Internal linking (0-1)
  const internalLinks = manifest.links.filter(l => {
    try {
      const url = new URL(l);
      const manifestUrl = new URL(manifest.url);
      return url.hostname === manifestUrl.hostname;
    } catch {
      return false;
    }
  });
  const linkScore = internalLinks.length >= 3 ? 1 : 0;
  factors.push({
    name: 'Internal Links',
    score: linkScore,
    maxScore: 1,
    notes: internalLinks.length < 3 ? 'Limited internal linking' : undefined
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

  return {
    score: Math.round((totalScore / maxScore) * 10),
    factors
  };
}

function generateRecommendations(
  manifest: WebsiteManifest,
  scores: { design: ScoreCategory; mobile: ScoreCategory; performance: ScoreCategory; seo: ScoreCategory }
): string[] {
  const recommendations: string[] = [];

  // Design recommendations
  if (scores.design.score < 6) {
    recommendations.push('Consider modernizing the visual design with better color contrast and typography');
  }

  // Mobile recommendations
  if (scores.mobile.score < 6) {
    recommendations.push('Improve mobile responsiveness with proper breakpoints and flexible layouts');
  }

  // Performance recommendations
  if (scores.performance.score < 6) {
    recommendations.push('Optimize images and reduce external resource loading for better performance');
  }

  // SEO recommendations
  if (scores.seo.score < 6) {
    if (!manifest.summary.pageDescription) {
      recommendations.push('Add a meta description to improve search visibility');
    }
    const missingAlt = manifest.dom.images.filter(img => !img.alt).length;
    if (missingAlt > 0) {
      recommendations.push(`Add alt text to ${missingAlt} images for better accessibility and SEO`);
    }
  }

  // General recommendations
  if (!manifest.styles.layout.responsive) {
    recommendations.push('Implement responsive design to improve mobile user experience');
  }

  if (manifest.dom.forms.length > 0 && !manifest.styles.framework.js.includes('React')) {
    recommendations.push('Consider adding form validation for better user experience');
  }

  return recommendations;
}

export function formatScoreReport(score: WebsiteScore, url: string): string {
  const stars = (n: number) => '★'.repeat(Math.round(n / 2)) + '☆'.repeat(5 - Math.round(n / 2));

  return `
╔══════════════════════════════════════════════════════════════╗
║                    WEBSITE SCORE REPORT                       ║
╠══════════════════════════════════════════════════════════════╣
║  URL: ${url.slice(0, 54).padEnd(54)}║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  OVERALL SCORE: ${score.overall}/10 ${stars(score.overall).padEnd(37)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Design:      ${score.design.score}/10 ${stars(score.design.score).padEnd(40)}║
║  Mobile:      ${score.mobile.score}/10 ${stars(score.mobile.score).padEnd(40)}║
║  Performance: ${score.performance.score}/10 ${stars(score.performance.score).padEnd(40)}║
║  SEO:         ${score.seo.score}/10 ${stars(score.seo.score).padEnd(40)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  RECOMMENDATIONS:                                            ║
${score.recommendations.slice(0, 4).map(r => `║  • ${r.slice(0, 56).padEnd(56)}║`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
`;
}
