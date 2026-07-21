/**
 * Enrichment orchestrator — a cost-aware cascade.
 *
 * normalise -> Companies House -> (fallback) website scrape -> (last resort) LLM
 *
 * Rather than querying every source and merging, we stop as soon as a source
 * confidently resolves the company. Companies House is free and authoritative,
 * website scraping is free, and the LLM costs money — so the cascade keeps paid
 * calls to a minimum: the LLM only runs when the cheaper sources come up short.
 *
 * The trade-off vs. running all sources concurrently: we give up cross-source
 * corroboration (agreement bumping confidence). That's an acceptable price for
 * lower cost and latency here.
 */
import { normaliseInput } from './input';
import { assemble } from './merge';
import { companiesHouseSource } from './sources/companiesHouse';
import type { FetchLike, SourceResult } from './source';
import type { EnrichResponse } from './types';

export interface OrchestratorDeps {
  fetch?: FetchLike;
  companiesHouseApiKey?: string;
  companiesHouseApiBase?: string;
  claudeApiKey?: string;
}

export async function enrichCompany(
  email: string,
  website: string,
  deps: OrchestratorDeps = {}
): Promise<EnrichResponse> {
  const fetchFn: FetchLike =
    deps.fetch ?? ((globalThis as any).fetch as FetchLike);
  const chApiKey =
    deps.companiesHouseApiKey ?? process.env.COMPANIES_HOUSE_API_KEY;
  const chApiBase =
    deps.companiesHouseApiBase ?? process.env.COMPANIES_HOUSE_API_BASE;

  const input = normaliseInput(email, website);
  const results: SourceResult[] = [];

  // 1. Companies House — authoritative, free. Cheapest way to resolve identity.
  const ch = await companiesHouseSource(
    input,
    { fetch: fetchFn },
    chApiKey,
    chApiBase
  );
  results.push(ch);
  if (ch.matched) {
    return assemble(results);
  }

  // 2. TODO (next): website scraping when Companies House can't resolve —
  //    self-reported name / reg number / address from the homepage.
  //
  // 3. TODO (last resort): Claude for soft fields (industry, trade name),
  //    grounded on scraped website text. Only reached here, to cap API spend.

  return assemble(results);
}
