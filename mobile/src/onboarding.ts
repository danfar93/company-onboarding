/**
 * The onboarding wizard's steps. Kept in one place so the router, the progress
 * indicator and the state reducer all agree on the order and labels.
 *
 * `icon` is a literal union of the Feather glyph names we use — this keeps the
 * module free of any React Native runtime import, so the pure state logic that
 * depends on it stays testable in a plain Node environment.
 */
export type Step = 'input' | 'review' | 'confirm';

export type StepIcon = 'edit-3' | 'list' | 'check';

export const STEPS: { key: Step; label: string; icon: StepIcon }[] = [
  { key: 'input', label: 'Details', icon: 'edit-3' },
  { key: 'review', label: 'Review', icon: 'list' },
  { key: 'confirm', label: 'Confirm', icon: 'check' },
];

export const stepIndex = (step: Step) => STEPS.findIndex((s) => s.key === step);
