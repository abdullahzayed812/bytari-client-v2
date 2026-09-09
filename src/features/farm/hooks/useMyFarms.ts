import { useMemo } from 'react';

import { useOrganizations } from '@/features/organizations';
import type { FarmSpecies, MyOrganization } from '@/features/organizations/types';

/**
 * The signed-in user's FARM organizations narrowed to the given species. The
 * species discriminator (`farmSpecies`) comes straight from
 * `GET /organizations` — no per-farm request. Strict match: MIXED and legacy
 * (null-species) farms are excluded.
 *
 * Wraps the paginated `useOrganizations` infinite query, so the "see all"
 * screen gets `fetchNextPage` / `hasNextPage` for free while the landings just
 * read the first slice.
 */
export function useMyFarms(
  species: readonly FarmSpecies[],
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const query = useOrganizations({ pageSize: params.pageSize ?? 50, enabled: params.enabled });
  const key = species.join(',');

  const farms = useMemo<MyOrganization[]>(
    () =>
      query.organizations.filter(
        (o) => o.type === 'FARM' && o.farmSpecies != null && species.includes(o.farmSpecies),
      ),
    // `species` is a stable literal array from the caller; key it by contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.organizations, key],
  );

  return { ...query, farms };
}
