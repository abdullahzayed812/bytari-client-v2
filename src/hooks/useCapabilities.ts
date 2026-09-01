import { useMemo } from 'react';

import type { PermissionKey } from '@/constants/permissions';
import type { RoleKey, SupervisorDomain } from '@/features/auth/types';
import { useAuthStore } from '@/store';

/**
 * Centralised capability checks derived from the authoritative `/auth/me`
 * snapshot. Use this everywhere instead of scattering `session.roles.includes(...)`.
 *
 * Reminder: this is for UX gating only. The backend authorises every action.
 */
export interface Capabilities {
  isReady: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isApprovedVeterinarian: boolean;
  /** Registered as a veterinarian in any state (applied / pending / approved). */
  isVeterinarianAccount: boolean;
  roles: RoleKey[];
  supervisorDomains: SupervisorDomain[];
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
  hasRole: (role: RoleKey) => boolean;
  isSupervisorOf: (domain: SupervisorDomain) => boolean;
  /** Has access to the internal management area (admin OR any supervisor domain). */
  canAccessManagementArea: boolean;
  /** @deprecated alias of {@link canAccessManagementArea}. */
  canAccessControlCentre: boolean;
  /** May switch the app into Veterinarian Mode (approved vet or admin). */
  canEnterVeterinarianMode: boolean;
}

export function useCapabilities(): Capabilities {
  const session = useAuthStore((s) => s.session);

  return useMemo<Capabilities>(() => {
    const permissions = new Set(session?.permissions ?? []);
    const roles = session?.roles ?? [];
    const supervisorDomains = session?.supervisorDomains ?? [];
    const isAdmin = session?.isAdmin ?? false;
    const isApprovedVeterinarian = session?.veterinarian.approved ?? false;

    const can = (permission: PermissionKey): boolean => isAdmin || permissions.has(permission);

    return {
      isReady: session != null,
      isAdmin,
      isModerator: roles.includes('MODERATOR'),
      isApprovedVeterinarian,
      isVeterinarianAccount:
        roles.includes('VETERINARIAN') || session?.veterinarian.status !== 'NOT_APPLIED',
      roles,
      supervisorDomains,
      can,
      canAny: (list) => list.some(can),
      canAll: (list) => list.every(can),
      hasRole: (role) => roles.includes(role),
      isSupervisorOf: (domain) => isAdmin || supervisorDomains.includes(domain),
      canAccessManagementArea: isAdmin || supervisorDomains.length > 0,
      canAccessControlCentre: isAdmin || supervisorDomains.length > 0,
      canEnterVeterinarianMode: isAdmin || isApprovedVeterinarian,
    };
  }, [session]);
}
