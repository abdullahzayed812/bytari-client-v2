import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';

import { AppConfig } from '@/constants/config';
import { initI18n, resolveDeviceLanguage } from '@/i18n';
import { createLogger } from '@/lib/logger';
import { useAuthStore, usePreferencesStore } from '@/store';
import { fontAssets } from '@/theme/fonts';

const log = createLogger('bootstrap');

export interface BootstrapState {
  ready: boolean;
  /** `true` if the layout direction changed and a native reload is pending. */
  directionReloadPending: boolean;
}

/**
 * One-time app startup: load fonts, hydrate preferences, init i18n + RTL, then
 * restore the auth session. `ready` gates the splash screen.
 */
export function useAppBootstrap(): BootstrapState {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [i18nReady, setI18nReady] = useState(false);
  const [directionReloadPending, setDirectionReloadPending] = useState(false);

  const prefsHydrated = usePreferencesStore((s) => s.hasHydrated);
  const language = usePreferencesStore((s) => s.language);
  const authStatus = useAuthStore((s) => s.status);
  const initializeAuth = useAuthStore((s) => s.initialize);

  // i18n + direction — after preferences hydrate so the persisted language wins.
  useEffect(() => {
    if (!prefsHydrated || i18nReady) return;
    const chosen = language || resolveDeviceLanguage();
    const { directionChanged } = initI18n(chosen);
    if (directionChanged) setDirectionReloadPending(true);
    setI18nReady(true);
  }, [prefsHydrated, language, i18nReady]);

  // Auth session restore. The store guards against re-entry, so calling once is enough.
  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (fontError) log.warn('font load error', { message: fontError.message });
  }, [fontError]);

  const ready =
    (fontsLoaded || Boolean(fontError)) &&
    prefsHydrated &&
    i18nReady &&
    authStatus !== 'bootstrapping';

  useEffect(() => {
    if (ready) log.info('bootstrap complete', { authStatus });
  }, [ready, authStatus]);

  return { ready, directionReloadPending };
}

export { AppConfig };
