export interface StyleAnalysis {
  colors: ColorPalette;
  fonts: FontInfo;
  framework: FrameworkDetection;
  layout: LayoutInfo;
}

export interface ColorPalette {
  primary: string[];
  background: string[];
  text: string[];
  accent: string[];
}

export interface FontInfo {
  families: string[];
  headingFont?: string;
  bodyFont?: string;
}

export interface FrameworkDetection {
  css: string[];
  js: string[];
}

export interface LayoutInfo {
  hasGrid: boolean;
  hasFlex: boolean;
  maxWidth?: string;
  responsive: boolean;
}

export function analyzeStyles(html: string): StyleAnalysis {
  const colors = extractColors(html);
  const fonts = extractFonts(html);
  const framework = detectFramework(html);
  const layout = analyzeLayout(html);

  return {
    colors,
    fonts,
    framework,
    layout
  };
}

function extractColors(html: string): ColorPalette {
  const colors: ColorPalette = {
    primary: [],
    background: [],
    text: [],
    accent: []
  };

  // Extract hex colors
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  let match;
  const allColors: string[] = [];

  while ((match = hexRegex.exec(html)) !== null) {
    const color = `#${match[1]}`;
    if (!allColors.includes(color)) {
      allColors.push(color);
    }
  }

  // Extract rgb/rgba colors
  const rgbRegex = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
  while ((match = rgbRegex.exec(html)) !== null) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    if (!allColors.includes(hex)) {
      allColors.push(hex);
    }
  }

  // Categorize colors by lightness
  for (const color of allColors.slice(0, 20)) {
    const lightness = getColorLightness(color);
    if (lightness > 0.9) {
      colors.background.push(color);
    } else if (lightness < 0.2) {
      colors.text.push(color);
    } else if (isAccentColor(color)) {
      colors.accent.push(color);
    } else {
      colors.primary.push(color);
    }
  }

  // Ensure we have at least some defaults
  if (colors.primary.length === 0) colors.primary.push('#3b82f6');
  if (colors.background.length === 0) colors.background.push('#ffffff');
  if (colors.text.length === 0) colors.text.push('#1f2937');
  if (colors.accent.length === 0) colors.accent.push('#8b5cf6');

  return colors;
}

function getColorLightness(hex: string): number {
  const color = hex.replace('#', '');
  let r: number, g: number, b: number;

  if (color.length === 3) {
    r = parseInt(color[0] + color[0], 16) / 255;
    g = parseInt(color[1] + color[1], 16) / 255;
    b = parseInt(color[2] + color[2], 16) / 255;
  } else {
    r = parseInt(color.slice(0, 2), 16) / 255;
    g = parseInt(color.slice(2, 4), 16) / 255;
    b = parseInt(color.slice(4, 6), 16) / 255;
  }

  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

function isAccentColor(hex: string): boolean {
  const color = hex.replace('#', '');
  let r: number, g: number, b: number;

  if (color.length === 3) {
    r = parseInt(color[0] + color[0], 16);
    g = parseInt(color[1] + color[1], 16);
    b = parseInt(color[2] + color[2], 16);
  } else {
    r = parseInt(color.slice(0, 2), 16);
    g = parseInt(color.slice(2, 4), 16);
    b = parseInt(color.slice(4, 6), 16);
  }

  // High saturation colors are likely accents
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  return saturation > 0.5;
}

function extractFonts(html: string): FontInfo {
  const fonts: FontInfo = {
    families: []
  };

  // Extract from font-family declarations
  const fontFamilyRegex = /font-family\s*:\s*([^;}"']+)/gi;
  let match;

  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const families = match[1].split(',').map(f => f.trim().replace(/["']/g, ''));
    for (const family of families) {
      if (family && !fonts.families.includes(family) && !isGenericFont(family)) {
        fonts.families.push(family);
      }
    }
  }

  // Extract from Google Fonts links
  const googleFontsRegex = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/g;
  while ((match = googleFontsRegex.exec(html)) !== null) {
    const fontName = decodeURIComponent(match[1]).split(':')[0].replace(/\+/g, ' ');
    if (!fonts.families.includes(fontName)) {
      fonts.families.push(fontName);
    }
  }

  // Set heading and body fonts
  if (fonts.families.length > 0) {
    fonts.headingFont = fonts.families[0];
    fonts.bodyFont = fonts.families.length > 1 ? fonts.families[1] : fonts.families[0];
  } else {
    fonts.families = ['Inter', 'system-ui'];
    fonts.headingFont = 'Inter';
    fonts.bodyFont = 'system-ui';
  }

  return fonts;
}

function isGenericFont(font: string): boolean {
  const generic = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial'];
  return generic.includes(font.toLowerCase());
}

function detectFramework(html: string): FrameworkDetection {
  const framework: FrameworkDetection = {
    css: [],
    js: []
  };

  // CSS frameworks
  if (/tailwind|tw-/i.test(html)) framework.css.push('Tailwind CSS');
  if (/bootstrap/i.test(html)) framework.css.push('Bootstrap');
  if (/bulma/i.test(html)) framework.css.push('Bulma');
  if (/foundation/i.test(html)) framework.css.push('Foundation');
  if (/materialize/i.test(html)) framework.css.push('Materialize');

  // JS frameworks
  if (/react|__NEXT/i.test(html)) framework.js.push('React');
  if (/vue|__VUE/i.test(html)) framework.js.push('Vue');
  if (/angular|ng-/i.test(html)) framework.js.push('Angular');
  if (/svelte/i.test(html)) framework.js.push('Svelte');
  if (/jquery|jQuery/i.test(html)) framework.js.push('jQuery');

  return framework;
}

function analyzeLayout(html: string): LayoutInfo {
  return {
    hasGrid: /display\s*:\s*grid|grid-template/i.test(html),
    hasFlex: /display\s*:\s*flex|flex-direction/i.test(html),
    maxWidth: extractMaxWidth(html),
    responsive: /@media|viewport/i.test(html)
  };
}

function extractMaxWidth(html: string): string | undefined {
  const match = html.match(/max-width\s*:\s*(\d+(?:px|rem|em|%))/i);
  return match?.[1];
}
