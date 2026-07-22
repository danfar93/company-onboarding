import { describe, expect, it } from 'vitest';

import { nameSeed, normaliseInput } from './input';

describe('nameSeed', () => {
  it('drops a two-part country-code TLD and splits the main label', () => {
    expect(nameSeed('acme-tech.co.uk')).toBe('acme tech');
  });

  it('drops a single TLD', () => {
    expect(nameSeed('acme.com')).toBe('acme');
  });

  it('handles subdomains by taking the registrable label', () => {
    expect(nameSeed('shop.gymshark.com')).toBe('gymshark');
  });
});

describe('normaliseInput', () => {
  it('derives host, url and seed from the website', () => {
    const input = normaliseInput('dan@acme.co.uk', 'https://www.acme.co.uk/about');
    expect(input.emailDomain).toBe('acme.co.uk');
    expect(input.host).toBe('acme.co.uk');
    expect(input.url).toBe('https://acme.co.uk');
    expect(input.seed).toBe('acme');
  });

  it('falls back to the email domain when no website is given', () => {
    const input = normaliseInput('dan@acme-tech.co.uk', '');
    expect(input.host).toBe('acme-tech.co.uk');
    expect(input.seed).toBe('acme tech');
  });

  it('tolerates a bare hostname without a scheme', () => {
    const input = normaliseInput('a@x.com', 'monzo.com');
    expect(input.host).toBe('monzo.com');
    expect(input.seed).toBe('monzo');
  });
});
