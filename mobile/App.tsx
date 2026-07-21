import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { enrich } from './src/api';
import type { EnrichResponse } from './src/types';
import { colors, radius, shadow, spacing, typography } from './src/theme';

type Step = 'input' | 'review' | 'confirm';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrichResponse | null>(null);

  // TODO (candidate): the in-progress flow should survive the app being
  // backgrounded or killed. If the user closes the app on the Review step,
  // they should resume there (with their edits) when they reopen it.
  // Pick a persistence library (AsyncStorage, MMKV, SecureStore...) and
  // wire it up. Be intentional about what you persist and when you clear it.

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enrich({ email, website });
      setResult(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    // TODO (candidate): in a real app this would POST to a save endpoint.
    setStep('confirm');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {/*
          KeyboardAvoidingView keeps the pinned footer (and its button) above
          the keyboard. On iOS we pad by the keyboard height; on Android the
          window's adjustResize already shrinks the view, so no behavior is set.
        */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'input' && (
              <InputStep
                email={email}
                website={website}
                onChangeEmail={setEmail}
                onChangeWebsite={setWebsite}
              />
            )}

            {step === 'review' && result && <ReviewStep result={result} />}

            {step === 'confirm' && <ConfirmStep />}
          </ScrollView>

          {step !== 'confirm' && (
            <View style={styles.footer}>
              {step === 'input' && error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {step === 'input' && (
                <PrimaryButton
                  label="Continue"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!email || !website}
                />
              )}

              {step === 'review' && (
                <PrimaryButton label="Looks good" onPress={handleConfirm} />
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PrimaryButton(props: {
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

function InputStep(props: {
  email: string;
  website: string;
  onChangeEmail: (value: string) => void;
  onChangeWebsite: (value: string) => void;
}) {
  const [focused, setFocused] = useState<'email' | 'website' | null>(null);

  return (
    <View>
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

function ReviewStep(props: { result: EnrichResponse }) {
  // TODO (candidate): replace this JSON dump with a proper review UI.
  // - Show each field with its source and confidence
  // - Highlight low-confidence fields
  // - Make fields editable so the user can correct mistakes
  return (
    <View>
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

function ConfirmStep() {
  // TODO (candidate): make this feel like a real success screen.
  return (
    <View style={styles.confirmBox}>
      <View style={styles.successBadge}>
        <Text style={styles.successCheck}>✓</Text>
      </View>
      <Text style={styles.h1}>You're all set</Text>
      <Text style={styles.subtitle}>Company details saved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xl, flexGrow: 1 },

  // Typography
  h1: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xxl },
  label: { ...typography.label, marginBottom: spacing.sm },

  // Card / inputs
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

  // Pinned footer action bar
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },

  // Buttons
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

  // Error
  errorBox: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerTint,
    borderRadius: radius.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },

  // JSON preview (placeholder until Review UI is built)
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

  // Success
  confirmBox: { paddingTop: 80, alignItems: 'center' },
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
