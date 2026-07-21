import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { enrich } from './src/api';
import type { EnrichResponse } from '@shared/types';
import { PrimaryButton } from './src/components/PrimaryButton';
import { InputScreen } from './src/screens/InputScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ConfirmScreen } from './src/screens/ConfirmScreen';
import { stepIndex, type Step } from './src/onboarding';
import { validateInput } from './src/validation';
import { colors, radius, spacing } from './src/theme';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrichResponse | null>(null);
  // Furthest step the user has unlocked. Steps up to here are tappable in the
  // progress indicator, so they can move back and forward freely.
  const [maxReached, setMaxReached] = useState(0);

  const validation = validateInput(email, website);

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
      setMaxReached((m) => Math.max(m, stepIndex('review')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    // TODO (candidate): in a real app this would POST to a save endpoint.
    setStep('confirm');
    setMaxReached((m) => Math.max(m, stepIndex('confirm')));
  };

  const handleReset = () => {
    setStep('input');
    setEmail('');
    setWebsite('');
    setResult(null);
    setError(null);
    setMaxReached(0);
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
              <InputScreen
                email={email}
                website={website}
                onChangeEmail={setEmail}
                onChangeWebsite={setWebsite}
                reachedIndex={maxReached}
                onSelect={setStep}
                validation={validation}
              />
            )}

            {step === 'review' && result && (
              <ReviewScreen
                result={result}
                reachedIndex={maxReached}
                onSelect={setStep}
              />
            )}

            {step === 'confirm' && (
              <ConfirmScreen reachedIndex={maxReached} onSelect={setStep} />
            )}
          </ScrollView>

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
                disabled={!validation.canContinue}
              />
            )}

            {step === 'review' && (
              <PrimaryButton label="Looks good" onPress={handleConfirm} />
            )}

            {step === 'confirm' && (
              <PrimaryButton
                label="Onboard another company"
                onPress={handleReset}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xl, flexGrow: 1 },

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

  // Error (input step)
  errorBox: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerTint,
    borderRadius: radius.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },
});
