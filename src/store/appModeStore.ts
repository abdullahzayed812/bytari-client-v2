import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { asyncStorage, PERSIST_KEYS } from './persist';

/**
 * Which experience the app is currently presenting.
 *
 * This is a pure *client UI* concern and is intentionally decoupled from backend
 * authorization: selecting `veterinarian` does NOT grant veterinarian
 * capabilities — every veterinarian action is still gated by the backend
 * (`veterinarianStatus === 'APPROVED'` + permissions). A not-yet-approved
 * veterinarian may still browse in `owner` mode.
 *
 * The decision "is this user *allowed* to enter veterinarian mode?" lives in
 * `useCapabilities()` / `useAppMode()`, which combine this with the session.
 */
export type AppMode = 'owner' | 'veterinarian';

interface AppModeState {
  activeMode: AppMode;
  hasHydrated: boolean;
  setMode: (mode: AppMode) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      activeMode: 'owner',
      hasHydrated: false,
      setMode: (mode) => set({ activeMode: mode }),
      reset: () => set({ activeMode: 'owner' }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: PERSIST_KEYS.appMode,
      storage: asyncStorage<Pick<AppModeState, 'activeMode'>>(),
      partialize: (state) => ({ activeMode: state.activeMode }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
