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
import { websiteSource } from './sources/website';
import { anthropicComplete, llmSource, type ClaudeComplete } from './sources/llm';
import type { FetchLike, SourceResult } from './source';
import type { EnrichResponse } from './types';

export interface OrchestratorDeps {
  fetch?: FetchLike;
  companiesHouseApiKey?: string;
  companiesHouseApiBase?: string;
  claudeApiKey?: string;
  /** Injected Claude completion (for tests); defaults to the Anthropic SDK. */
  claudeComplete?: ClaudeComplete;
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
  const claudeApiKey = deps.claudeApiKey ?? process.env.CLAUDE_API_KEY;
  const claudeComplete =
    deps.claudeComplete ??
    (claudeApiKey ? anthropicComplete(claudeApiKey) : undefined);

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

  // 2. Company website — self-reported fallback when CH can't resolve. Free.
  const web = await websiteSource(input, { fetch: fetchFn });
  results.push(web);

  // 3. Claude — last resort for soft fields (industry, trade name), grounded on
  //    the text the website scrape already gathered. Only reached when the free
  //    sources come up short, to cap paid API usage.
  const industryStillMissing = !results.some((r) => r.company.industry);
  if (claudeComplete && industryStillMissing) {
    results.push(await llmSource(web.excerpt, claudeComplete));
  }

  return assemble(results);
}
