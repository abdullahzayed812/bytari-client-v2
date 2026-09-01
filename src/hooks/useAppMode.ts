import { useCallback, useMemo } from 'react';

import { useVeterinarianStatus } from '@/features/auth/hooks';
import { useAppModeStore, type AppMode } from '@/store';

import { useCapabilities } from './useCapabilities';

/** Why Veterinarian mode is unavailable — a key in the `auth` i18n namespace, or `null`. */
export type VetModeLockReasonKey =
  'mode.vetLockedNotApplied' | 'mode.vetLockedPending' | 'mode.vetLockedRejected' | null;

export interface UseAppMode {
  activeMode: AppMode;
  /** Modes the current user is allowed to actually enter. Always includes `owner`. */
  availableModes: AppMode[];
  isVeterinarianMode: boolean;
  canSwitchMode: boolean;
  /** `true` only when the backend says the user is an approved veterinarian (or admin). */
  veterinarianModeAvailable: boolean;
  /** When not available: an i18n key explaining why (for the disabled-state UX, §15). */
  veterinarianLockReasonKey: VetModeLockReasonKey;
  /** Set the mode. Silently falls back to `owner` if the target isn't allowed. */
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

/**
 * Pet Owner ⇄ Veterinarian mode. A pure UI/application concern — NOT
 * authorization (the backend authorises every action).
 *
 * §15 UX decision: Veterinarian mode is always *shown* as an option. It is
 * interactive only for approved vets/admins; otherwise it renders disabled with
 * `veterinarianLockReasonKey` explaining why (pending / rejected / not applied).
 * Rationale: a hidden option can't tell the user *why* it's missing or hint at
 * the future "apply to become a vet" path.
 */
export function useAppMode(): UseAppMode {
  const activeMode = useAppModeStore((s) => s.activeMode);
  const setModeRaw = useAppModeStore((s) => s.setMode);
  const { canEnterVeterinarianMode } = useCapabilities();
  const vet = useVeterinarianStatus();

  const availableModes = useMemo<AppMode[]>(
    () => (canEnterVeterinarianMode ? ['owner', 'veterinarian'] : ['owner']),
    [canEnterVeterinarianMode],
  );

  const veterinarianLockReasonKey = useMemo<VetModeLockReasonKey>(() => {
    if (canEnterVeterinarianMode) return null;
    if (vet.isPending) return 'mode.vetLockedPending';
    if (vet.isRejected) return 'mode.vetLockedRejected';
    return 'mode.vetLockedNotApplied';
  }, [canEnterVeterinarianMode, vet.isPending, vet.isRejected]);

  const setMode = useCallback(
    (mode: AppMode) => {
      setModeRaw(mode === 'veterinarian' && !canEnterVeterinarianMode ? 'owner' : mode);
    },
    [setModeRaw, canEnterVeterinarianMode],
  );

  const toggleMode = useCallback(() => {
    setMode(activeMode === 'owner' ? 'veterinarian' : 'owner');
  }, [activeMode, setMode]);

  // Self-correct if capability was lost (e.g. approval revoked mid-session).
  const effectiveMode: AppMode =
    activeMode === 'veterinarian' && !canEnterVeterinarianMode ? 'owner' : activeMode;

  return {
    activeMode: effectiveMode,
    availableModes,
    isVeterinarianMode: effectiveMode === 'veterinarian',
    canSwitchMode: availableModes.length > 1,
    veterinarianModeAvailable: canEnterVeterinarianMode,
    veterinarianLockReasonKey,
    setMode,
    toggleMode,
  };
}
