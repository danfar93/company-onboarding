import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import { useOnboarding } from '../state/OnboardingContext';
import { colors, radius, spacing, typography } from '../theme';

export function ConfirmScreen() {
  const { state, dispatch } = useOnboarding();

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
