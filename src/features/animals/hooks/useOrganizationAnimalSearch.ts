import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks';
import type { ApiError } from '@/services/api';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { ClinicPet, Paginated } from '../types';

/**
 * Server-side search among the clinic's OWN pets (those it has records for):
 * short ID / id, name, owner, type, breed. Empty term → the newest page.
 */
export function useOrganizationAnimalSearch(
  organizationId: string | undefined,
  term: string,
  /** `debounce: false` — the caller already passes a settled (debounced) term. */
  options: { enabled?: boolean; debounce?: boolean } = {},
) {
  const settled = useDebouncedValue(term.trim());
  const debounced = options.debounce === false ? term.trim() : settled;
  return useQuery<Paginated<ClinicPet>, ApiError>({
    queryKey: orgAnimalKeys.search(organizationId ?? 'unknown', debounced),
    queryFn: () =>
      organizationAnimalsApi.list(organizationId as string, 1, 50, debounced || undefined),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 10_000,
  });
}
