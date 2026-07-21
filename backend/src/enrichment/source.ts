/**
 * Internal source-adapter contract (backend-only; not part of the shared
 * contract with mobile).
 *
 * Every data source is a function that takes the normalised input plus injected
 * dependencies and returns a SourceResult: the fields it found, its confidence
 * per field, whether it positively matched, and an optional warning. A minimal
 * FetchLike is injected so sources are unit-testable with a stub — no live keys
 * or network needed.
 */
import type { Company, Confidence, Field, SourceName } from './types';

export interface HttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

export interface FetchLike {
  (
    url: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      signal?: any;
    }
  ): Promise<HttpResponse>;
}

export interface SourceDeps {
  fetch: FetchLike;
}

export interface SourceResult {
  source: SourceName;
  /** Did this source positively identify the company? Drives the cascade. */
  matched: boolean;
  /** Fields this source established. */
  company: Partial<Company>;
  /** Per-field confidence for the fields it set. */
  confidence: Partial<Record<Field, Confidence>>;
  /** Set when the source failed or degraded, for transparency. */
  warning?: string;
}

/** Lower a confidence by one notch (for coarser, derived fields). */
export function weaken(c: Confidence): Confidence {
  return c === 'high' ? 'medium' : c === 'medium' ? 'low' : 'low';
}
