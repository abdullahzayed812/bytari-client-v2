import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { clinicDashboardApi, clinicDashboardKeys } from '../api';
import type { ClinicDashboardPermissions, ClinicDashboardSummary } from '../types';

/** The Clinic Dashboard summary. Not retried on 400 / 403 (not a clinic / not a member). */
export function useClinicDashboard(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<ClinicDashboardSummary, ApiError>({
    queryKey: clinicDashboardKeys.summary(organizationId ?? 'unknown'),
    queryFn: () => clinicDashboardApi.getSummary(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 15_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 400 || error.status === 403)) && count < 2,
  });
}

/**
 * The caller's effective clinic permissions, read from the (shared, cached)
 * dashboard summary. `undefined` until it loads — callers hide actions meanwhile.
 */
export function useClinicPermissions(
  organizationId: string | undefined,
): ClinicDashboardPermissions | undefined {
  return useClinicDashboard(organizationId).data?.permissions;
}
