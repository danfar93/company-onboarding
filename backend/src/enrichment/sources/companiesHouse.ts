/**
 * Companies House source — the authoritative UK company register.
 *
 * search by seed -> score candidates on token overlap -> fetch the best match's
 * profile -> map to our Company shape. The match score becomes the confidence:
 * everything downstream hinges on how sure we are we found the right company.
 *
 * Uses the Public Data API (https://developer.company-information.service.gov.uk)
 * with HTTP Basic auth (API key as username, empty password). Never throws —
 * failures come back as a warning so the pipeline can degrade gracefully.
 */
import type { NormalisedInput } from '../input';
import type { SourceDeps, SourceResult } from '../source';
import { weaken } from '../source';
import type { Company, Confidence, Field, RegisteredAddress } from '../types';

const LIVE_BASE = 'https://api.company-information.service.gov.uk';
const SOURCE = 'Companies House' as const;

// Below this share of seed tokens matched, we don't trust the identity.
const MATCH_FLOOR = 0.34;

const empty = (warning?: string): SourceResult => ({
  source: SOURCE,
  matched: false,
  company: {},
  confidence: {},
  warning,
});

export async function companiesHouseSource(
  input: NormalisedInput,
  deps: SourceDeps,
  apiKey: string | undefined,
  baseUrl: string = LIVE_BASE
): Promise<SourceResult> {
  if (!apiKey) return empty('Companies House skipped: no API key configured');
  if (!input.seed) return empty('Companies House skipped: no searchable name');

  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const headers = { Authorization: auth };

  try {
    const searchRes = await deps.fetch(
      `${baseUrl}/search/companies?q=${encodeURIComponent(input.seed)}&items_per_page=20`,
      { headers }
    );
    if (!searchRes.ok) {
      return empty(`Companies House search failed (${searchRes.status})`);
    }

    const search = await searchRes.json();
    const items: any[] = Array.isArray(search?.items) ? search.items : [];
    const best = items
      .map((it) => ({ it, score: scoreMatch(input.seed, it?.title ?? '') }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < MATCH_FLOOR || !best.it?.company_number) {
      return empty(`No confident Companies House match for "${input.seed}"`);
    }

    const profRes = await deps.fetch(
      `${baseUrl}/company/${encodeURIComponent(best.it.company_number)}`,
      { headers }
    );
    if (!profRes.ok) {
      return empty(`Companies House profile fetch failed (${profRes.status})`);
    }

    const profile = await profRes.json();
    const company = mapProfile(profile);
    const confidence = scoreToConfidence(best.score);

    // Every field's trust flows from the identity match; industry is a coarser,
    // derived bucket so it gets knocked down a notch.
    const perField: Partial<Record<Field, Confidence>> = {};
    for (const key of Object.keys(company) as Field[]) {
      perField[key] = key === 'industry' ? weaken(confidence) : confidence;
    }

    return { source: SOURCE, matched: true, company, confidence: perField };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return empty(`Companies House error: ${message}`);
  }
}

// --- matching -------------------------------------------------------------

const NOISE = new Set([
  'ltd',
  'limited',
  'plc',
  'llp',
  'llc',
  'inc',
  'co',
  'company',
  'the',
  'group',
  'holdings',
  'uk',
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !NOISE.has(t));
}

/** Share of seed tokens found in the title (with a lenient prefix match). */
export function scoreMatch(seed: string, title: string): number {
  const seedTokens = tokenize(seed);
  const titleTokens = tokenize(title);
  if (seedTokens.length === 0 || titleTokens.length === 0) return 0;

  const matched = seedTokens.filter((s) =>
    titleTokens.some((t) => t === s || (s.length >= 3 && (t.startsWith(s) || s.startsWith(t))))
  ).length;

  return matched / seedTokens.length;
}

function scoreToConfidence(score: number): Confidence {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

// --- mapping --------------------------------------------------------------

function mapProfile(p: any): Company {
  const company: Company = {};
  if (p?.company_name) company.name = String(p.company_name);
  if (p?.company_number) company.registrationNumber = String(p.company_number);

  const address = mapAddress(p?.registered_office_address);
  if (address) company.registeredAddress = address;

  if (p?.date_of_creation) company.incorporationDate = String(p.date_of_creation);
  if (p?.type) company.companyType = mapType(String(p.type));
  if (p?.company_status) company.status = prettify(String(p.company_status));

  const industry = industryFromSic(p?.sic_codes);
  if (industry) company.industry = industry;

  return company;
}

function mapAddress(a: any): RegisteredAddress | undefined {
  if (!a || typeof a !== 'object') return undefined;
  const address: RegisteredAddress = {};
  if (a.address_line_1) address.line1 = String(a.address_line_1);
  if (a.address_line_2) address.line2 = String(a.address_line_2);
  if (a.locality) address.city = String(a.locality);
  if (a.region) address.region = String(a.region);
  if (a.postal_code) address.postalCode = String(a.postal_code);
  if (a.country) address.country = String(a.country);
  return Object.keys(address).length ? address : undefined;
}

const TYPE_LABELS: Record<string, string> = {
  ltd: 'Private Limited Company',
  plc: 'Public Limited Company',
  llp: 'Limited Liability Partnership',
  'private-unlimited': 'Private Unlimited Company',
  'limited-partnership': 'Limited Partnership',
  'community-interest-company': 'Community Interest Company',
  'royal-charter': 'Royal Charter',
  'oversea-company': 'Overseas Company',
  'private-limited-guarant-nsc': 'Private Limited by Guarantee',
  'private-limited-guarant-nsc-limited-exemption':
    'Private Limited by Guarantee',
};

function mapType(type: string): string {
  return TYPE_LABELS[type] ?? prettify(type);
}

function prettify(code: string): string {
  return code
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Coarse SIC 2007 section buckets, keyed by the leading two digits of the code.
function industryFromSic(sicCodes: unknown): string | undefined {
  if (!Array.isArray(sicCodes) || sicCodes.length === 0) return undefined;
  const code = String(sicCodes[0]).padStart(2, '0');
  const div = parseInt(code.slice(0, 2), 10);
  if (Number.isNaN(div)) return undefined;

  if (div <= 3) return 'Agriculture, Forestry & Fishing';
  if (div <= 9) return 'Mining & Quarrying';
  if (div <= 33) return 'Manufacturing';
  if (div === 35) return 'Energy & Utilities';
  if (div <= 39) return 'Water & Waste Management';
  if (div <= 43) return 'Construction';
  if (div <= 47) return 'Wholesale & Retail';
  if (div <= 53) return 'Transport & Storage';
  if (div <= 56) return 'Accommodation & Food Service';
  if (div <= 63) return 'Information & Communication';
  if (div <= 66) return 'Financial & Insurance';
  if (div === 68) return 'Real Estate';
  if (div <= 75) return 'Professional, Scientific & Technical';
  if (div <= 82) return 'Administrative & Support Services';
  if (div === 84) return 'Public Administration & Defence';
  if (div === 85) return 'Education';
  if (div <= 88) return 'Health & Social Work';
  if (div <= 93) return 'Arts, Entertainment & Recreation';
  if (div <= 96) return 'Other Service Activities';
  return undefined;
}
