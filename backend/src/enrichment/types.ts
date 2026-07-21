/**
 * Shared enrichment contract — the single shape the whole pipeline speaks, and
 * the one source of truth for both halves of the app.
 *
 * The mobile app imports this same file via its `@shared/*` tsconfig path alias
 * (see mobile/tsconfig.json). Because it's consumed there only as `import type`,
 * it's erased from the mobile bundle — Metro never resolves it, so no monorepo
 * config is needed. Invariant: keep this file types-only (no runtime values).
 *
 * Every company field is optional: enrichment is best-effort, so a field we
 * couldn't establish is simply absent rather than guessed.
 */

/** How much we trust a given field. */
export type Confidence = 'high' | 'medium' | 'low';

/** Where a value (or confidence) came from. */
export type SourceName =
  | 'Companies House'
  | 'Company Website'
  | 'LLM Inference'
  | 'User Input';

export interface RegisteredAddress {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface Company {
  name?: string;
  registrationNumber?: string;
  registeredAddress?: RegisteredAddress;
  incorporationDate?: string; // ISO yyyy-mm-dd
  companyType?: string;
  industry?: string;
  status?: string;
}

/** The company fields we track provenance and confidence for. */
export type Field = keyof Company;

export interface Enrichment {
  /** Which sources contributed anything to this record. */
  sources: SourceName[];
  /** Per-field confidence. */
  confidence: Partial<Record<Field, Confidence>>;
  /** Per-field provenance — the "From X" shown next to each value. */
  fieldSources: Partial<Record<Field, SourceName>>;
  /** Human-readable notes about failures/degradation, for transparency. */
  warnings: string[];
}

export interface EnrichResponse {
  company: Company;
  enrichment: Enrichment;
}

/** Request body for POST /enrich. */
export interface EnrichRequest {
  email: string;
  website: string;
}
