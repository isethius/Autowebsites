export interface DOMExtraction {
  sections: Section[];
  images: ImageInfo[];
  navigation: NavItem[];
  forms: FormInfo[];
  headings: HeadingInfo[];
  metadata: PageMetadata;
}

export interface Section {
  tag: string;
  id?: string;
  className?: string;
  text: string;
  children: number;
}

export interface ImageInfo {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface NavItem {
  text: string;
  href: string;
  level: number;
}

export interface FormInfo {
  id?: string;
  action?: string;
  method?: string;
  fields: FormField[];
}

export interface FormField {
  type: string;
  name?: string;
  placeholder?: string;
  required: boolean;
}

export interface HeadingInfo {
  level: number;
  text: string;
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export function extractDOM(html: string): DOMExtraction {
  // Parse sections
  const sections = extractSections(html);
  const images = extractImages(html);
  const navigation = extractNavigation(html);
  const forms = extractForms(html);
  const headings = extractHeadings(html);
  const metadata = extractMetadata(html);

  return {
    sections,
    images,
    navigation,
    forms,
    headings,
    metadata
  };
}

function extractSections(html: string): Section[] {
  const sections: Section[] = [];
  const sectionTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];

  for (const tag of sectionTags) {
    const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const attrs = match[1] || '';
      const content = match[2] || '';

      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      const classMatch = attrs.match(/class=["']([^"']+)["']/);

      // Strip HTML tags for text content
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

      sections.push({
        tag,
        id: idMatch?.[1],
        className: classMatch?.[1],
        text,
        children: (content.match(/<[a-z]/gi) || []).length
      });
    }
  }

  return sections;
}

function extractImages(html: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imgRegex = /<img([^>]+)>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/);
    const altMatch = attrs.match(/alt=["']([^"']+)["']/);
    const widthMatch = attrs.match(/width=["']?(\d+)["']?/);
    const heightMatch = attrs.match(/height=["']?(\d+)["']?/);

    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch?.[1] || '',
        width: widthMatch ? parseInt(widthMatch[1]) : undefined,
        height: heightMatch ? parseInt(heightMatch[1]) : undefined
      });
    }
  }

  return images;
}

function extractNavigation(html: string): NavItem[] {
  const navItems: NavItem[] = [];

  // Extract nav element content
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  if (navMatch) {
    const navContent = navMatch[1];
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)</gi;
    let match;

    while ((match = linkRegex.exec(navContent)) !== null) {
      const href = match[1];
      const text = match[2].trim();
      if (text && href) {
        navItems.push({ text, href, level: 1 });
      }
    }
  }

  return navItems;
}

function extractForms(html: string): FormInfo[] {
  const forms: FormInfo[] = [];
  const formRegex = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
  let match;

  while ((match = formRegex.exec(html)) !== null) {
    const attrs = match[1];
    const content = match[2];

    const idMatch = attrs.match(/id=["']([^"']+)["']/);
    const actionMatch = attrs.match(/action=["']([^"']+)["']/);
    const methodMatch = attrs.match(/method=["']([^"']+)["']/i);

    const fields: FormField[] = [];
    const inputRegex = /<input([^>]+)>/gi;
    let inputMatch;

    while ((inputMatch = inputRegex.exec(content)) !== null) {
      const inputAttrs = inputMatch[1];
      const typeMatch = inputAttrs.match(/type=["']([^"']+)["']/);
      const nameMatch = inputAttrs.match(/name=["']([^"']+)["']/);
      const placeholderMatch = inputAttrs.match(/placeholder=["']([^"']+)["']/);
      const required = /required/i.test(inputAttrs);

      fields.push({
        type: typeMatch?.[1] || 'text',
        name: nameMatch?.[1],
        placeholder: placeholderMatch?.[1],
        required
      });
    }

    forms.push({
      id: idMatch?.[1],
      action: actionMatch?.[1],
      method: methodMatch?.[1],
      fields
    });
  }

  return forms;
}

function extractHeadings(html: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const headingRegex = /<h([1-6])[^>]*>([^<]*)</gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].trim();
    if (text) {
      headings.push({ level, text });
    }
  }

  return headings;
}

function extractMetadata(html: string): PageMetadata {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

  return {
    title: titleMatch?.[1]?.trim() || 'Untitled',
    description: descMatch?.[1],
    keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()),
    ogImage: ogImageMatch?.[1]
  };
}
