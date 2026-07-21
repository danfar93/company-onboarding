/**
 * Input normalisation — the first step of the pipeline.
 *
 * Turns the raw { email, website } into a canonical host, a URL, and a "name
 * seed" (e.g. acme-tech.co.uk -> "acme tech") that the sources search against.
 * Pure and dependency-free.
 */

export interface NormalisedInput {
  email: string;
  website: string;
  /** Lowercased domain from the email, or null if unparseable. */
  emailDomain: string | null;
  /** Bare hostname (no scheme/www/path), from the website or email. */
  host: string | null;
  /** Canonical https URL for the host, or null. */
  url: string | null;
  /** Search seed derived from the host's main label, e.g. "acme tech". */
  seed: string;
}

// Second-level labels that precede a country-code TLD (e.g. the "co" in
// "co.uk"), so we drop the right number of labels to find the main name.
const SECOND_LEVEL = new Set([
  'co',
  'com',
  'org',
  'net',
  'ac',
  'gov',
  'ltd',
  'plc',
  'me',
  'sch',
]);

function bareHost(value: string): string | null {
  let host = value.trim().toLowerCase();
  if (!host) return null;
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
  host = host.split('/')[0].split('?')[0].split('#')[0]; // path/query/hash
  host = host.split('@').pop() ?? host; // userinfo
  host = host.split(':')[0]; // port
  host = host.replace(/^www\./, '');
  return host || null;
}

function emailDomainOf(email: string): string | null {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

/** The registrable "main" label of a host, as space-separated words. */
export function nameSeed(host: string): string {
  const labels = host.split('.').filter(Boolean);
  let main: string;
  if (labels.length <= 1) {
    main = labels[0] ?? '';
  } else {
    const last = labels[labels.length - 1];
    const secondLast = labels[labels.length - 2];
    const dropTwo = last.length === 2 && SECOND_LEVEL.has(secondLast);
    const idx = labels.length - (dropTwo ? 3 : 2);
    main = labels[Math.max(0, idx)];
  }
  return main
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normaliseInput(email: string, website: string): NormalisedInput {
  const emailDomain = emailDomainOf(email);
  const host = bareHost(website) ?? emailDomain;
  return {
    email,
    website,
    emailDomain,
    host,
    url: host ? `https://${host}` : null,
    seed: host ? nameSeed(host) : '',
  };
}
