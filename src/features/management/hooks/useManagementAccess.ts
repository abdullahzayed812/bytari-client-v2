import { useMemo } from 'react';

import { useCapabilities } from '@/hooks';

export interface ManagementAccess {
  /** `true` for admins and any system supervisor. Derived from `/auth/me`. */
  canAccess: boolean;
  /** `true` while the capability snapshot is still loading. */
  isResolving: boolean;
}

/**
 * Centralised gate for the internal Management area (§16). The real permissions
 * come from the backend identity model (`isAdmin` / `supervisorDomains`), never
 * a hard-coded role string. This only decides UI/navigation visibility — the
 * backend authorises every management API independently.
 */
export function useManagementAccess(): ManagementAccess {
  const caps = useCapabilities();
  return useMemo(
    () => ({ canAccess: caps.canAccessManagementArea, isResolving: !caps.isReady }),
    [caps.canAccessManagementArea, caps.isReady],
  );
}
