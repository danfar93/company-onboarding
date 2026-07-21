/**
 * Assemble source results into the final EnrichResponse.
 *
 * Pure — no I/O — so it's fully testable offline. In the cascade, sources are
 * pushed in priority order (Companies House, then website, then LLM), so this
 * gap-fills: the first source to provide a field wins it, and later sources
 * only fill what's still missing. Provenance and confidence are recorded per
 * field, and every source's warnings are surfaced for transparency.
 */
import type {
  Company,
  Confidence,
  EnrichResponse,
  Field,
  SourceName,
} from './types';
import type { SourceResult } from './source';

export function assemble(results: SourceResult[]): EnrichResponse {
  const company: Company = {};
  const confidence: Partial<Record<Field, Confidence>> = {};
  const fieldSources: Partial<Record<Field, SourceName>> = {};
  const sources: SourceName[] = [];
  const warnings: string[] = [];

  for (const result of results) {
    if (result.warning) warnings.push(result.warning);

    let contributed = false;
    for (const key of Object.keys(result.company) as Field[]) {
      const value = result.company[key];
      if (value === undefined || value === null) continue;
      if (company[key] !== undefined) continue; // first source wins the field

      (company[key] as unknown) = value;
      fieldSources[key] = result.source;
      if (result.confidence[key]) confidence[key] = result.confidence[key];
      contributed = true;
    }

    if (contributed && !sources.includes(result.source)) {
      sources.push(result.source);
    }
  }

  return { company, enrichment: { sources, confidence, fieldSources, warnings } };
}
