/**
 * Claude source — the cascade's last resort, for soft fields only.
 *
 * Runs only when Companies House and the website scrape leave gaps (it costs
 * money, unlike the other sources). It reasons over text already scraped from
 * the website — never raw guesswork about the domain — and is limited to soft
 * fields: industry and a cleaned trade name. The prompt forbids inventing hard
 * facts (registration numbers, addresses, dates); it prefers null over a guess.
 *
 * The network call is injected as `complete` so the source is unit-testable
 * with a stub. `anthropicComplete` wires the real Anthropic SDK.
 */
import Anthropic from '@anthropic-ai/sdk';

import type { SourceResult } from '../source';
import type { Company, Confidence, Field } from '../types';

// Default model. Haiku 4.5 — fastest/cheapest tier, ample for this simple
// soft-field extraction and in keeping with the cost-aware cascade. Swap to
// `claude-opus-4-8` if higher-quality inference is ever needed.
export const LLM_MODEL = 'claude-haiku-4-5';

const SOURCE = 'LLM Inference' as const;

/** Injected completion: takes system + user prompts, returns raw model text. */
export type ClaudeComplete = (system: string, user: string) => Promise<string>;

const empty = (warning?: string): SourceResult => ({
  source: SOURCE,
  matched: false,
  company: {},
  confidence: {},
  warning,
});

const SYSTEM_PROMPT = [
  'You extract soft company attributes from text scraped from a company website.',
  'Only use what the text supports. Never invent registration numbers, addresses,',
  'incorporation dates, or company names not present or clearly implied by the text.',
  'Prefer null over a guess. Respond with a single strict JSON object and nothing else.',
].join(' ');

export async function llmSource(
  excerpt: string | undefined,
  complete: ClaudeComplete | undefined
): Promise<SourceResult> {
  if (!complete) return empty('LLM skipped: no API key configured');
  if (!excerpt || excerpt.trim().length < 20) {
    return empty('LLM skipped: not enough website text to reason over');
  }

  const user = [
    'Website text:',
    '"""',
    excerpt,
    '"""',
    '',
    'Return JSON of the form {"industry": string|null, "tradeName": string|null}.',
    '- industry: a short sector label (e.g. "Software", "Fintech", "Retail", "Healthcare").',
    '- tradeName: the cleaned company or brand name.',
    'Use null for any value the text does not support.',
  ].join('\n');

  let raw: string;
  try {
    raw = await complete(SYSTEM_PROMPT, user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return empty(`LLM error: ${message}`);
  }

  const parsed = parseJson(raw);
  if (!parsed) return empty('LLM returned unparseable output');

  const company: Company = {};
  const confidence: Partial<Record<Field, Confidence>> = {};

  const industry = cleanString(parsed.industry);
  if (industry) {
    company.industry = industry;
    confidence.industry = 'low'; // inferred, not authoritative
  }

  const tradeName = cleanString(parsed.tradeName);
  if (tradeName) {
    // Only fills the name if no earlier source set one (the merge gap-fills).
    company.name = tradeName;
    confidence.name = 'low';
  }

  const matched = Boolean(company.industry || company.name);
  return {
    source: SOURCE,
    matched,
    company,
    confidence,
    warning: matched ? undefined : 'LLM found no usable soft fields',
  };
}

/** Real Anthropic-SDK-backed completion. */
export function anthropicComplete(
  apiKey: string,
  model: string = LLM_MODEL
): ClaudeComplete {
  const client = new Anthropic({ apiKey });
  return async (system, user) => {
    // Small, cheap call: no thinking (omitted → runs without thinking on Opus
    // 4.8), tight max_tokens. No temperature/top_p — removed on this model.
    const message = await client.messages.create({
      model,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
  };
}

function parseJson(raw: string): { industry?: unknown; tradeName?: unknown } | null {
  const stripped = raw.replace(/```json\s*|\s*```/gi, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^(null|n\/a|unknown|none)$/i.test(trimmed)) return undefined;
  return trimmed;
}
