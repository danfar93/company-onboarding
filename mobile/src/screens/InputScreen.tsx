import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Step } from '../onboarding';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function InputScreen(props: {
  email: string;
  website: string;
  onChangeEmail: (value: string) => void;
  onChangeWebsite: (value: string) => void;
  reachedIndex: number;
  onSelect: (step: Step) => void;
}) {
  const [focused, setFocused] = useState<'email' | 'website' | null>(null);

  return (
    <View>
      <Stepper
        current="input"
        reachedIndex={props.reachedIndex}
        onSelect={props.onSelect}
      />

      <Text style={styles.h1}>Company Onboarding</Text>
      <Text style={styles.subtitle}>
        Enter your details and we'll fill in the rest
      </Text>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Work Email</Text>
          <TextInput
            value={props.email}
            onChangeText={props.onChangeEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            placeholder="you@company.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={[styles.input, focused === 'email' && styles.inputFocused]}
          />
        </View>

        <View style={styles.fieldLast}>
          <Text style={styles.label}>Company Website</Text>
          <TextInput
            value={props.website}
            onChangeText={props.onChangeWebsite}
            onFocus={() => setFocused('website')}
            onBlur={() => setFocused(null)}
            placeholder="https://company.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            style={[styles.input, focused === 'website' && styles.inputFocused]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
  label: { ...typography.label, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  field: { marginBottom: spacing.lg },
  fieldLast: { marginBottom: 0 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
});
