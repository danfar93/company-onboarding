/**
 * Onboarding state: one serialisable object driven by a pure reducer.
 *
 * The whole object is the unit of persistence, and because every change is an
 * explicit, serialisable action, persistence and testing both fall out for
 * free. The reducer has no I/O — network and storage live at the edges
 * (the thunk in OnboardingContext, the persist layer) — so transitions can be
 * unit-tested exhaustively.
 */
import type { Confidence, Field, SourceName } from '@shared/types';

import { stepIndex, type Step } from '../onboarding';

/** Bumped when the stored shape changes, so old blobs are discarded on load. */
export const STORAGE_VERSION = 1 as const;

/** A single reviewable field: its value plus where it came from and how edited. */
export interface EditableField {
  value: unknown;
  source: SourceName;
  confidence: Confidence;
  edited: boolean; // true once the user overrides it (source becomes 'User Input')
}

export type FieldMap = Partial<Record<Field, EditableField>>;

export type Status = 'idle' | 'enriching' | 'error' | 'ready';

export interface OnboardingState {
  version: number;
  step: Step;
  /** Furthest step unlocked — drives which stepper nodes are tappable. */
  maxReached: number;
  input: { email: string; website: string };
  fields: FieldMap;
  sources: SourceName[];
  status: Status;
  error: string | null;
  warnings: string[];
  /** Stamped by the persist layer on save; used for staleness checks. */
  updatedAt: number;
}

export const initialState: OnboardingState = {
  version: STORAGE_VERSION,
  step: 'input',
  maxReached: 0,
  input: { email: '', website: '' },
  fields: {},
  sources: [],
  status: 'idle',
  error: null,
  warnings: [],
  updatedAt: 0,
};

export type Action =
  | { type: 'HYDRATE'; state: OnboardingState }
  | { type: 'SET_INPUT'; email?: string; website?: string }
  | { type: 'ENRICH_START' }
  | {
      type: 'ENRICH_SUCCESS';
      fields: FieldMap;
      sources: SourceName[];
      warnings: string[];
    }
  | { type: 'ENRICH_ERROR'; message: string }
  | { type: 'EDIT_FIELD'; field: Field; value: unknown }
  | { type: 'GO_TO_STEP'; step: Step }
  | { type: 'RESET' };

export function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'HYDRATE':
      // A transient 'enriching' status can't survive a kill — reset it to idle
      // so we can cleanly re-run rather than restore a spinner that never ends.
      return action.state.status === 'enriching'
        ? { ...action.state, status: 'idle' }
        : action.state;

    case 'SET_INPUT':
      return {
        ...state,
        error: null,
        input: {
          email: action.email ?? state.input.email,
          website: action.website ?? state.input.website,
        },
      };

    case 'ENRICH_START':
      return { ...state, status: 'enriching', error: null };

    case 'ENRICH_SUCCESS':
      return {
        ...state,
        fields: action.fields,
        sources: action.sources,
        warnings: action.warnings,
        status: 'ready',
        step: 'review',
        maxReached: Math.max(state.maxReached, stepIndex('review')),
      };

    case 'ENRICH_ERROR':
      return { ...state, status: 'error', error: action.message };

    case 'EDIT_FIELD':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: {
            value: action.value,
            source: 'User Input',
            confidence: 'high',
            edited: true,
          },
        },
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.step,
        maxReached: Math.max(state.maxReached, stepIndex(action.step)),
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
