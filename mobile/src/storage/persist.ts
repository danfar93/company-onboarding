/**
 * Persistence seam — the only place AsyncStorage is touched.
 *
 * The whole OnboardingState is written under a versioned key. Load discards a
 * blob whose schema version doesn't match (migrate-or-drop), and every call
 * swallows storage errors so a flaky disk never crashes the flow.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  STORAGE_VERSION,
  type OnboardingState,
} from '../state/onboarding';

const KEY = 'onboarding@v1'; // versioned -> migratable

export async function save(state: OnboardingState): Promise<void> {
  try {
    const blob = JSON.stringify({ ...state, updatedAt: Date.now() });
    await AsyncStorage.setItem(KEY, blob);
  } catch {
    // Best-effort — losing one autosave is fine; the next will retry.
  }
}

export async function load(): Promise<OnboardingState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    if (!parsed || parsed.version !== STORAGE_VERSION) return null; // stale shape
    return parsed;
  } catch {
    return null;
  }
}

export async function clear(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
