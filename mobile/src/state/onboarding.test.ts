import { describe, expect, it } from 'vitest';

import { initialState, reducer, type OnboardingState } from './onboarding';

const fields = {
  name: { value: 'Acme Ltd', source: 'Companies House', confidence: 'high', edited: false },
} as OnboardingState['fields'];

describe('onboarding reducer', () => {
  it('sets input and clears any prior error', () => {
    const start: OnboardingState = { ...initialState, error: 'boom', status: 'error' };
    const next = reducer(start, { type: 'SET_INPUT', email: 'a@acme.co.uk' });
    expect(next.input.email).toBe('a@acme.co.uk');
    expect(next.error).toBeNull();
  });

  it('marks enriching on start and lands on review with fields on success', () => {
    const started = reducer(initialState, { type: 'ENRICH_START' });
    expect(started.status).toBe('enriching');

    const done = reducer(started, {
      type: 'ENRICH_SUCCESS',
      fields,
      sources: ['Companies House'],
      warnings: [],
    });
    expect(done.status).toBe('ready');
    expect(done.step).toBe('review');
    expect(done.maxReached).toBe(1); // review unlocked
    expect(done.fields.name?.value).toBe('Acme Ltd');
  });

  it('EDIT_FIELD flips the field to a high-confidence User Input value', () => {
    const next = reducer(
      { ...initialState, fields },
      { type: 'EDIT_FIELD', field: 'name', value: 'Acme Limited' }
    );
    expect(next.fields.name).toEqual({
      value: 'Acme Limited',
      source: 'User Input',
      confidence: 'high',
      edited: true,
    });
  });

  it('PROCEED_MANUALLY routes to an empty, editable review with a warning', () => {
    const errored: OnboardingState = {
      ...initialState,
      status: 'error',
      error: 'network down',
    };
    const next = reducer(errored, { type: 'PROCEED_MANUALLY' });
    expect(next.step).toBe('review');
    expect(next.status).toBe('ready');
    expect(next.fields).toEqual({});
    expect(next.warnings.length).toBe(1);
    expect(next.maxReached).toBe(1);
  });

  it('SAVE_START/SAVE_SUCCESS drive the saving state then confirm', () => {
    const saving = reducer({ ...initialState, step: 'review' }, { type: 'SAVE_START' });
    expect(saving.status).toBe('saving');
    const saved = reducer(saving, { type: 'SAVE_SUCCESS' });
    expect(saved.step).toBe('confirm');
    expect(saved.status).toBe('idle');
  });

  it('resets a transient status on HYDRATE so no spinner is restored', () => {
    const stored: OnboardingState = { ...initialState, status: 'enriching', step: 'input' };
    const hydrated = reducer(initialState, { type: 'HYDRATE', state: stored });
    expect(hydrated.status).toBe('idle');

    const savingStored: OnboardingState = { ...initialState, status: 'saving', step: 'review' };
    expect(reducer(initialState, { type: 'HYDRATE', state: savingStored }).status).toBe('ready');
  });

  it('RESET returns to the initial state', () => {
    const dirty: OnboardingState = {
      ...initialState,
      step: 'confirm',
      input: { email: 'a@b.com', website: 'b.com' },
      fields,
    };
    expect(reducer(dirty, { type: 'RESET' })).toEqual(initialState);
  });
});
