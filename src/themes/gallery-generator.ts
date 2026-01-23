import * as fs from 'fs';
import * as path from 'path';
import { GeneratedTheme } from './theme-generator';

export interface GalleryOptions {
  outputDir: string;
  title?: string;
  originalUrl?: string;
}

export function generateGallery(themes: GeneratedTheme[], options: GalleryOptions): string {
  const { outputDir, title = 'Theme Gallery', originalUrl } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write individual theme files
  for (const theme of themes) {
    const themeFilename = `${theme.id}.html`;
    const themePath = path.join(outputDir, themeFilename);
    fs.writeFileSync(themePath, theme.html);
    console.log(`✓ Generated: ${themeFilename}`);
  }

  // Generate gallery index
  const galleryHtml = generateGalleryHTML(themes, title, originalUrl);
  const indexPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(indexPath, galleryHtml);
  console.log(`✓ Generated: index.html (gallery)`);

  return indexPath;
}

function generateGalleryHTML(themes: GeneratedTheme[], title: string, originalUrl?: string): string {
  const themeCards = themes.map(theme => {
    const dnaString = `${theme.dna.hero}-${theme.dna.layout}-${theme.dna.color}-${theme.dna.nav}-${theme.dna.design}`;
    return `
        <div class="theme-card">
          <div class="theme-preview">
            <iframe src="${theme.id}.html" loading="lazy"></iframe>
          </div>
          <div class="theme-info">
            <h3>${theme.name}</h3>
            <p class="dna-code">${dnaString}</p>
            <a href="${theme.id}.html" class="view-btn" target="_blank">View Full Theme →</a>
          </div>
        </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
    }

    .header {
      text-align: center;
      padding: 60px 20px 40px;
    }

    .header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      font-size: 1.25rem;
      opacity: 0.8;
      max-width: 600px;
      margin: 0 auto;
    }

    ${originalUrl ? `
    .original-link {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #fff;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .original-link:hover {
      background: rgba(255,255,255,0.2);
    }
    ` : ''}

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      padding: 40px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .theme-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .theme-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .theme-preview {
      position: relative;
      width: 100%;
      height: 280px;
      overflow: hidden;
      background: #fff;
    }

    .theme-preview iframe {
      width: 200%;
      height: 200%;
      transform: scale(0.5);
      transform-origin: top left;
      border: none;
      pointer-events: none;
    }

    .theme-info {
      padding: 20px;
    }

    .theme-info h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .dna-code {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 16px;
    }

    .view-btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: opacity 0.2s, transform 0.2s;
    }

    .view-btn:hover {
      opacity: 0.9;
      transform: translateX(4px);
    }

    .footer {
      text-align: center;
      padding: 40px 20px 60px;
      opacity: 0.6;
      font-size: 0.9rem;
    }

    @media (max-width: 480px) {
      .gallery {
        grid-template-columns: 1fr;
        padding: 20px;
      }

      .header h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>${title}</h1>
    <p>Explore ${themes.length} unique theme variations generated from DNA-based design system.</p>
    ${originalUrl ? `<a href="${originalUrl}" class="original-link" target="_blank">View Original Site →</a>` : ''}
  </header>

  <div class="gallery">
    ${themeCards}
  </div>

  <footer class="footer">
    <p>Generated by AutoWebsites • DNA-based Theme System</p>
    <p style="margin-top: 8px;">Each theme uses a unique combination: Hero (H) × Layout (L) × Color (C) × Nav (N) × Design (D)</p>
  </footer>
</body>
</html>`;
}

export function saveThemesToDisk(themes: GeneratedTheme[], outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const theme of themes) {
    const themeDir = path.join(outputDir, theme.id);
    if (!fs.existsSync(themeDir)) {
      fs.mkdirSync(themeDir, { recursive: true });
    }

    // Save HTML
    fs.writeFileSync(path.join(themeDir, 'index.html'), theme.html);

    // Save CSS separately
    fs.writeFileSync(path.join(themeDir, 'styles.css'), theme.css);

    // Save metadata
    fs.writeFileSync(path.join(themeDir, 'meta.json'), JSON.stringify({
      id: theme.id,
      name: theme.name,
      dna: theme.dna
    }, null, 2));
  }
}
