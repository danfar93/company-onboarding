import { describe, expect, it } from 'vitest';

import { llmSource } from './llm';

const EXCERPT =
  'Supabase | The Postgres Development Platform. Build production-grade apps with a Postgres database.';

describe('llmSource', () => {
  it('maps parsed industry and trade name to low-confidence soft fields', async () => {
    const complete = async () =>
      '```json\n{"industry": "Software", "tradeName": "Supabase"}\n```';
    const result = await llmSource(EXCERPT, complete);

    expect(result.source).toBe('LLM Inference');
    expect(result.matched).toBe(true);
    expect(result.company.industry).toBe('Software');
    expect(result.company.name).toBe('Supabase');
    expect(result.confidence.industry).toBe('low');
  });

  it('treats null values as absent', async () => {
    const complete = async () =>
      '{"industry": "Fintech", "tradeName": null}';
    const result = await llmSource(EXCERPT, complete);
    expect(result.company.industry).toBe('Fintech');
    expect(result.company.name).toBeUndefined();
  });

  it('skips when there is no completion function (no API key)', async () => {
    const result = await llmSource(EXCERPT, undefined);
    expect(result.matched).toBe(false);
    expect(result.warning).toMatch(/no API key/i);
  });

  it('skips when there is not enough text to reason over', async () => {
    const result = await llmSource('too short', async () => '{}');
    expect(result.warning).toMatch(/not enough/i);
  });

  it('warns on unparseable output', async () => {
    const result = await llmSource(EXCERPT, async () => 'I cannot determine this.');
    expect(result.matched).toBe(false);
    expect(result.warning).toMatch(/unparseable/i);
  });
});
