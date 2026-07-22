import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Confidence, Field } from '@shared/types';
import { useOnboarding } from '../state/OnboardingContext';
import type { EditableField } from '../state/onboarding';
import { colors, radius, shadow, spacing, typography } from '../theme';

const FIELD_ORDER: Field[] = [
  'name',
  'registrationNumber',
  'registeredAddress',
  'incorporationDate',
  'companyType',
  'industry',
  'status',
];

const FIELD_LABELS: Record<Field, string> = {
  name: 'Company Name',
  registrationNumber: 'Registration Number',
  registeredAddress: 'Registered Address',
  incorporationDate: 'Incorporation Date',
  companyType: 'Company Type',
  industry: 'Industry',
  status: 'Status',
};

export function ReviewScreen() {
  const { state, dispatch } = useOnboarding();

  return (
    <View>
      <Stepper
        current="review"
        reachedIndex={state.maxReached}
        onSelect={(step) => dispatch({ type: 'GO_TO_STEP', step })}
      />

      <Text style={styles.h1}>Review your details</Text>
      <Text style={styles.subtitle}>
        We've pulled this in for you. Edit anything that's off, or fill in what
        we couldn't find.
      </Text>

      <View style={styles.card}>
        {FIELD_ORDER.map((field, i) => (
          <FieldRow
            key={field}
            label={FIELD_LABELS[field]}
            field={state.fields[field]}
            last={i === FIELD_ORDER.length - 1}
            onCommit={(value) => dispatch({ type: 'EDIT_FIELD', field, value })}
          />
        ))}
      </View>

      {state.warnings.length > 0 && (
        <View style={styles.warnBox}>
          {state.warnings.map((w, i) => (
            <Text key={i} style={styles.warnText}>
              • {w}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function FieldRow(props: {
  label: string;
  field: EditableField | undefined;
  last: boolean;
  onCommit: (value: string) => void;
}) {
  const committed = props.field ? toText(props.field.value) : '';
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  // Re-seed from state if the value changes underneath while we're not editing
  // (e.g. hydration, or a reset).
  useEffect(() => {
    if (!focused) setText(committed);
  }, [committed, focused]);

  const commit = () => {
    setFocused(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== committed) props.onCommit(trimmed);
    else if (!trimmed) setText(committed); // don't blank out an existing value
  };

  const conf = props.field?.confidence;
  return (
    <View style={[styles.row, !props.last && styles.rowDivider]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        {conf ? (
          <View style={[styles.pill, CONF_PILL[conf]]}>
            <Text style={[styles.pillText, CONF_PILL_TEXT[conf]]}>{conf}</Text>
          </View>
        ) : (
          <View style={[styles.pill, styles.notFoundPill]}>
            <Text style={[styles.pillText, styles.notFoundPillText]}>
              Not found
            </Text>
          </View>
        )}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        placeholder={`Add ${props.label.toLowerCase()}`}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, focused && styles.inputFocused]}
      />

      {props.field && (
        <View style={[styles.pill, styles.sourcePill]}>
          <Text style={[styles.pillText, styles.sourcePillText]}>
            {props.field.source}
          </Text>
        </View>
      )}
    </View>
  );
}

function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .filter((v) => typeof v === 'string' && v.trim())
      .join(', ');
  }
  return String(value);
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  row: { paddingVertical: spacing.lg },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowLabel: { ...typography.label, color: colors.textSecondary },

  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputFocused: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },

  // Pills (shared shape)
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // Confidence colour coding: green / amber / red
  pillHigh: { backgroundColor: colors.accentTint },
  pillMedium: { backgroundColor: colors.warningTint },
  pillLow: { backgroundColor: colors.dangerTint },
  pillTextHigh: { color: colors.accentDark },
  pillTextMedium: { color: colors.warning },
  pillTextLow: { color: colors.danger },

  // Source pill: neutral
  sourcePill: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourcePillText: { color: colors.textSecondary, textTransform: 'none' },

  // Not-found pill: muted
  notFoundPill: { backgroundColor: colors.surfaceAlt },
  notFoundPillText: { color: colors.textMuted, textTransform: 'none' },

  warnBox: {
    backgroundColor: colors.warningTint,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  warnText: { fontSize: 12, color: colors.warning },
});

const CONF_PILL: Record<Confidence, object> = {
  high: styles.pillHigh,
  medium: styles.pillMedium,
  low: styles.pillLow,
};

const CONF_PILL_TEXT: Record<Confidence, object> = {
  high: styles.pillTextHigh,
  medium: styles.pillTextMedium,
  low: styles.pillTextLow,
};
