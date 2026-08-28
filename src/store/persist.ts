import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

/**
 * AsyncStorage-backed persistence for Zustand slices.
 *
 * ONLY for non-sensitive client preferences (theme, language, active mode).
 * Auth tokens must never be persisted this way — see
 * `services/auth/tokenStorage.ts` (expo-secure-store).
 */
export function asyncStorage<T>(): PersistStorage<T> | undefined {
  return createJSONStorage<T>(() => AsyncStorage);
}

export const PERSIST_KEYS = {
  preferences: 'bytari.preferences',
  appMode: 'bytari.appMode',
} as const;
