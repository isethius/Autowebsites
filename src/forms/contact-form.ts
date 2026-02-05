/**
 * Contact Form utilities
 * - Provider-ready attributes and hidden fields
 * - Honeypot anti-spam
 * - Validation and submission (Formspree, Netlify, or mailto)
 */

export type ContactFormProvider = 'formspree' | 'netlify' | 'email';

export type ContactFormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'hidden';

export interface ContactFormField {
  name: string;
  label?: string;
  type?: ContactFormFieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
}

export interface ContactFormHoneypotConfig {
  enabled?: boolean;
  fieldName?: string;
  label?: string;
  wrapperClass?: string;
  autocomplete?: string;
}

export interface ContactFormBaseConfig {
  action?: string;
  method?: 'POST' | 'GET';
  useAjax?: boolean;
  honeypot?: ContactFormHoneypotConfig | boolean;
  fields?: ContactFormField[];
  hiddenFields?: Record<string, string>;
  subject?: string;
  successMessage?: string;
  errorMessage?: string;
  spamMessage?: string;
  validationMessage?: string;
  pendingMessage?: string;
  redirectUrl?: string;
}

export interface FormspreeProviderConfig {
  provider: 'formspree';
  formId?: string;
  endpoint?: string;
}

export interface NetlifyProviderConfig {
  provider: 'netlify';
  formName?: string;
}

export interface EmailProviderConfig {
  provider: 'email';
  emailTo: string;
}

export type ContactFormConfig = ContactFormBaseConfig &
  (FormspreeProviderConfig | NetlifyProviderConfig | EmailProviderConfig);

export type ContactFormRuntimeConfig = ContactFormConfig & {
  selector?: string;
  statusSelector?: string;
  statusPlacement?: 'before' | 'after' | 'inside';
  validate?: boolean;
  showFieldErrors?: boolean;
  resetOnSuccess?: boolean;
  disableSubmit?: boolean;
  timeoutMs?: number;
  onSuccess?: (result: ContactFormSubmissionResult, form: HTMLFormElement) => void;
  onError?: (result: ContactFormSubmissionResult, form: HTMLFormElement) => void;
  onSpam?: (result: ContactFormSubmissionResult, form: HTMLFormElement) => void;
  onValidationError?: (result: ContactFormSubmissionResult, form: HTMLFormElement) => void;
};

export interface ContactFormMarkupParts {
  attributes: string;
  hiddenFields: string;
  honeypotField: string;
}

export interface ContactFormFieldError {
  name: string;
  message: string;
  element?: HTMLElement | null;
}

export interface ContactFormValidationResult {
  valid: boolean;
  errors: ContactFormFieldError[];
  values: Record<string, string>;
}

export type ContactFormSubmissionStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error'
  | 'spam'
  | 'validation';

export interface ContactFormSubmissionResult {
  ok: boolean;
  status: ContactFormSubmissionStatus;
  message?: string;
  statusCode?: number;
  errors?: ContactFormFieldError[];
}

export interface ContactFormController {
  form: HTMLFormElement;
  config: ContactFormRuntimeConfig;
  submit: () => Promise<ContactFormSubmissionResult>;
  destroy: () => void;
}

interface ResolvedHoneypotConfig {
  enabled: boolean;
  fieldName: string;
  label: string;
  wrapperClass: string;
  autocomplete: string;
}

type ResolvedBaseConfig = ContactFormConfig & {
  method: 'POST' | 'GET';
  useAjax: boolean;
  honeypot: ResolvedHoneypotConfig;
  formName?: string;
};

type ResolvedRuntimeConfig = ContactFormRuntimeConfig & {
  method: 'POST' | 'GET';
  useAjax: boolean;
  honeypot: ResolvedHoneypotConfig;
  formName?: string;
  statusPlacement: 'before' | 'after' | 'inside';
  validate: boolean;
  showFieldErrors: boolean;
  resetOnSuccess: boolean;
  disableSubmit: boolean;
  timeoutMs: number;
  successMessage: string;
  errorMessage: string;
  spamMessage: string;
  validationMessage: string;
  pendingMessage: string;
};

const DEFAULT_MESSAGES = {
  success: 'Thanks! Your message has been sent.',
  error: 'Sorry, something went wrong. Please try again.',
  spam: 'Thanks! We will be in touch soon.',
  validation: 'Please check the highlighted fields.',
  pending: 'Sending...',
};

const DEFAULT_HONEYPOT_LABEL = 'Leave this field empty';
const DEFAULT_HONEYPOT_WRAPPER_CLASS = 'contact-honeypot';
const DEFAULT_NETLIFY_FORM_NAME = 'contact';

export function buildContactFormAttributes(config: ContactFormConfig): Record<string, string | boolean> {
  const resolved = resolveBaseConfig(config);
  const action = resolveFormAction(resolved);

  const attrs: Record<string, string | boolean> = {
    method: resolved.method,
    'data-contact-form': 'true',
    'data-contact-provider': resolved.provider,
  };

  if (action) {
    attrs.action = action;
  }

  if (resolved.provider === 'netlify') {
    attrs['data-netlify'] = 'true';
    if (resolved.formName) {
      attrs.name = resolved.formName;
    }
    if (resolved.honeypot.enabled) {
      attrs['data-netlify-honeypot'] = resolved.honeypot.fieldName;
    }
  }

  if (resolved.provider === 'email') {
    attrs.enctype = 'text/plain';
  }

  return attrs;
}

export function serializeContactFormAttributes(config: ContactFormConfig): string {
  const attrs = buildContactFormAttributes(config);
  return serializeAttributes(attrs);
}

export function generateContactFormHiddenFields(config: ContactFormConfig): string {
  const resolved = resolveBaseConfig(config);
  const fields: Record<string, string> = { ...resolved.hiddenFields };

  if (resolved.provider === 'netlify') {
    const formName = resolved.formName || DEFAULT_NETLIFY_FORM_NAME;
    if (!fields['form-name']) {
      fields['form-name'] = formName;
    }
  }

  return Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(value)}">`)
    .join('\n');
}

export function generateHoneypotField(config: ContactFormConfig): string {
  const resolved = resolveBaseConfig(config);
  const honeypot = resolved.honeypot;

  if (!honeypot.enabled) return '';

  return [
    `<div class="${escapeAttribute(honeypot.wrapperClass)}" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;" aria-hidden="true">`,
    `  <label>${escapeHtml(honeypot.label)}`,
    `    <input type="text" name="${escapeAttribute(honeypot.fieldName)}" autocomplete="${escapeAttribute(honeypot.autocomplete)}" tabindex="-1">`,
    '  </label>',
    '</div>',
  ].join('\n');
}

export function buildContactFormMarkup(config: ContactFormConfig): ContactFormMarkupParts {
  return {
    attributes: serializeContactFormAttributes(config),
    hiddenFields: generateContactFormHiddenFields(config),
    honeypotField: generateHoneypotField(config),
  };
}

export function initContactForm(form: HTMLFormElement, config: ContactFormRuntimeConfig): ContactFormController {
  ensureBrowser();

  if (!form) {
    throw new Error('Contact form element is required.');
  }

  const resolved = resolveRuntimeConfig(config);

  if (resolved.honeypot.enabled) {
    ensureHoneypotField(form, resolved);
  }

  const handler = (event: Event) => {
    event.preventDefault();
    void submitContactForm(form, resolved);
  };

  form.addEventListener('submit', handler);

  return {
    form,
    config: resolved,
    submit: () => submitContactForm(form, resolved),
    destroy: () => form.removeEventListener('submit', handler),
  };
}

export function initContactForms(config: ContactFormRuntimeConfig): ContactFormController[] {
  ensureBrowser();

  const resolved = resolveRuntimeConfig(config);
  const selector = resolved.selector || 'form[data-contact-form]';
  const forms = Array.from(document.querySelectorAll(selector))
    .filter((el): el is HTMLFormElement => el instanceof HTMLFormElement);

  return forms.map(form => initContactForm(form, resolved));
}

export async function submitContactForm(form: HTMLFormElement, config: ContactFormRuntimeConfig): Promise<ContactFormSubmissionResult> {
  ensureBrowser();

  const resolved = resolveRuntimeConfig(config);

  clearFieldErrors(form);

  const configErrors = getConfigErrors(resolved);
  if (configErrors.length > 0) {
    const result: ContactFormSubmissionResult = {
      ok: false,
      status: 'error',
      message: configErrors[0],
    };
    setStatus(form, resolved, 'error', result.message || resolved.errorMessage);
    if (resolved.onError) {
      resolved.onError(result, form);
    }
    return result;
  }

  if (resolved.honeypot.enabled && isHoneypotTripped(form, resolved)) {
    const result: ContactFormSubmissionResult = {
      ok: true,
      status: 'spam',
      message: resolved.spamMessage,
    };
    setStatus(form, resolved, 'success', resolved.spamMessage);
    if (resolved.resetOnSuccess) {
      form.reset();
    }
    if (resolved.onSpam) {
      resolved.onSpam(result, form);
    }
    return result;
  }

  const validation = resolved.validate ? validateContactForm(form, resolved) : {
    valid: true,
    errors: [],
    values: extractFormValues(form, resolved),
  };

  if (!validation.valid) {
    if (resolved.showFieldErrors) {
      applyFieldErrors(form, validation.errors);
    }
    setStatus(form, resolved, 'validation', resolved.validationMessage);
    const result: ContactFormSubmissionResult = {
      ok: false,
      status: 'validation',
      message: resolved.validationMessage,
      errors: validation.errors,
    };
    if (resolved.onValidationError) {
      resolved.onValidationError(result, form);
    }
    return result;
  }

  if (!resolved.useAjax && resolved.provider !== 'email') {
    setStatus(form, resolved, 'pending', resolved.pendingMessage);
    if (resolved.disableSubmit) {
      setSubmitDisabled(form, true);
    }
    form.submit();
    return {
      ok: true,
      status: 'pending',
      message: resolved.pendingMessage,
    };
  }

  setStatus(form, resolved, 'pending', resolved.pendingMessage);
  if (resolved.disableSubmit) {
    setSubmitDisabled(form, true);
  }

  let result: ContactFormSubmissionResult;

  if (resolved.provider === 'email') {
    result = submitViaEmail(validation.values, resolved);
  } else if (resolved.provider === 'formspree') {
    result = await submitViaFormspree(form, resolved);
  } else {
    result = await submitViaNetlify(form, resolved);
  }

  if (resolved.disableSubmit) {
    setSubmitDisabled(form, false);
  }

  if (result.ok) {
    setStatus(form, resolved, 'success', resolved.successMessage);
    if (resolved.resetOnSuccess) {
      form.reset();
    }
    if (resolved.redirectUrl) {
      window.location.assign(resolved.redirectUrl);
    }
    if (resolved.onSuccess) {
      resolved.onSuccess(result, form);
    }
  } else {
    setStatus(form, resolved, 'error', result.message || resolved.errorMessage);
    if (resolved.onError) {
      resolved.onError(result, form);
    }
  }

  return result;
}

export function validateContactForm(form: HTMLFormElement, config: ContactFormRuntimeConfig): ContactFormValidationResult {
  const resolved = resolveRuntimeConfig(config);
  const values = extractFormValues(form, resolved);
  const fields = resolveFieldConfigs(form, resolved);

  const errors: ContactFormFieldError[] = [];

  for (const field of fields) {
    const value = values[field.name] || '';
    const trimmed = value.trim();
    const label = field.label || humanizeFieldName(field.name);

    if (field.required) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (!hasCheckedValue(form, field.name)) {
          errors.push({ name: field.name, message: `${label} is required`, element: findFieldElement(form, field.name) });
          continue;
        }
      } else if (!trimmed) {
        errors.push({ name: field.name, message: `${label} is required`, element: findFieldElement(form, field.name) });
        continue;
      }
    }

    if (!trimmed) {
      continue;
    }

    if (field.type === 'email' || isEmailField(field)) {
      if (!isValidEmail(trimmed)) {
        errors.push({ name: field.name, message: 'Please enter a valid email address', element: findFieldElement(form, field.name) });
        continue;
      }
    }

    if (field.type === 'tel' || isPhoneField(field)) {
      if (!isValidPhone(trimmed)) {
        errors.push({ name: field.name, message: 'Please enter a valid phone number', element: findFieldElement(form, field.name) });
        continue;
      }
    }

    if (typeof field.minLength === 'number' && trimmed.length < field.minLength) {
      errors.push({
        name: field.name,
        message: `${label} must be at least ${field.minLength} characters`,
        element: findFieldElement(form, field.name),
      });
      continue;
    }

    if (typeof field.maxLength === 'number' && trimmed.length > field.maxLength) {
      errors.push({
        name: field.name,
        message: `${label} must be ${field.maxLength} characters or fewer`,
        element: findFieldElement(form, field.name),
      });
      continue;
    }

    if (field.pattern) {
      try {
        const regex = new RegExp(field.pattern);
        if (!regex.test(trimmed)) {
          errors.push({
            name: field.name,
            message: `${label} is invalid`,
            element: findFieldElement(form, field.name),
          });
        }
      } catch {
        // Ignore invalid patterns
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    values,
  };
}

function resolveBaseConfig(config: ContactFormConfig): ResolvedBaseConfig {
  const method = config.method || 'POST';
  const useAjax = typeof config.useAjax === 'boolean' ? config.useAjax : config.provider !== 'email';
  const honeypot = resolveHoneypotConfig(config);

  let formName: string | undefined;
  if (config.provider === 'netlify') {
    formName = (config.formName || DEFAULT_NETLIFY_FORM_NAME).trim() || DEFAULT_NETLIFY_FORM_NAME;
  }

  return {
    ...config,
    method,
    useAjax,
    honeypot,
    formName,
  };
}

function resolveRuntimeConfig(config: ContactFormRuntimeConfig): ResolvedRuntimeConfig {
  const base = resolveBaseConfig(config);

  return {
    ...base,
    selector: config.selector,
    statusSelector: config.statusSelector,
    statusPlacement: config.statusPlacement || 'after',
    validate: config.validate !== false,
    showFieldErrors: config.showFieldErrors !== false,
    resetOnSuccess: config.resetOnSuccess !== false,
    disableSubmit: config.disableSubmit !== false,
    timeoutMs: config.timeoutMs || 10000,
    successMessage: config.successMessage || DEFAULT_MESSAGES.success,
    errorMessage: config.errorMessage || DEFAULT_MESSAGES.error,
    spamMessage: config.spamMessage || DEFAULT_MESSAGES.spam,
    validationMessage: config.validationMessage || DEFAULT_MESSAGES.validation,
    pendingMessage: config.pendingMessage || DEFAULT_MESSAGES.pending,
  };
}

function resolveHoneypotConfig(config: ContactFormConfig): ResolvedHoneypotConfig {
  if (config.honeypot === false) {
    return {
      enabled: false,
      fieldName: 'hp-field',
      label: DEFAULT_HONEYPOT_LABEL,
      wrapperClass: DEFAULT_HONEYPOT_WRAPPER_CLASS,
      autocomplete: 'off',
    };
  }

  const overrides = typeof config.honeypot === 'object' ? config.honeypot : {};
  const defaultFieldName = config.provider === 'netlify' ? 'bot-field' : 'company';

  return {
    enabled: overrides.enabled !== false,
    fieldName: overrides.fieldName || defaultFieldName,
    label: overrides.label || DEFAULT_HONEYPOT_LABEL,
    wrapperClass: overrides.wrapperClass || DEFAULT_HONEYPOT_WRAPPER_CLASS,
    autocomplete: overrides.autocomplete || 'off',
  };
}

function resolveFormAction(config: ResolvedBaseConfig): string {
  if (config.action) {
    return config.action;
  }

  if (config.provider === 'formspree') {
    if (config.endpoint) {
      return config.endpoint;
    }
    if (config.formId) {
      return `https://formspree.io/f/${encodeURIComponent(config.formId)}`;
    }
  }

  if (config.provider === 'netlify') {
    return config.action || '';
  }

  if (config.provider === 'email') {
    return config.action || `mailto:${encodeURIComponent(config.emailTo)}`;
  }

  return '';
}

function getConfigErrors(config: ResolvedBaseConfig): string[] {
  const errors: string[] = [];

  if (config.provider === 'formspree') {
    if (!resolveFormAction(config)) {
      errors.push('Formspree endpoint or formId is required.');
    }
  }

  if (config.provider === 'email') {
    if (!config.emailTo || !config.emailTo.trim()) {
      errors.push('Email recipient is required.');
    }
  }

  return errors;
}

function extractFormValues(form: HTMLFormElement, config: ResolvedBaseConfig): Record<string, string> {
  const values: Record<string, string> = {};
  const formData = new FormData(form);

  formData.forEach((value, key) => {
    if (config.honeypot.enabled && key === config.honeypot.fieldName) return;
    if (value instanceof File) return;
    if (values[key]) {
      values[key] = `${values[key]}, ${String(value)}`;
    } else {
      values[key] = String(value);
    }
  });

  return values;
}

function resolveFieldConfigs(form: HTMLFormElement, config: ResolvedBaseConfig): ContactFormField[] {
  const overrides = new Map<string, ContactFormField>((config.fields || []).map(field => [field.name, field]));
  const elements = Array.from(form.elements)
    .filter((el): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
    .filter(el => !!el.name && !isSubmitElement(el));

  const fields = new Map<string, ContactFormField>();

  for (const element of elements) {
    if (config.honeypot.enabled && element.name === config.honeypot.fieldName) {
      continue;
    }

    const override = overrides.get(element.name);
    const type = override?.type || inferFieldType(element);
    const label = override?.label || inferFieldLabel(form, element);
    const required = typeof override?.required === 'boolean' ? override.required : isRequiredElement(element);
    const minLength = typeof override?.minLength === 'number' ? override.minLength : getMinLength(element);
    const maxLength = typeof override?.maxLength === 'number' ? override.maxLength : getMaxLength(element);
    const pattern = override?.pattern || element.getAttribute('pattern') || undefined;

    fields.set(element.name, {
      name: element.name,
      label: label || undefined,
      type,
      required,
      minLength,
      maxLength,
      pattern,
      placeholder: override?.placeholder || element.getAttribute('placeholder') || undefined,
    });
  }

  for (const [name, override] of overrides.entries()) {
    if (config.honeypot.enabled && name === config.honeypot.fieldName) {
      continue;
    }
    if (!fields.has(name)) {
      fields.set(name, { ...override });
    }
  }

  return Array.from(fields.values());
}

function ensureBrowser(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Contact form runtime requires a browser environment.');
  }
}

function ensureHoneypotField(form: HTMLFormElement, config: ResolvedRuntimeConfig): HTMLInputElement | null {
  const selector = `[name="${cssEscape(config.honeypot.fieldName)}"]`;
  const existing = form.querySelector(selector);
  if (existing instanceof HTMLInputElement) {
    return existing;
  }

  const wrapper = document.createElement('div');
  wrapper.className = config.honeypot.wrapperClass;
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-10000px';
  wrapper.style.width = '1px';
  wrapper.style.height = '1px';
  wrapper.style.overflow = 'hidden';
  wrapper.setAttribute('aria-hidden', 'true');

  const label = document.createElement('label');
  label.textContent = config.honeypot.label;

  const input = document.createElement('input');
  input.type = 'text';
  input.name = config.honeypot.fieldName;
  input.setAttribute('autocomplete', config.honeypot.autocomplete);
  input.tabIndex = -1;

  label.appendChild(input);
  wrapper.appendChild(label);
  form.appendChild(wrapper);

  return input;
}

function isHoneypotTripped(form: HTMLFormElement, config: ResolvedRuntimeConfig): boolean {
  const selector = `[name="${cssEscape(config.honeypot.fieldName)}"]`;
  const field = form.querySelector(selector);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    return false;
  }
  return field.value.trim().length > 0;
}

function applyFieldErrors(form: HTMLFormElement, errors: ContactFormFieldError[]): void {
  for (const error of errors) {
    const element = error.element || findFieldElement(form, error.name);
    if (!element) continue;

    element.setAttribute('aria-invalid', 'true');

    const errorEl = document.createElement('div');
    errorEl.className = 'form-field-error';
    errorEl.dataset.fieldError = error.name;
    errorEl.textContent = error.message;

    element.insertAdjacentElement('afterend', errorEl);
  }
}

function clearFieldErrors(form: HTMLFormElement): void {
  const errorNodes = form.querySelectorAll('[data-field-error]');
  errorNodes.forEach(node => node.remove());

  const invalidFields = form.querySelectorAll('[aria-invalid="true"]');
  invalidFields.forEach(node => node.removeAttribute('aria-invalid'));
}

function setStatus(form: HTMLFormElement, config: ResolvedRuntimeConfig, status: ContactFormSubmissionStatus, message: string): void {
  const statusEl = resolveStatusElement(form, config);
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.setAttribute('data-status', status);
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
}

function resolveStatusElement(form: HTMLFormElement, config: ResolvedRuntimeConfig): HTMLElement | null {
  if (config.statusSelector) {
    const scoped = form.querySelector(config.statusSelector);
    if (scoped instanceof HTMLElement) return scoped;
    const global = document.querySelector(config.statusSelector);
    if (global instanceof HTMLElement) return global;
  }

  const existing = form.querySelector('[data-form-status]');
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const statusEl = document.createElement('div');
  statusEl.className = 'form-status';
  statusEl.dataset.formStatus = 'true';

  if (config.statusPlacement === 'before') {
    if (form.parentNode) {
      form.parentNode.insertBefore(statusEl, form);
      return statusEl;
    }
  }

  if (config.statusPlacement === 'after') {
    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submit && submit.parentNode) {
      submit.parentNode.insertBefore(statusEl, submit.nextSibling);
      return statusEl;
    }
  }

  form.appendChild(statusEl);
  return statusEl;
}

function setSubmitDisabled(form: HTMLFormElement, disabled: boolean): void {
  const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
  submitButtons.forEach(button => {
    if (button instanceof HTMLButtonElement || button instanceof HTMLInputElement) {
      button.disabled = disabled;
    }
  });
}

async function submitViaFormspree(form: HTMLFormElement, config: ResolvedRuntimeConfig): Promise<ContactFormSubmissionResult> {
  const action = resolveFormAction(config);
  if (!action) {
    return { ok: false, status: 'error', message: 'Formspree endpoint is missing.' };
  }

  const formData = new FormData(form);

  try {
    const response = await fetchWithTimeout(action, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    }, config.timeoutMs);

    const statusCode = response.status;
    let message = response.ok ? config.successMessage : config.errorMessage;

    try {
      const data = await response.json();
      if (!response.ok && data) {
        message = extractServiceError(data) || message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    return {
      ok: response.ok,
      status: response.ok ? 'success' : 'error',
      message,
      statusCode,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 'error',
      message: error?.message || config.errorMessage,
    };
  }
}

async function submitViaNetlify(form: HTMLFormElement, config: ResolvedRuntimeConfig): Promise<ContactFormSubmissionResult> {
  const action = resolveFormAction(config) || '/';
  const formData = new FormData(form);

  const body = new URLSearchParams();
  formData.forEach((value, key) => {
    if (value instanceof File) return;
    body.append(key, String(value));
  });

  const formName = config.formName || DEFAULT_NETLIFY_FORM_NAME;
  if (!body.has('form-name')) {
    body.append('form-name', formName);
  }

  try {
    const response = await fetchWithTimeout(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }, config.timeoutMs);

    const statusCode = response.status;
    let message = response.ok ? config.successMessage : config.errorMessage;

    if (!response.ok) {
      try {
        const data = await response.json();
        message = extractServiceError(data) || message;
      } catch {
        // Ignore JSON parse errors
      }
    }

    return {
      ok: response.ok,
      status: response.ok ? 'success' : 'error',
      message,
      statusCode,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 'error',
      message: error?.message || config.errorMessage,
    };
  }
}

function submitViaEmail(values: Record<string, string>, config: ResolvedRuntimeConfig & EmailProviderConfig): ContactFormSubmissionResult {
  if (!config.emailTo || !config.emailTo.trim()) {
    return { ok: false, status: 'error', message: 'Email recipient is missing.' };
  }

  const subject = config.subject || 'New contact form submission';
  const body = formatMailBody(values);
  const mailto = buildMailtoLink(config.emailTo, subject, body);

  try {
    window.location.href = mailto;
  } catch {
    return { ok: false, status: 'error', message: config.errorMessage };
  }

  return { ok: true, status: 'success', message: config.successMessage };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function extractServiceError(data: any): string | null {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (first && typeof first.message === 'string') return first.message;
    if (typeof first === 'string') return first;
  }
  return null;
}

function formatMailBody(values: Record<string, string>): string {
  const lines = Object.entries(values)
    .filter(([_, value]) => value && value.trim().length > 0)
    .map(([key, value]) => `${humanizeFieldName(key)}: ${value}`);

  return lines.join('\n');
}

function buildMailtoLink(email: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  const encodedEmail = encodeURIComponent(email.trim());
  return query ? `mailto:${encodedEmail}?${query}` : `mailto:${encodedEmail}`;
}

function isSubmitElement(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  return element instanceof HTMLInputElement && ['submit', 'button', 'reset', 'image'].includes(element.type);
}

function inferFieldType(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ContactFormFieldType {
  if (element instanceof HTMLTextAreaElement) return 'textarea';
  if (element instanceof HTMLSelectElement) return 'select';
  if (element instanceof HTMLInputElement) {
    const type = element.type as ContactFormFieldType;
    return type || 'text';
  }
  return 'text';
}

function inferFieldLabel(form: HTMLFormElement, element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | undefined {
  if (element.id) {
    const label = form.querySelector(`label[for="${cssEscape(element.id)}"]`);
    if (label) return label.textContent?.trim() || undefined;
  }
  if (element.closest('label')) {
    const label = element.closest('label');
    return label?.textContent?.trim() || undefined;
  }
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label') || undefined;
  }
  return undefined;
}

function isRequiredElement(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  return !!element.required;
}

function getMinLength(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): number | undefined {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.minLength > 0 ? element.minLength : undefined;
  }
  return undefined;
}

function getMaxLength(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): number | undefined {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.maxLength > 0 ? element.maxLength : undefined;
  }
  return undefined;
}

function isEmailField(field: ContactFormField): boolean {
  return field.name.toLowerCase().includes('email');
}

function isPhoneField(field: ContactFormField): boolean {
  const name = field.name.toLowerCase();
  return name.includes('phone') || name.includes('tel');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7;
}

function hasCheckedValue(form: HTMLFormElement, name: string): boolean {
  const selector = `[name="${cssEscape(name)}"]`;
  const nodes = Array.from(form.querySelectorAll(selector));
  return nodes.some(node => node instanceof HTMLInputElement && node.checked);
}

function findFieldElement(form: HTMLFormElement, name: string): HTMLElement | null {
  const selector = `[name="${cssEscape(name)}"]`;
  const element = form.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
}

function humanizeFieldName(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, match => map[match]);
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function serializeAttributes(attrs: Record<string, string | boolean>): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) return ` ${key}`;
      if (value === false || value === undefined || value === null || value === '') return '';
      return ` ${key}="${escapeAttribute(String(value))}"`;
    })
    .join('');
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
