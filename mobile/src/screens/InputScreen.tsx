import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Stepper } from '../components/Stepper';
import type { Step } from '../onboarding';
import type { InputValidation } from '../validation';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function InputScreen(props: {
  email: string;
  website: string;
  onChangeEmail: (value: string) => void;
  onChangeWebsite: (value: string) => void;
  reachedIndex: number;
  onSelect: (step: Step) => void;
  validation: InputValidation;
}) {
  const [focused, setFocused] = useState<'email' | 'website' | null>(null);
  const { validation } = props;

  const emailTouched = props.email.trim() !== '';
  const websiteTouched = props.website.trim() !== '';

  // Only surface messages once a field has content and isn't being edited, so we
  // don't nag mid-typing.
  const showEmailError =
    emailTouched && !validation.emailValid && focused !== 'email';
  const showMismatch =
    websiteTouched && validation.websiteMismatch && focused !== 'website';

  // Offer autofill when the email yields a business domain the website doesn't
  // already contain.
  const canAutofill =
    validation.suggestedWebsite !== null &&
    props.website.trim() !== validation.suggestedWebsite;

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
            style={[
              styles.input,
              focused === 'email' && styles.inputFocused,
              showEmailError && styles.inputError,
            ]}
          />
          {showEmailError && (
            <Text style={styles.errorText}>
              Enter a valid email address
            </Text>
          )}
        </View>

        <View style={styles.fieldLast}>
          <View style={styles.labelRow}>
            <Text style={styles.labelInline}>Company Website</Text>
            {canAutofill && (
              <Pressable
                onPress={() =>
                  props.onChangeWebsite(validation.suggestedWebsite ?? '')
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Autofill website from email domain"
              >
                <Text style={styles.autofillLink}>
                  Use {validation.emailDomain}
                </Text>
              </Pressable>
            )}
          </View>
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
            style={[
              styles.input,
              focused === 'website' && styles.inputFocused,
              showMismatch && styles.inputWarning,
            ]}
          />
          {showMismatch && (
            <Text style={styles.warnText}>
              This doesn't match your email domain ({validation.emailDomain})
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
  label: { ...typography.label, marginBottom: spacing.sm },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelInline: { ...typography.label },
  autofillLink: { fontSize: 13, fontWeight: '600', color: colors.brand },
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
  inputError: { borderColor: colors.danger },
  inputWarning: { borderColor: colors.danger },
  errorText: { marginTop: spacing.sm, fontSize: 13, color: colors.danger },
  warnText: { marginTop: spacing.sm, fontSize: 13, color: colors.danger },
});
