import { describe, expect, it } from 'vitest';

import type { EnrichResponse } from '@shared/types';

import { toFieldMap } from './map';

const response: EnrichResponse = {
  company: {
    name: 'Acme Ltd',
    registrationNumber: '12345678',
    industry: 'Software',
  },
  enrichment: {
    sources: ['Companies House', 'LLM Inference'],
    confidence: { name: 'high', registrationNumber: 'high', industry: 'low' },
    fieldSources: {
      name: 'Companies House',
      registrationNumber: 'Companies House',
      industry: 'LLM Inference',
    },
    warnings: [],
  },
};

describe('toFieldMap', () => {
  it('wraps each company field with its source and confidence', () => {
    const map = toFieldMap(response);
    expect(map.name).toEqual({
      value: 'Acme Ltd',
      source: 'Companies House',
      confidence: 'high',
      edited: false,
    });
    expect(map.industry?.source).toBe('LLM Inference');
    expect(map.industry?.confidence).toBe('low');
  });

  it('omits fields absent from the company record', () => {
    const map = toFieldMap(response);
    expect(map.status).toBeUndefined();
    expect(map.registeredAddress).toBeUndefined();
  });

  it('returns an empty map for an empty company', () => {
    const empty = toFieldMap({
      company: {},
      enrichment: { sources: [], confidence: {}, fieldSources: {}, warnings: [] },
    });
    expect(empty).toEqual({});
  });
});
