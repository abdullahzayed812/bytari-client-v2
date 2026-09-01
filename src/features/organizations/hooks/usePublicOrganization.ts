import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgKeys, organizationsApi } from '../api';
import type { PublicOrganization } from '../types';

/**
 * A single publicly-discoverable organization (ACTIVE only). Unlike
 * {@link import('./useOrganization').useOrganization}, this never requires
 * membership — it backs a clinic card's "View details" from the Pet Owner
 * Home / discovery list. An unknown or non-ACTIVE id is a plain `404`.
 */
export function usePublicOrganization(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<PublicOrganization, ApiError>({
    queryKey: orgKeys.publicDetail(organizationId ?? 'unknown'),
    queryFn: () => organizationsApi.getPublic(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
