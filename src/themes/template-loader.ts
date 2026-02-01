/**
 * Template Loader Utility
 * 
 * Provides utilities for loading and populating standalone HTML templates
 * with variable placeholders.
 * 
 * console.log('src/themes/template-loader.ts: Template loader utility initialized');
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a template file from the templates directory
 * @param templateName Name of the template file (without .html extension)
 * @returns Template content as string
 */
export function loadTemplate(templateName: string): string {
  console.log(`src/themes/template-loader.ts: Loading template: ${templateName}`);
  
  const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  
  const content = fs.readFileSync(templatePath, 'utf-8');
  console.log(`src/themes/template-loader.ts: Template loaded successfully (${content.length} bytes)`);
  
  return content;
}

/**
 * Populate a template with variables
 * Supports both {{VARIABLE}} and {{#if VARIABLE}}...{{/if}} syntax
 * @param template Template content string
 * @param variables Object with variable values
 * @returns Populated template string
 */
export function populateTemplate(
  template: string,
  variables: Record<string, string | boolean | undefined>
): string {
  console.log('src/themes/template-loader.ts: Populating template with variables');
  
  let result = template;
  
  // Replace simple variables {{VARIABLE}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const replacement = value !== undefined && value !== null ? String(value) : '';
    result = result.replace(regex, replacement);
  }
  
  // Handle conditional blocks {{#if VARIABLE}}...{{/if}}
  result = processConditionals(result, variables);
  
  console.log('src/themes/template-loader.ts: Template populated successfully');
  
  return result;
}

/**
 * Process conditional blocks in template
 * @param template Template content
 * @param variables Variable values
 * @returns Template with conditionals processed
 */
function processConditionals(
  template: string,
  variables: Record<string, string | boolean | undefined>
): string {
  console.log('src/themes/template-loader.ts: Processing conditional blocks');
  
  let result = template;
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName];
    // Truthy check: non-empty string, true boolean, or truthy value
    const isTruthy = value !== undefined && value !== null && value !== false && value !== '';
    
    return isTruthy ? content : '';
  });
  
  return result;
}

/**
 * Extract all variables from a template
 * Returns both simple variables and conditional variables
 * @param template Template content
 * @returns Array of variable names found in template
 */
export function getTemplateVariables(template: string): string[] {
  console.log('src/themes/template-loader.ts: Extracting template variables');
  
  const variables = new Set<string>();
  
  // Extract simple variables {{VARIABLE}}
  const simpleVarRegex = /{{(\w+)}}/g;
  let match;
  while ((match = simpleVarRegex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  
  // Extract conditional variables {{#if VARIABLE}}
  const conditionalRegex = /{{#if\s+(\w+)}}/g;
  while ((match = conditionalRegex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  
  const varArray = Array.from(variables);
  console.log(`src/themes/template-loader.ts: Found ${varArray.length} unique variables`);
  
  return varArray;
}

/**
 * Load and populate a template in one step
 * @param templateName Name of the template file
 * @param variables Variable values
 * @returns Populated template string
 */
export function loadAndPopulateTemplate(
  templateName: string,
  variables: Record<string, string | boolean | undefined>
): string {
  console.log(`src/themes/template-loader.ts: Loading and populating template: ${templateName}`);
  
  const template = loadTemplate(templateName);
  return populateTemplate(template, variables);
}

/**
 * Get list of available templates
 * @returns Array of template names (without .html extension)
 */
export function getAvailableTemplates(): string[] {
  console.log('src/themes/template-loader.ts: Listing available templates');
  
  const templatesDir = path.join(process.cwd(), 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.log('src/themes/template-loader.ts: Templates directory not found');
    return [];
  }
  
  const files = fs.readdirSync(templatesDir);
  const templates = files
    .filter(file => file.endsWith('.html'))
    .map(file => file.replace('.html', ''));
  
  console.log(`src/themes/template-loader.ts: Found ${templates.length} templates`);
  
  return templates;
}

/**
 * Validate that all required variables are provided
 * @param template Template content
 * @param variables Provided variables
 * @returns Object with missing variables and warnings
 */
export function validateTemplateVariables(
  template: string,
  variables: Record<string, string | boolean | undefined>
): { missing: string[]; warnings: string[] } {
  console.log('src/themes/template-loader.ts: Validating template variables');
  
  const required = getTemplateVariables(template);
  const provided = Object.keys(variables);
  const missing = required.filter(v => !provided.includes(v));
  const warnings: string[] = [];
  
  // Check for variables that are provided but not used
  const unused = provided.filter(v => !required.includes(v));
  if (unused.length > 0) {
    warnings.push(`Unused variables: ${unused.join(', ')}`);
  }
  
  console.log(`src/themes/template-loader.ts: Validation complete - ${missing.length} missing, ${warnings.length} warnings`);
  
  return { missing, warnings };
}
