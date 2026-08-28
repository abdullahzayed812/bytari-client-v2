import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ThemePreference } from '@/theme/ThemeProvider';

import { asyncStorage, PERSIST_KEYS } from './persist';

export type AppLanguage = 'ar' | 'en';

interface PreferencesState {
  themePreference: ThemePreference;
  language: AppLanguage;
  /** `false` until AsyncStorage rehydration completes. */
  hasHydrated: boolean;
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: AppLanguage) => void;
  _setHydrated: () => void;
}

/**
 * User-facing client preferences. Persisted to AsyncStorage (non-sensitive).
 * `language` is the *chosen* language; the actual i18n switch + RTL reload is
 * orchestrated by `src/i18n` / `src/lib/rtl`.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'light',
      language: 'ar',
      hasHydrated: false,
      setThemePreference: (value) => set({ themePreference: value }),
      setLanguage: (value) => set({ language: value }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: PERSIST_KEYS.preferences,
      storage: asyncStorage<Pick<PreferencesState, 'themePreference' | 'language'>>(),
      partialize: (state) => ({
        themePreference: state.themePreference,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
