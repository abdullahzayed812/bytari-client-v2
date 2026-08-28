import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/feedback';
import { createQueryClient } from '@/lib/queryClient';
import { usePreferencesStore } from '@/store';
import { ThemeProvider } from '@/theme';

/**
 * Global provider stack. Order matters:
 * SafeArea → GestureHandler → Query → Theme (reads preferences) → Toast.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const themePreference = usePreferencesStore((s) => s.themePreference);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider preference={themePreference}>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
