import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/services/api';

import { organizationsApi, orgKeys } from '../api';
import type { OrganizationTerms, OrganizationTermsKey } from '../types';

/**
 * The registration Terms & Conditions for one organization / farm type —
 * served verbatim by the backend (`GET /organizations/terms/:termsKey`). The
 * text only changes with a new release, so it is cached for the session.
 */
export function useOrganizationTerms(termsKey: OrganizationTermsKey | null | undefined) {
  return useQuery<OrganizationTerms, ApiError>({
    queryKey: orgKeys.terms(termsKey ?? '_'),
    queryFn: () => organizationsApi.getTerms(termsKey as OrganizationTermsKey),
    enabled: Boolean(termsKey),
    staleTime: Infinity,
  });
}
