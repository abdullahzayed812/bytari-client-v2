import { useQuery } from '@tanstack/react-query';

import { organizationsApi } from '@/features/organizations';
import type { MyOrganization } from '@/features/organizations/types';
import { ApiError } from '@/services/api';

/**
 * The current user's poultry farms — FARM organizations they own or are an
 * ACTIVE member of. Backed by `GET /organizations` (membership-scoped); the
 * FARM filter is applied client-side. No public farm discovery.
 */
export function usePoultryFarms() {
  const query = useQuery<MyOrganization[], ApiError>({
    queryKey: ['poultry-farms', 'mine'],
    queryFn: async () => {
      const { items } = await organizationsApi.listMine(1, 50);
      return items.filter((o) => o.type === 'FARM');
    },
    staleTime: 30_000,
  });
  return { ...query, farms: query.data ?? [] };
}
