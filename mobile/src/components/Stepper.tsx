import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { STEPS, stepIndex, type Step } from '../onboarding';
import { colors, radius, shadow, spacing } from '../theme';

/**
 * Progress indicator for the onboarding wizard. Each stage is a tappable node:
 * steps the user has already unlocked (up to `reachedIndex`) can be selected to
 * move back or forward; the current step and not-yet-reached steps are inert.
 */
export function Stepper(props: {
  current: Step;
  reachedIndex: number;
  onSelect: (step: Step) => void;
}) {
  const currentIndex = stepIndex(props.current);

  return (
    <View style={styles.stepper}>
      {STEPS.map((s, i) => {
        const completed = i < currentIndex;
        const active = i === currentIndex;
        const filled = completed || active;
        const selectable = i <= props.reachedIndex && !active;

        return (
          <Fragment key={s.key}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperItem,
                pressed && selectable && styles.stepperItemPressed,
              ]}
              onPress={() => props.onSelect(s.key)}
              disabled={!selectable}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !selectable }}
              accessibilityLabel={`${s.label} step`}
            >
              <View
                style={[
                  styles.stepNode,
                  filled ? styles.stepNodeFilled : styles.stepNodeIdle,
                  active && styles.stepNodeActive,
                ]}
              >
                <Feather
                  name={s.icon}
                  size={18}
                  color={filled ? colors.textInverse : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  completed && styles.stepLabelDone,
                  active && styles.stepLabelActive,
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </Pressable>

            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  completed
                    ? styles.stepConnectorActive
                    : styles.stepConnectorIdle,
                ]}
              />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sits inside the padded scroll content, so no horizontal padding of its own.
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  stepperItem: { alignItems: 'center', width: 64 },
  stepperItemPressed: { opacity: 0.6 },
  stepNode: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNodeIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepNodeFilled: { backgroundColor: colors.brand },
  stepNodeActive: {
    ...shadow.card,
    shadowColor: colors.brand,
    shadowOpacity: 0.35,
  },
  stepLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  stepLabelDone: { color: colors.textSecondary },
  stepLabelActive: { color: colors.brand, fontWeight: '600' },
  stepConnector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginTop: 19, // aligns to the 40px node's vertical centre
  },
  stepConnectorActive: { backgroundColor: colors.brand },
  stepConnectorIdle: { backgroundColor: colors.border },
});
