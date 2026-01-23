import { Lead } from './lead-database';
import { WebsiteScore } from './website-scorer';

export interface EmailTemplate {
  subject: string;
  body: string;
  html?: string;
}

export interface EmailOptions {
  lead: Lead;
  score?: WebsiteScore;
  previewUrl: string;
  senderName?: string;
  senderCompany?: string;
}

export function generateEmail(options: EmailOptions): EmailTemplate {
  const {
    lead,
    score,
    previewUrl,
    senderName = 'Alex',
    senderCompany = 'WebDesign Pro'
  } = options;

  const businessName = lead.business_name || extractBusinessName(lead.website_url);
  const firstName = extractFirstName(lead.email);

  // Determine the main improvement area
  const improvementArea = score ? getMainImprovementArea(score) : 'design';
  const improvementMessage = getImprovementMessage(improvementArea, score);

  const subject = generateSubject(businessName, score);
  const body = generatePlainText(
    businessName,
    firstName,
    previewUrl,
    improvementMessage,
    senderName,
    senderCompany
  );
  const html = generateHTML(
    businessName,
    firstName,
    previewUrl,
    improvementMessage,
    senderName,
    senderCompany,
    score
  );

  return { subject, body, html };
}

function extractBusinessName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. and TLD
    const name = hostname.replace(/^www\./, '').split('.')[0];
    // Capitalize
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'your business';
  }
}

function extractFirstName(email?: string): string | null {
  if (!email) return null;
  const localPart = email.split('@')[0];
  // Try to extract first name from common patterns
  const match = localPart.match(/^([a-z]+)/i);
  if (match && match[1].length > 2) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  }
  return null;
}

function getMainImprovementArea(score: WebsiteScore): string {
  const areas = [
    { name: 'mobile', score: score.mobile.score },
    { name: 'design', score: score.design.score },
    { name: 'performance', score: score.performance.score },
    { name: 'seo', score: score.seo.score }
  ];

  areas.sort((a, b) => a.score - b.score);
  return areas[0].name;
}

function getImprovementMessage(area: string, score?: WebsiteScore): string {
  const messages: Record<string, string> = {
    mobile: 'With over 60% of web traffic now coming from mobile devices, a mobile-optimized design can significantly increase your conversions.',
    design: 'A fresh, modern design can increase visitor trust and engagement by up to 94%.',
    performance: 'Faster loading times can reduce bounce rates by up to 32% and improve your search rankings.',
    seo: 'Better SEO optimization can help more potential customers find your business online.'
  };

  return messages[area] || messages.design;
}

function generateSubject(businessName: string, score?: WebsiteScore): string {
  const subjects = [
    `Quick idea for ${businessName}'s website`,
    `I created something for ${businessName}`,
    `Free website refresh preview for ${businessName}`,
    `Saw ${businessName}'s site - had some ideas`
  ];

  // Pick based on score if available
  if (score && score.overall < 5) {
    return `${businessName} - Quick website improvement opportunity`;
  }

  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generatePlainText(
  businessName: string,
  firstName: string | null,
  previewUrl: string,
  improvementMessage: string,
  senderName: string,
  senderCompany: string
): string {
  const greeting = firstName ? `Hi ${firstName},` : `Hi there,`;

  return `${greeting}

I came across ${businessName}'s website and noticed some opportunities to make it even better.

${improvementMessage}

I put together a quick preview of what a refreshed version could look like:
${previewUrl}

I created 10 different design variations for you to browse - no strings attached. If any of them catch your eye, I'd love to chat about bringing it to life.

What do you think?

Best,
${senderName}
${senderCompany}

P.S. These previews are free and yours to keep regardless. I just love helping local businesses look their best online.`;
}

function generateHTML(
  businessName: string,
  firstName: string | null,
  previewUrl: string,
  improvementMessage: string,
  senderName: string,
  senderCompany: string,
  score?: WebsiteScore
): string {
  const greeting = firstName ? `Hi ${firstName},` : `Hi there,`;

  const scoreSection = score ? `
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">Current Website Analysis:</p>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${getScoreColor(score.design.score)};">${score.design.score}/10</div>
          <div style="font-size: 12px; color: #6b7280;">Design</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${getScoreColor(score.mobile.score)};">${score.mobile.score}/10</div>
          <div style="font-size: 12px; color: #6b7280;">Mobile</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${getScoreColor(score.performance.score)};">${score.performance.score}/10</div>
          <div style="font-size: 12px; color: #6b7280;">Speed</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: ${getScoreColor(score.seo.score)};">${score.seo.score}/10</div>
          <div style="font-size: 12px; color: #6b7280;">SEO</div>
        </div>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p style="margin-bottom: 16px;">${greeting}</p>

  <p style="margin-bottom: 16px;">I came across <strong>${businessName}</strong>'s website and noticed some opportunities to make it even better.</p>

  <p style="margin-bottom: 16px;">${improvementMessage}</p>

  ${scoreSection}

  <p style="margin-bottom: 16px;">I put together a quick preview of what a refreshed version could look like:</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="${previewUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Your Preview Gallery →</a>
  </div>

  <p style="margin-bottom: 16px;">I created <strong>10 different design variations</strong> for you to browse - no strings attached. If any of them catch your eye, I'd love to chat about bringing it to life.</p>

  <p style="margin-bottom: 16px;">What do you think?</p>

  <p style="margin-bottom: 4px;">Best,</p>
  <p style="margin-bottom: 4px;"><strong>${senderName}</strong></p>
  <p style="color: #6b7280; font-size: 14px;">${senderCompany}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

  <p style="font-size: 13px; color: #9ca3af;">P.S. These previews are free and yours to keep regardless. I just love helping local businesses look their best online.</p>
</body>
</html>`;
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#f59e0b';
  return '#ef4444';
}

export function generateFollowUpEmail(options: EmailOptions, attempt: number): EmailTemplate {
  const { lead, previewUrl, senderName = 'Alex' } = options;
  const businessName = lead.business_name || extractBusinessName(lead.website_url);

  const subjects = [
    `Quick follow-up - ${businessName} website designs`,
    `Did you see the ${businessName} previews?`,
    `Last chance - ${businessName} website mockups`
  ];

  const bodies = [
    `Hi again,

Just wanted to make sure you saw the website previews I created for ${businessName}:
${previewUrl}

Let me know if you have any questions!

${senderName}`,

    `Hi,

I hope this finds you well! I created those website designs for ${businessName} a few days ago and wanted to see if you had a chance to look at them:
${previewUrl}

Would love to hear your thoughts.

${senderName}`,

    `Hi,

This will be my last note about this - I completely understand you're busy!

If you're ever interested in refreshing ${businessName}'s website, the previews are still available here:
${previewUrl}

Wishing you all the best,
${senderName}`
  ];

  const index = Math.min(attempt - 1, subjects.length - 1);

  return {
    subject: subjects[index],
    body: bodies[index]
  };
}
