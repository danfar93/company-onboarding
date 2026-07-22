import { describe, expect, it } from 'vitest';

import {
  domainsMatch,
  isValidEmail,
  suggestedWebsite,
  validateInput,
  websiteHost,
} from './validation';

describe('email + host helpers', () => {
  it('validates email shape leniently', () => {
    expect(isValidEmail('dan@acme.co.uk')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('extracts a bare host from a messy website string', () => {
    expect(websiteHost('https://www.acme.co.uk/about?x=1')).toBe('acme.co.uk');
    expect(websiteHost('acme.co.uk')).toBe('acme.co.uk');
    expect(websiteHost('')).toBeNull();
  });

  it('matches domains, including subdomains', () => {
    expect(domainsMatch('dan@acme.co.uk', 'acme.co.uk')).toBe(true);
    expect(domainsMatch('dan@acme.co.uk', 'shop.acme.co.uk')).toBe(true);
    expect(domainsMatch('dan@acme.co.uk', 'other.com')).toBe(false);
  });

  it('suggests the bare domain for autofill', () => {
    expect(suggestedWebsite('dan@acme.co.uk')).toBe('acme.co.uk');
    expect(suggestedWebsite('not-an-email')).toBeNull();
  });
});

describe('validateInput', () => {
  it('allows continue when email is valid and website matches', () => {
    const v = validateInput('dan@acme.co.uk', 'acme.co.uk');
    expect(v.emailValid).toBe(true);
    expect(v.websiteMismatch).toBe(false);
    expect(v.canContinue).toBe(true);
  });

  it('blocks and flags a mismatched website (free emails not exempt)', () => {
    const v = validateInput('dan@gmail.com', 'acme.co.uk');
    expect(v.websiteMismatch).toBe(true);
    expect(v.canContinue).toBe(false);
  });

  it('blocks an invalid email', () => {
    const v = validateInput('nope', 'acme.co.uk');
    expect(v.emailValid).toBe(false);
    expect(v.canContinue).toBe(false);
  });

  it('blocks until a website is present', () => {
    const v = validateInput('dan@acme.co.uk', '');
    expect(v.canContinue).toBe(false);
    expect(v.suggestedWebsite).toBe('acme.co.uk');
  });
});
