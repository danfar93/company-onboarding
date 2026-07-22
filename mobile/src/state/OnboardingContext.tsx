/**
 * Onboarding provider: holds the reducer state, exposes it via context, and
 * owns the two side effects the reducer deliberately doesn't — the network
 * (the runEnrichment thunk) and persistence.
 *
 * Persistence behaviours (survive background / kill):
 *   1. Debounced autosave on every state change (avoids thrashing on keystrokes).
 *   2. Immediate flush on AppState 'background'/'inactive' — the debounce timer
 *      may not fire before the OS suspends the process.
 *   3. Hydrate on mount before first paint (children render only once hydrated).
 *   4. Clear on reaching 'confirm'; a kill mid-enrichment resumes by re-running.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { enrich } from '../api';
import { clear, load, save } from '../storage/persist';
import { toFieldMap } from './map';
import {
  initialState,
  reducer,
  type Action,
  type OnboardingState,
} from './onboarding';

const SAVE_DEBOUNCE_MS = 400;

/** Mock persisting the confirmed company record to a backend save endpoint. */
const SAVE_LATENCY_MS = 1200;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface OnboardingContextValue {
  state: OnboardingState;
  dispatch: React.Dispatch<Action>;
  /** Run the enrichment request for the current input (or an override). */
  runEnrichment: (override?: { email: string; website: string }) => Promise<void>;
  /** Mock-save the reviewed record, then advance to the confirmation screen. */
  saveCompany: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Always-current snapshot for effects that must read state without re-subscribing.
  const latest = useRef(state);
  latest.current = state;

  const runEnrichment = useCallback(
    async (override?: { email: string; website: string }) => {
      const input = override ?? latest.current.input;
      dispatch({ type: 'ENRICH_START' });
      try {
        const res = await enrich(input);
        dispatch({
          type: 'ENRICH_SUCCESS',
          fields: toFieldMap(res),
          sources: res.enrichment.sources,
          warnings: res.enrichment.warnings,
        });
      } catch (err) {
        dispatch({
          type: 'ENRICH_ERROR',
          message: err instanceof Error ? err.message : 'Something went wrong',
        });
      }
    },
    []
  );

  const saveCompany = useCallback(async () => {
    dispatch({ type: 'SAVE_START' });
    // TODO (real app): POST the confirmed record to a save endpoint. Mocked here
    // with a short delay so the saving state is exercised end-to-end.
    await wait(SAVE_LATENCY_MS);
    dispatch({ type: 'SAVE_SUCCESS' });
  }, []);

  // (3) Hydrate on mount, before first paint. If a kill interrupted enrichment,
  // resume it with the stored input.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await load();
      if (!active) return;
      if (stored) {
        dispatch({ type: 'HYDRATE', state: stored });
        if (
          stored.status === 'enriching' &&
          stored.input.email &&
          stored.input.website
        ) {
          runEnrichment(stored.input);
        }
      }
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [runEnrichment]);

  // (1) Debounced autosave; (4) clear once the flow is confirmed/done.
  useEffect(() => {
    if (!hydrated) return; // don't overwrite storage before we've read it
    if (state.step === 'confirm') {
      clear();
      return;
    }
    const id = setTimeout(() => save(state), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [state, hydrated]);

  // (2) Immediate flush when the app is backgrounded — the debounce may not fire.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        const current = latest.current;
        if (current.step !== 'confirm') save(current);
      }
    });
    return () => sub.remove();
  }, []);

  if (!hydrated) return null; // brief; avoids flashing input before resuming

  return (
    <OnboardingContext.Provider
      value={{ state, dispatch, runEnrichment, saveCompany }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
