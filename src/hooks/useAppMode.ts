import { useCallback, useMemo } from 'react';

import { useAppModeStore, type AppMode } from '@/store';

import { useCapabilities } from './useCapabilities';

export interface UseAppMode {
  activeMode: AppMode;
  /** Modes the current user is allowed to enter. Always includes `owner`. */
  availableModes: AppMode[];
  isVeterinarianMode: boolean;
  canSwitchMode: boolean;
  /** Set the mode. Falls back to `owner` if the user can't enter the target. */
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

/**
 * The seam for Pet Owner ⇄ Veterinarian mode switching.
 *
 * Phase 1 provides the state + guard only. The actual per-mode navigation trees
 * and feature surfaces arrive in later phases; they read `activeMode` from here.
 */
export function useAppMode(): UseAppMode {
  const activeMode = useAppModeStore((s) => s.activeMode);
  const setModeRaw = useAppModeStore((s) => s.setMode);
  const { canEnterVeterinarianMode } = useCapabilities();

  const availableModes = useMemo<AppMode[]>(
    () => (canEnterVeterinarianMode ? ['owner', 'veterinarian'] : ['owner']),
    [canEnterVeterinarianMode],
  );

  const setMode = useCallback(
    (mode: AppMode) => {
      setModeRaw(mode === 'veterinarian' && !canEnterVeterinarianMode ? 'owner' : mode);
    },
    [setModeRaw, canEnterVeterinarianMode],
  );

  const toggleMode = useCallback(() => {
    setMode(activeMode === 'owner' ? 'veterinarian' : 'owner');
  }, [activeMode, setMode]);

  // Keep state honest if capabilities change (e.g. approval revoked).
  const effectiveMode: AppMode =
    activeMode === 'veterinarian' && !canEnterVeterinarianMode ? 'owner' : activeMode;

  return {
    activeMode: effectiveMode,
    availableModes,
    isVeterinarianMode: effectiveMode === 'veterinarian',
    canSwitchMode: availableModes.length > 1,
    setMode,
    toggleMode,
  };
}
