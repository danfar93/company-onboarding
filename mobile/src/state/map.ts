/**
 * Pure mapper: EnrichResponse -> editable field map.
 *
 * The reducer never sees a raw API shape — the thunk runs this first, so the
 * response-to-fields translation is a small pure function that's easy to test.
 */
import type { EnrichResponse, Field } from '@shared/types';

import type { EditableField, FieldMap } from './onboarding';

export function toFieldMap(res: EnrichResponse): FieldMap {
  const { company, enrichment } = res;
  const map: FieldMap = {};

  for (const key of Object.keys(company) as Field[]) {
    const value = company[key];
    if (value === undefined || value === null) continue;

    const field: EditableField = {
      value,
      source: enrichment.fieldSources[key] ?? 'Companies House',
      confidence: enrichment.confidence[key] ?? 'low',
      edited: false,
    };
    map[key] = field;
  }

  return map;
}
