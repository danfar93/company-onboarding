import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Step } from '../onboarding';
import type { EnrichResponse } from '../types';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function ReviewScreen(props: {
  result: EnrichResponse;
  reachedIndex: number;
  onSelect: (step: Step) => void;
}) {
  // TODO (candidate): replace this JSON dump with a proper review UI.
  // - Show each field with its source and confidence
  // - Highlight low-confidence fields
  // - Make fields editable so the user can correct mistakes
  return (
    <View>
      <Stepper
        current="review"
        reachedIndex={props.reachedIndex}
        onSelect={props.onSelect}
      />

      <Text style={styles.h1}>Review your details</Text>
      <Text style={styles.subtitle}>
        We've pulled this in for you. Check it over before continuing.
      </Text>

      <View style={styles.jsonBox}>
        <Text style={styles.jsonText}>
          {JSON.stringify(props.result, null, 2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
  jsonBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  jsonText: { fontFamily: 'Menlo', fontSize: 12, color: colors.textPrimary },
});
