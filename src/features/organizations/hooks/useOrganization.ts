import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgKeys, organizationsApi } from '../api';
import type { OrganizationDetail } from '../types';

/**
 * A single organization + the caller's `myRole`. A non-member hits `403` from
 * the backend (`authorizeOrg('organization.read')`) and an unknown id `404` —
 * the screen turns both into a plain "not available" state, never an
 * authorization detail. ADMINs get through with `myRole: null`.
 */
export function useOrganization(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<OrganizationDetail, ApiError>({
    queryKey: orgKeys.detail(organizationId ?? 'unknown'),
    queryFn: () => organizationsApi.get(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
