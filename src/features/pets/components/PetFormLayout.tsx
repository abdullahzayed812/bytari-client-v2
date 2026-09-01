import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

interface Props {
  title: string;
  onBack?: () => void;
  children: ReactNode;
}

/**
 * Keyboard-aware scroll shell for the pet Add/Edit forms (§22): fields stay
 * visible, the submit button stays reachable, taps outside dismiss politely.
 */
export function PetFormLayout({ title, onBack, children }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack onBack={onBack} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={theme.sizes.headerHeight}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.lg,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaScreen>
  );
}
