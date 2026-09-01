import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/actions';
import { Caption, Heading } from '@/components/typography';
import { isRTL } from '@/lib/rtl';
import { useTheme } from '@/theme';

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the form (e.g. the "no account? register" link). */
  footer?: ReactNode;
  /** Hide the back control (e.g. for the first screen in a stack). */
  showBack?: boolean;
}

/**
 * Shared shell for the auth screens. Handles safe areas + keyboard avoidance
 * (§27) and renders the back control + title. All auth screens use this so
 * they share one visual style (§25).
 *
 * The back chevron is pinned to the physical left in both languages — the
 * reference design keeps auth-flow navigation chrome top-left regardless of
 * RTL, unlike the rest of the app's logical (start/end) header.
 */
export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
  showBack = true,
}: AuthScreenLayoutProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'bottom']}
    >
      {showBack ? (
        <View
          style={{
            alignItems: isRTL() ? 'flex-end' : 'flex-start',
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.xs,
          }}
        >
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: theme.screenPadding,
            paddingVertical: theme.spacing.xxxl,
          }}
        >
          <View style={{ alignItems: 'flex-start', marginBottom: theme.spacing.xxxl }}>
            <Heading level={1}>{title}</Heading>
            {subtitle ? <Caption>{subtitle}</Caption> : null}
          </View>

          <View style={{ rowGap: theme.spacing.lg }}>{children}</View>

          {footer ? <View style={{ marginTop: theme.spacing.xxl }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
