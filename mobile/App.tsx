import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from './src/components/PrimaryButton';
import { InputScreen } from './src/screens/InputScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ConfirmScreen } from './src/screens/ConfirmScreen';
import { OnboardingProvider, useOnboarding } from './src/state/OnboardingContext';
import { validateInput } from './src/validation';
import { colors, radius, spacing } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <Onboarding />
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

function Onboarding() {
  const { state, dispatch, runEnrichment, saveCompany } = useOnboarding();
  const validation = validateInput(state.input.email, state.input.website);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {/*
        KeyboardAvoidingView keeps the pinned footer (and its button) above the
        keyboard. On iOS we pad by the keyboard height; on Android the window's
        adjustResize already shrinks the view, so no behavior is set.
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
          {state.step === 'input' && <InputScreen />}
          {state.step === 'review' && <ReviewScreen />}
          {state.step === 'confirm' && <ConfirmScreen />}
        </ScrollView>

        <View style={styles.footer}>
          {state.step === 'input' && state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {state.step === 'input' && (
            <PrimaryButton
              label={state.status === 'error' ? 'Try again' : 'Continue'}
              onPress={() => runEnrichment()}
              loading={state.status === 'enriching'}
              disabled={!validation.canContinue}
            />
          )}

          {state.step === 'input' && state.status === 'error' && (
            <Pressable
              onPress={() => dispatch({ type: 'PROCEED_MANUALLY' })}
              style={styles.secondaryButton}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                Enter details manually
              </Text>
            </Pressable>
          )}

          {state.step === 'review' && (
            <PrimaryButton
              label={state.status === 'saving' ? 'Saving…' : 'Looks good'}
              onPress={() => saveCompany()}
              loading={state.status === 'saving'}
            />
          )}

          {state.step === 'confirm' && (
            <PrimaryButton
              label="Onboard another company"
              onPress={() => dispatch({ type: 'RESET' })}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  // Secondary action (e.g. proceed manually after an enrichment error)
  secondaryButton: { alignItems: 'center', paddingVertical: spacing.sm },
  secondaryButtonText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: '600',
  },
});
