import Feather from '@expo/vector-icons/Feather';

/**
 * The onboarding wizard's steps. Kept in one place so the router, the progress
 * indicator and (later) the state reducer all agree on the order and labels.
 *
 * Plan note: at build step 4 this module grows into the OnboardingState reducer
 * + actions; the Step type and STEPS config are the seam that slots into.
 */
export type Step = 'input' | 'review' | 'confirm';

export const STEPS: {
  key: Step;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: 'input', label: 'Details', icon: 'edit-3' },
  { key: 'review', label: 'Review', icon: 'list' },
  { key: 'confirm', label: 'Confirm', icon: 'check' },
];

export const stepIndex = (step: Step) => STEPS.findIndex((s) => s.key === step);
