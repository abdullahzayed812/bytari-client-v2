import '@/lib/bootstrapDirection';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { AppSplash, SPLASH_MIN_DURATION_MS } from '@/components/feedback';
import { ImageEditorHost } from '@/components/media';
import { isRTL } from '@/lib/rtl';
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
  // Web: react-native-web resolves inline `start`/`end`/`marginStart`/… from
  // the nearest `dir` View (its locale context, default LTR), NOT from
  // `<html dir>` — without this every logical style is laid out LTR on web.
  // Re-evaluated on every render, so a language switch updates it. Native
  // already follows `I18nManager`.
  const webDir = (Platform.OS === 'web' ? { dir: isRTL() ? 'rtl' : 'ltr' } : {}) as object;
  // The brand splash stays up for at least SPLASH_MIN_DURATION_MS (3 s) from
  // launch, even when bootstrap finishes sooner; a slower bootstrap extends it.
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const onLayout = useCallback(() => {
    // Web: tell the +html startup watchdog the app has mounted (no fallback).
    if (typeof window !== 'undefined') {
      (window as unknown as { __BYTARI_BOOTED__?: boolean }).__BYTARI_BOOTED__ = true;
      if (typeof document !== 'undefined')
        document.getElementById('bytari-boot-fallback')?.remove();
    }
    // Dismiss the native (Android 12 circular) splash as soon as the first JS
    // frame paints. <AppSplash> below then covers the screen until `ready`, so
    // a slow bootstrap never leaves the user staring at the system splash.
    void SplashScreen.hideAsync();
  }, []);

  if (!ready || !minElapsed) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayout} {...webDir}>
        <AppSplash />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      onLayout={onLayout}
      {...webDir}
    >
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
      {/* Shared crop / resize step for every picked image (see services/media/imageEditing). */}
      <ImageEditorHost />
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
