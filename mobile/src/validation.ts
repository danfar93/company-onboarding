/**
 * Pure input-validation helpers for the onboarding form. No React, no I/O — so
 * they're trivial to unit-test and are the single source of truth for both the
 * field-level messages (InputScreen) and the Continue gate (App).
 */

// Deliberately lenient: one @, something before it, and a dotted domain after.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** The domain part of an email, lowercased, or null if it isn't parseable. */
export function emailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

/**
 * Bare hostname from a website string, tolerant of missing scheme, www, paths,
 * query, hash and port. Returns null when empty. Avoids the URL constructor,
 * whose React Native polyfill is unreliable.
 */
export function websiteHost(website: string): string | null {
  let host = website.trim().toLowerCase();
  if (!host) return null;
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
  host = host.split('/')[0]; // path
  host = host.split('?')[0].split('#')[0]; // query / hash
  host = host.split('@').pop() ?? host; // userinfo
  host = host.split(':')[0]; // port
  host = host.replace(/^www\./, '');
  return host || null;
}

/**
 * Bare domain suggested for the autofill button (e.g. "acme.co.uk", with no
 * scheme or www). Null when the email isn't valid.
 */
export function suggestedWebsite(email: string): string | null {
  if (!isValidEmail(email)) return null;
  return emailDomain(email);
}

/**
 * Does the website's host line up with the email's domain? True when they're
 * equal or one is a subdomain of the other (e.g. shop.acme.co.uk ~ acme.co.uk).
 */
export function domainsMatch(email: string, website: string): boolean {
  const ed = emailDomain(email);
  const wh = websiteHost(website);
  if (!ed || !wh) return false;
  return ed === wh || wh.endsWith(`.${ed}`) || ed.endsWith(`.${wh}`);
}

export interface InputValidation {
  emailValid: boolean;
  emailDomain: string | null;
  /** Bare domain for the autofill button, or null when not applicable. */
  suggestedWebsite: string | null;
  /** Email is valid and a website is present that doesn't match its domain. */
  websiteMismatch: boolean;
  /** All checks pass and both fields are present — safe to continue. */
  canContinue: boolean;
}

export function validateInput(email: string, website: string): InputValidation {
  const emailValid = isValidEmail(email);
  const domain = emailDomain(email);
  const websitePresent = website.trim() !== '';
  const matches = domainsMatch(email, website);

  const websiteMismatch = emailValid && websitePresent && !matches;
  const canContinue = emailValid && websitePresent && matches;

  return {
    emailValid,
    emailDomain: domain,
    suggestedWebsite: suggestedWebsite(email),
    websiteMismatch,
    canContinue,
  };
}
