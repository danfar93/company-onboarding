import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Step } from '../onboarding';
import { colors, radius, spacing, typography } from '../theme';

export function ConfirmScreen(props: {
  reachedIndex: number;
  onSelect: (step: Step) => void;
}) {
  // TODO (candidate): make this feel like a real success screen.
  return (
    <View>
      <Stepper
        current="confirm"
        reachedIndex={props.reachedIndex}
        onSelect={props.onSelect}
      />

      <View style={styles.confirmBox}>
        <View style={styles.successBadge}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.h1}>You're all set</Text>
        <Text style={styles.subtitle}>Company details saved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
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
});
