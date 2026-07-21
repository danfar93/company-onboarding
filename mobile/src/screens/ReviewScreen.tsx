import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Field } from '@shared/types';
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

// TODO (next): replace this read-only list with editable FieldRow +
// ConfidenceBadge components — highlight low-confidence fields, allow edits.
export function ReviewScreen() {
  const { state, dispatch } = useOnboarding();
  const present = FIELD_ORDER.filter((f) => state.fields[f] !== undefined);

  return (
    <View>
      <Stepper
        current="review"
        reachedIndex={state.maxReached}
        onSelect={(step) => dispatch({ type: 'GO_TO_STEP', step })}
      />

      <Text style={styles.h1}>Review your details</Text>
      <Text style={styles.subtitle}>
        We've pulled this in for you. Check it over before continuing.
      </Text>

      {present.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>
            We couldn't find company details automatically. You can still
            continue.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {present.map((field, i) => (
            <FieldRow
              key={field}
              label={FIELD_LABELS[field]}
              field={state.fields[field]!}
              last={i === present.length - 1}
            />
          ))}
        </View>
      )}

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
  field: EditableField;
  last: boolean;
}) {
  const low = props.field.confidence === 'low';
  return (
    <View style={[styles.row, !props.last && styles.rowDivider]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        <View
          style={[
            styles.badge,
            low ? styles.badgeLow : styles.badgeOk,
          ]}
        >
          <Text style={[styles.badgeText, low ? styles.badgeTextLow : styles.badgeTextOk]}>
            {props.field.confidence}
          </Text>
        </View>
      </View>
      <Text style={styles.rowValue}>{formatValue(props.field.value)}</Text>
      <Text style={styles.rowSource}>From {props.field.source}</Text>
    </View>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return '—';
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
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.xs,
  },
  rowLabel: { ...typography.label, color: colors.textSecondary },
  rowValue: { ...typography.title, marginBottom: 2 },
  rowSource: { fontSize: 12, color: colors.textMuted },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeOk: { backgroundColor: colors.brandTint },
  badgeLow: { backgroundColor: colors.warningTint },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  badgeTextOk: { color: colors.brandDark },
  badgeTextLow: { color: colors.warning },
  warnBox: {
    backgroundColor: colors.warningTint,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  warnText: { fontSize: 12, color: colors.warning },
});
