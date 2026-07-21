import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '../theme';

export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const disabled = props.disabled || props.loading;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {props.loading ? (
        <ActivityIndicator color={colors.textInverse} />
      ) : (
        <Text style={styles.buttonText}>{props.label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadow.card,
  },
  buttonDisabled: { backgroundColor: colors.brandDisabled, shadowOpacity: 0 },
  buttonPressed: { backgroundColor: colors.brandDark },
  buttonText: { ...typography.button, color: colors.textInverse },
});
