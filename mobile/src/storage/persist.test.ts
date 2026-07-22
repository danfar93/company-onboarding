import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory AsyncStorage stand-in (created before the mock factory runs).
const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: async (key: string, value: string) => {
      mem.set(key, value);
    },
    getItem: async (key: string) => (mem.has(key) ? mem.get(key)! : null),
    removeItem: async (key: string) => {
      mem.delete(key);
    },
  },
}));

import { initialState } from '../state/onboarding';
import { clear, load, save } from './persist';

const KEY = 'onboarding@v1';

beforeEach(() => mem.clear());

describe('persist', () => {
  it('round-trips state and stamps updatedAt on save', async () => {
    const state = { ...initialState, input: { email: 'a@b.com', website: 'b.com' } };
    await save(state);

    const loaded = await load();
    expect(loaded?.input).toEqual(state.input);
    expect(loaded?.updatedAt).toBeGreaterThan(0);
  });

  it('returns null when nothing is stored', async () => {
    expect(await load()).toBeNull();
  });

  it('discards a blob whose schema version does not match', async () => {
    mem.set(KEY, JSON.stringify({ ...initialState, version: 999 }));
    expect(await load()).toBeNull();
  });

  it('clear removes the stored blob', async () => {
    await save(initialState);
    await clear();
    expect(await load()).toBeNull();
  });
});
