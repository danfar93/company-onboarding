/**
 * Company website source — self-reported data straight from the homepage.
 *
 * Runs as a cascade fallback when Companies House can't resolve the company.
 * Pulls a name (og:site_name / JSON-LD / <title>), a UK company number from the
 * footer, and a postal address from JSON-LD. It's self-reported, so confidence
 * is deliberately conservative. Never throws — failures come back as a warning.
 */
import type { NormalisedInput } from '../input';
import type { SourceDeps, SourceResult } from '../source';
import type { Company, Confidence, Field, RegisteredAddress } from '../types';

const SOURCE = 'Company Website' as const;
const TIMEOUT_MS = 6000;

const empty = (warning?: string): SourceResult => ({
  source: SOURCE,
  matched: false,
  company: {},
  confidence: {},
  warning,
});

export async function websiteSource(
  input: NormalisedInput,
  deps: SourceDeps
): Promise<SourceResult> {
  if (!input.url) return empty('Website skipped: no website provided');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html: string;
  try {
    const res = await deps.fetch(input.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; CompanyOnboarding/1.0; +enrichment-bot)',
        Accept: 'text/html',
      },
      signal: controller.signal,
    });
    if (!res.ok) return empty(`Website fetch failed (${res.status})`);
    html = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return empty(`Website fetch error: ${message}`);
  } finally {
    clearTimeout(timer);
  }

  const objects = jsonLdObjects(html);
  const org = organizationFrom(objects);

  const company: Company = {};
  const confidence: Partial<Record<Field, Confidence>> = {};

  // Name: og:site_name and JSON-LD are intentional signals (medium); a <title>
  // is a weaker last resort (low).
  const ogName = metaContent(html, 'og:site_name');
  const ldName = typeof org?.name === 'string' ? org.name.trim() : undefined;
  const titleName = nameFromTitle(html, input.host);
  if (ogName || ldName) {
    company.name = (ogName ?? ldName)!.trim();
    confidence.name = 'medium';
  } else if (titleName) {
    company.name = titleName;
    confidence.name = 'low';
  }

  const reg = registrationNumberFrom(html);
  if (reg) {
    company.registrationNumber = reg;
    confidence.registrationNumber = 'medium';
  }

  const address = addressFrom(org?.address);
  if (address) {
    company.registeredAddress = address;
    confidence.registeredAddress = 'low';
  }

  const matched = Boolean(company.name || company.registrationNumber);
  return {
    source: SOURCE,
    matched,
    company,
    confidence,
    warning: matched ? undefined : 'No company details found on website',
  };
}

// --- HTML helpers ---------------------------------------------------------

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m?.[1];
}

function metaContent(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const prop = attr(tag, 'property') ?? attr(tag, 'name');
    if (prop && prop.toLowerCase() === key.toLowerCase()) {
      const content = attr(tag, 'content');
      if (content) return decode(content).trim();
    }
  }
  return undefined;
}

const GENERIC_TITLE = new Set([
  'home',
  'welcome',
  'homepage',
  'official site',
  'official website',
]);

function nameFromTitle(html: string, host: string | null): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return undefined;
  const raw = decode(m[1]).replace(/\s+/g, ' ').trim();
  if (!raw) return undefined;

  const segments = raw
    .split(/\s*[|–—·:]\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const meaningful = segments.filter(
    (s) => !GENERIC_TITLE.has(s.toLowerCase())
  );
  const pick = (meaningful[0] ?? segments[0] ?? raw).trim();
  // Guard against a title that's just the tagline — cap length.
  return pick.length > 0 && pick.length <= 60 ? pick : undefined;
}

function jsonLdObjects(html: string): any[] {
  const blocks = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  const out: any[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      if (Array.isArray(parsed)) out.push(...parsed);
      else if (parsed && Array.isArray(parsed['@graph'])) out.push(...parsed['@graph']);
      else out.push(parsed);
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return out;
}

function organizationFrom(objects: any[]): any | undefined {
  const isOrg = (type: unknown): boolean => {
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) =>
      /organization|corporation|localbusiness|store|company/i.test(String(t))
    );
  };
  return objects.find((o) => o && isOrg(o['@type']));
}

function addressFrom(address: any): RegisteredAddress | undefined {
  if (!address || typeof address !== 'object') return undefined;
  const a = Array.isArray(address) ? address[0] : address;
  if (!a || typeof a !== 'object') return undefined;

  const out: RegisteredAddress = {};
  if (a.streetAddress) out.line1 = String(a.streetAddress).trim();
  if (a.addressLocality) out.city = String(a.addressLocality).trim();
  if (a.addressRegion) out.region = String(a.addressRegion).trim();
  if (a.postalCode) out.postalCode = String(a.postalCode).trim();
  const country =
    typeof a.addressCountry === 'object'
      ? a.addressCountry?.name
      : a.addressCountry;
  if (country) out.country = String(country).trim();

  return Object.keys(out).length ? out : undefined;
}

// UK company numbers: 8 digits, or a 2-letter prefix (SC/NI/OC/...) + 6 digits.
const REG_PATTERNS = [
  /company\s*(?:registration|reg(?:istered)?)?\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z]{0,2}\d{6,8})/i,
  /registered\s+in\s+[a-z&\s]+?(?:no\.?|number|#)\s*[:\-]?\s*([A-Z]{0,2}\d{6,8})/i,
  /\breg(?:istration)?\.?\s*no\.?\s*[:\-]?\s*([A-Z]{0,2}\d{6,8})/i,
];

function registrationNumberFrom(html: string): string | undefined {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  for (const pattern of REG_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const candidate = normaliseRegNumber(m[1]);
      if (candidate) return candidate;
    }
  }
  return undefined;
}

function normaliseRegNumber(raw: string): string | undefined {
  const value = raw.toUpperCase();
  if (/^\d{8}$/.test(value)) return value;
  if (/^[A-Z]{2}\d{6}$/.test(value)) return value;
  if (/^\d{7}$/.test(value)) return `0${value}`; // dropped leading zero
  return undefined;
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
