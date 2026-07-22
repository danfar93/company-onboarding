import { describe, expect, it } from 'vitest';

import { normaliseInput } from '../input';
import type { FetchLike, HttpResponse } from '../source';
import { companiesHouseSource, scoreMatch } from './companiesHouse';

const ok = (json: unknown): HttpResponse => ({
  ok: true,
  status: 200,
  json: async () => json,
  text: async () => JSON.stringify(json),
});

const PROFILE = {
  company_name: 'Acme Technologies Ltd',
  company_number: '12345678',
  type: 'ltd',
  company_status: 'active',
  date_of_creation: '2015-04-01',
  registered_office_address: {
    address_line_1: '1 Tech Park',
    locality: 'London',
    postal_code: 'EC1A 1BB',
    country: 'United Kingdom',
  },
  sic_codes: ['62012'],
};

/** Stub that answers search then profile with the given payloads. */
const stubFetch =
  (search: unknown, profile: unknown): FetchLike =>
  async (url) =>
    url.includes('/search/companies') ? ok(search) : ok(profile);

const input = normaliseInput(
  'dan@acme-technologies.co.uk',
  'https://acme-technologies.co.uk'
);

describe('scoreMatch', () => {
  it('ignores Ltd/Plc noise and rewards token overlap', () => {
    expect(scoreMatch('acme technologies', 'ACME TECHNOLOGIES LTD')).toBe(1);
    expect(scoreMatch('acme technologies', 'ACME PLUMBING LTD')).toBe(0.5);
    expect(scoreMatch('acme', 'Unrelated Holdings Ltd')).toBe(0);
  });
});

describe('companiesHouseSource', () => {
  it('picks the best match and maps the profile with confidence', async () => {
    const fetch = stubFetch(
      {
        items: [
          { title: 'ACME PLUMBING LTD', company_number: '99999999' },
          { title: 'ACME TECHNOLOGIES LTD', company_number: '12345678' },
        ],
      },
      PROFILE
    );
    const result = await companiesHouseSource(input, { fetch }, 'key');

    expect(result.matched).toBe(true);
    expect(result.company).toMatchObject({
      name: 'Acme Technologies Ltd',
      registrationNumber: '12345678',
      companyType: 'Private Limited Company',
      status: 'Active',
      industry: 'Information & Communication',
      registeredAddress: { line1: '1 Tech Park', city: 'London' },
    });
    expect(result.confidence.name).toBe('high');
    expect(result.confidence.industry).toBe('medium'); // soft field, knocked down
  });

  it('degrades gracefully without an API key', async () => {
    const result = await companiesHouseSource(input, { fetch: stubFetch({}, {}) }, undefined);
    expect(result.matched).toBe(false);
    expect(result.warning).toMatch(/no API key/i);
  });

  it('reports no confident match when scores are too low', async () => {
    const fetch = stubFetch(
      { items: [{ title: 'Unrelated Holdings Ltd', company_number: '1' }] },
      PROFILE
    );
    const result = await companiesHouseSource(input, { fetch }, 'key');
    expect(result.matched).toBe(false);
    expect(result.warning).toMatch(/no confident/i);
  });

  it('turns an HTTP error into a warning rather than throwing', async () => {
    const fetch: FetchLike = async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => '',
    });
    const result = await companiesHouseSource(input, { fetch }, 'key');
    expect(result.matched).toBe(false);
    expect(result.warning).toContain('401');
  });
});
