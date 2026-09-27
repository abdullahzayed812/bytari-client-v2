import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { useAuthStore, type AppMode } from '@/store';

import { useAppMode } from './useAppMode';
import { canEnterVeterinarianModeFor } from './useCapabilities';

/** The one icon every interface-switch button uses (Pet Owner ⇄ Veterinarian). */
export const INTERFACE_SWITCH_ICON = 'swap-horizontal-outline' as const;

export interface UseInterfaceSwitch {
  /** Whether the switch control should be shown at all (approved vet / admin only). */
  canSwitch: boolean;
  switching: boolean;
  /** Switch to `target`; shows the success toast only once the switch actually happened. */
  switchTo: (target: AppMode) => Promise<boolean>;
}

/**
 * Pet Owner ⇄ Veterinarian interface switch, shared by both Home headers and
 * the Account screen.
 *
 * Entering Veterinarian mode is verified against the backend first: the
 * session is re-pulled from `/auth/me` and the switch only happens if that
 * fresh snapshot says the user is an APPROVED veterinarian (a revoked approval
 * is caught here even if the cached session is stale). Every veterinarian API
 * is independently authorised server-side — this gate only decides which UI
 * is presented. Leaving Veterinarian mode never needs a check.
 */
export function useInterfaceSwitch(): UseInterfaceSwitch {
  const { t } = useTranslation('auth');
  const toast = useToast();
  const mode = useAppMode();
  const [switching, setSwitching] = useState(false);

  const switchTo = useCallback(
    async (target: AppMode): Promise<boolean> => {
      if (target === mode.activeMode) return true;

      if (target === 'veterinarian') {
        setSwitching(true);
        try {
          const fresh = await useAuthStore.getState().refreshSession();
          const allowed = fresh && canEnterVeterinarianModeFor(useAuthStore.getState().session);
          if (!allowed) {
            toast.show({
              tone: 'danger',
              message: fresh ? t('mode.switchDenied') : t('mode.switchFailed'),
            });
            return false;
          }
        } finally {
          setSwitching(false);
        }
      }

      mode.setMode(target);
      toast.show({
        tone: 'success',
        message: target === 'veterinarian' ? t('mode.switchedToVet') : t('mode.switchedToOwner'),
      });
      return true;
    },
    [mode, t, toast],
  );

  return { canSwitch: mode.canSwitchMode, switching, switchTo };
}
