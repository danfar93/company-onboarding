import { describe, expect, it } from 'vitest';

import { assemble } from './merge';
import type { SourceResult } from './source';

const chResult: SourceResult = {
  source: 'Companies House',
  matched: true,
  company: { name: 'Acme Ltd', registrationNumber: '12345678' },
  confidence: { name: 'high', registrationNumber: 'high' },
};

describe('assemble', () => {
  it('collects fields, provenance and confidence from a single source', () => {
    const res = assemble([chResult]);
    expect(res.company).toEqual({
      name: 'Acme Ltd',
      registrationNumber: '12345678',
    });
    expect(res.enrichment.fieldSources.name).toBe('Companies House');
    expect(res.enrichment.confidence.registrationNumber).toBe('high');
    expect(res.enrichment.sources).toEqual(['Companies House']);
    expect(res.enrichment.warnings).toEqual([]);
  });

  it('gap-fills: the first source to provide a field wins it', () => {
    const website: SourceResult = {
      source: 'Company Website',
      matched: true,
      company: { name: 'Acme (self-reported)', industry: 'Software' },
      confidence: { name: 'medium', industry: 'low' },
    };
    const res = assemble([chResult, website]);
    // CH provided name first, so it wins; website only fills the new field.
    expect(res.company.name).toBe('Acme Ltd');
    expect(res.enrichment.fieldSources.name).toBe('Companies House');
    expect(res.company.industry).toBe('Software');
    expect(res.enrichment.fieldSources.industry).toBe('Company Website');
    expect(res.enrichment.sources).toEqual([
      'Companies House',
      'Company Website',
    ]);
  });

  it('surfaces warnings and only credits sources that contributed', () => {
    const chMiss: SourceResult = {
      source: 'Companies House',
      matched: false,
      company: {},
      confidence: {},
      warning: 'No confident Companies House match',
    };
    const website: SourceResult = {
      source: 'Company Website',
      matched: true,
      company: { name: 'Supabase' },
      confidence: { name: 'medium' },
    };
    const res = assemble([chMiss, website]);
    expect(res.enrichment.warnings).toEqual(['No confident Companies House match']);
    expect(res.enrichment.sources).toEqual(['Company Website']);
  });
});
