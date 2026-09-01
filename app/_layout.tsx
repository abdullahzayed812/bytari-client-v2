import '@/lib/bootstrapDirection';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { View } from 'react-native';

import { AppSplash } from '@/components/feedback';
import { AuthRedirector } from '@/navigation/AuthRedirector';
import {
  AppProviders,
  NotificationsGate,
  RealtimeGate,
  SessionCacheGate,
  useAppBootstrap,
} from '@/providers';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const { ready } = useAppBootstrap();

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <AppSplash />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={onLayout}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <SessionCacheGate />
      <RealtimeGate />
      <NotificationsGate />
      <AuthRedirector />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
