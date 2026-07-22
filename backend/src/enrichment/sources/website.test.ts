import { describe, expect, it } from 'vitest';

import { normaliseInput } from '../input';
import type { FetchLike, HttpResponse } from '../source';
import { websiteSource } from './website';

const html = (body: string): HttpResponse => ({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => body,
});

const stub =
  (body: string): FetchLike =>
  async () =>
    html(body);

const input = normaliseInput('a@acme.co.uk', 'https://acme.co.uk');

describe('websiteSource', () => {
  it('extracts name, registration number and address from a rich page', async () => {
    const body = `<html><head>
      <title>Acme | Home</title>
      <meta property="og:site_name" content="Acme">
      <script type="application/ld+json">
      {"@type":"Organization","name":"Acme Ltd","address":{"@type":"PostalAddress","streetAddress":"1 Tech Park","addressLocality":"London","postalCode":"EC1A 1BB","addressCountry":"GB"}}
      </script>
      </head><body>
      <footer>Registered in England and Wales. Company registration number 12345678.</footer>
      </body></html>`;

    const result = await websiteSource(input, { fetch: stub(body) });
    expect(result.matched).toBe(true);
    expect(result.company.name).toBe('Acme'); // og:site_name preferred
    expect(result.confidence.name).toBe('medium'); // self-reported, conservative
    expect(result.company.registrationNumber).toBe('12345678');
    expect(result.company.registeredAddress).toMatchObject({
      line1: '1 Tech Park',
      city: 'London',
    });
    expect(result.excerpt).toContain('Acme');
  });

  it('returns a warning when the page has no company details', async () => {
    const result = await websiteSource(input, { fetch: stub('<html></html>') });
    expect(result.matched).toBe(false);
    expect(result.warning).toMatch(/no company details/i);
  });

  it('turns a fetch failure into a warning', async () => {
    const fetch: FetchLike = async () => {
      throw new Error('network down');
    };
    const result = await websiteSource(input, { fetch });
    expect(result.matched).toBe(false);
    expect(result.warning).toContain('network down');
  });
});
