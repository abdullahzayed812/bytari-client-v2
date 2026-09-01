import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgKeys, organizationsApi } from '../api';
import type { OrganizationSupervisor } from '../types';

/**
 * Organization supervisors — a plain (un-paginated) array from the backend.
 * Requires `supervisor.read` server-side. Each entry carries the owner-selected
 * `permissions` for that supervisor membership.
 */
export function useOrganizationSupervisors(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<OrganizationSupervisor[], ApiError>({
    queryKey: orgKeys.supervisors(organizationId ?? 'unknown'),
    queryFn: () => organizationsApi.listSupervisors(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
