import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { OrganizationAnimalGrant, Paginated } from '../types';

/** Scan up to this many pages when an animal is not already in the list cache. */
const MAX_LOOKUP_PAGES = 10;
const LOOKUP_PAGE_SIZE = 50;

function findInCache(
  data: InfiniteData<Paginated<OrganizationAnimalGrant>> | undefined,
  animalId: string,
): OrganizationAnimalGrant | undefined {
  return data?.pages.flatMap((p) => p.items).find((g) => g.animalId === animalId);
}

/**
 * One organization-animal grant, addressed by `animalId`.
 *
 * The backend has **no** organization-scoped animal-detail endpoint, so this
 * reads the row from the `animal-access` list: first from the infinite-list
 * cache, then (for a cold deep-link) by paging the list until the animal is
 * found or the pages are exhausted. `null` means "not associated with this
 * organization" — the screen shows a plain not-found state, never an
 * authorization detail. (A dedicated detail endpoint is a backend dependency —
 * see MOBILE_ARCHITECTURE.md §54.)
 */
export function useOrganizationAnimal(
  organizationId: string | undefined,
  animalId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const qc = useQueryClient();

  return useQuery<OrganizationAnimalGrant | null, ApiError>({
    queryKey: orgAnimalKeys.detail(organizationId ?? 'unknown', animalId ?? 'unknown'),
    enabled: Boolean(organizationId) && Boolean(animalId) && (options.enabled ?? true),
    staleTime: 15_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 403) && count < 2,
    queryFn: async () => {
      const orgId = organizationId as string;
      const id = animalId as string;

      const cached = findInCache(
        qc.getQueryData<InfiniteData<Paginated<OrganizationAnimalGrant>>>(
          orgAnimalKeys.list(orgId),
        ),
        id,
      );
      if (cached) return cached;

      for (let page = 1; page <= MAX_LOOKUP_PAGES; page += 1) {
        const res = await organizationAnimalsApi.list(orgId, page, LOOKUP_PAGE_SIZE);
        const hit = res.items.find((g) => g.animalId === id);
        if (hit) return hit;
        if (page >= res.meta.totalPages) break;
      }
      return null;
    },
  });
}
