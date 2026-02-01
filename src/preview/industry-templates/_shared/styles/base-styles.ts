/**
 * Base CSS Styles for Industry Templates
 *
 * Provides reusable CSS blocks that can be composed into templates.
 */

import { ColorPalette } from '../../../../overnight/types';

/**
 * Generate CSS variables from a color palette
 */
export function generateColorVariables(palette: ColorPalette): string {
  return `
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
      --white: #ffffff;
      --black: #000000;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --success: #22c55e;
      --warning: #f59e0b;
      --error: #ef4444;
    }
  `;
}

/**
 * CSS Reset and base styles
 */
export const CSS_RESET = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--background);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  ul, ol {
    list-style: none;
  }
`;

/**
 * Common layout utilities
 */
export const CSS_UTILITIES = `
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .container-sm {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .container-lg {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-1 { gap: 4px; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .gap-6 { gap: 24px; }
  .gap-8 { gap: 32px; }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .font-extrabold { font-weight: 800; }
`;

/**
 * Section header styles
 */
export const CSS_SECTION_HEADER = `
  .section-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .section-header h2 {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 12px;
    color: var(--text);
  }

  .section-header p {
    color: var(--muted);
    font-size: 18px;
    max-width: 600px;
    margin: 0 auto;
  }

  .section-label {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    margin-bottom: 12px;
  }
`;

/**
 * Button styles
 */
export const CSS_BUTTONS = `
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
  }

  .btn-primary {
    background: var(--primary);
    color: var(--white);
  }

  .btn-primary:hover {
    background: var(--secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-secondary {
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
  }

  .btn-secondary:hover {
    background: var(--primary);
    color: var(--white);
  }

  .btn-white {
    background: var(--white);
    color: var(--primary);
  }

  .btn-white:hover {
    background: var(--gray-100);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-lg {
    padding: 16px 32px;
    font-size: 18px;
  }

  .btn-sm {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

/**
 * Card styles
 */
export const CSS_CARDS = `
  .card {
    background: var(--white);
    border-radius: 12px;
    padding: 32px;
    border: 1px solid var(--gray-200);
    transition: all 0.2s ease;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }

  .card-icon {
    width: 56px;
    height: 56px;
    background: var(--primary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 24px;
    color: var(--white);
  }

  .card h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .card p {
    color: var(--muted);
    font-size: 15px;
  }
`;

/**
 * Form styles
 */
export const CSS_FORMS = `
  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text);
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid var(--gray-200);
    border-radius: 8px;
    font-size: 15px;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: var(--white);
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
`;

/**
 * Grid layouts
 */
export const CSS_GRIDS = `
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .grid-auto {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }

  @media (max-width: 1024px) {
    .grid-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .grid-2,
    .grid-3,
    .grid-4 {
      grid-template-columns: 1fr;
    }
  }
`;

/**
 * Preview banner for generated sites
 */
export const CSS_PREVIEW_BANNER = `
  .preview-banner {
    background: var(--primary);
    color: var(--white);
    text-align: center;
    padding: 10px;
    font-size: 13px;
  }

  .preview-banner a {
    color: var(--white);
    font-weight: 600;
    text-decoration: underline;
  }

  .preview-banner a:hover {
    opacity: 0.9;
  }
`;

/**
 * Responsive breakpoints and mobile styles
 */
export const CSS_RESPONSIVE = `
  @media (max-width: 1024px) {
    .section-header h2 {
      font-size: 32px;
    }
  }

  @media (max-width: 768px) {
    .section-header h2 {
      font-size: 28px;
    }

    .section-header p {
      font-size: 16px;
    }

    .container {
      padding: 0 16px;
    }
  }

  @media (max-width: 480px) {
    .section-header h2 {
      font-size: 24px;
    }

    .btn {
      width: 100%;
    }

    .btn + .btn {
      margin-top: 12px;
    }
  }
`;

/**
 * Combine all base styles
 */
export function generateBaseStyles(palette: ColorPalette): string {
  return `
    ${generateColorVariables(palette)}
    ${CSS_RESET}
    ${CSS_UTILITIES}
    ${CSS_SECTION_HEADER}
    ${CSS_BUTTONS}
    ${CSS_CARDS}
    ${CSS_FORMS}
    ${CSS_GRIDS}
    ${CSS_PREVIEW_BANNER}
    ${CSS_RESPONSIVE}
  `;
}
