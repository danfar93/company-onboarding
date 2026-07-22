import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import { useOnboarding } from '../state/OnboardingContext';
import type { EditableField } from '../state/onboarding';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function ConfirmScreen() {
  const { state, dispatch } = useOnboarding();

  const name = fieldText(state.fields.name);
  const reg = fieldText(state.fields.registrationNumber);

  return (
    <View>
      <Stepper
        current="confirm"
        reachedIndex={state.maxReached}
        onSelect={(step) => dispatch({ type: 'GO_TO_STEP', step })}
      />

      <View style={styles.confirmBox}>
        <View style={styles.successBadge}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.h1}>You're all set</Text>
        <Text style={styles.subtitle}>
          {name ? `${name} is now onboarded.` : 'Company details saved.'}
        </Text>

        {(name || reg) && (
          <View style={styles.summary}>
            {name && <SummaryRow label="Company" value={name} />}
            {reg && (
              <SummaryRow label="Registration No." value={reg} divider />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function SummaryRow(props: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.summaryRow, props.divider && styles.summaryDivider]}>
      <Text style={styles.summaryLabel}>{props.label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {props.value}
      </Text>
    </View>
  );
}

function fieldText(field: EditableField | undefined): string | null {
  if (!field || field.value == null || typeof field.value === 'object') {
    return null;
  }
  const text = String(field.value).trim();
  return text || null;
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: {
    ...typography.subtitle,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  confirmBox: { paddingTop: 56, alignItems: 'center' },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successCheck: { fontSize: 36, color: colors.accentDark, fontWeight: '700' },

  summary: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    ...shadow.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryLabel: { ...typography.label, color: colors.textSecondary },
  summaryValue: { ...typography.title, flexShrink: 1, textAlign: 'right' },
});
