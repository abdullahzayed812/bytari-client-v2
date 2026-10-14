import { useQuery } from '@tanstack/react-query';

import { poultryMarketApi, poultryMarketKeys } from '../api';
import type { MarketAccess } from '../types';

/**
 * My Markets & Exchanges access (merchant account + owned poultry farms, each
 * evaluated independently by the backend). Always refetched when a market
 * screen mounts — a renewal or a newly approved farm must show immediately.
 * This only decides what to RENDER; every market API enforces the same rule.
 */
export function useMarketAccess(options: { enabled?: boolean } = {}) {
  return useQuery<MarketAccess>({
    queryKey: poultryMarketKeys.access,
    queryFn: () => poultryMarketApi.access.get(),
    enabled: options.enabled ?? true,
    staleTime: 10_000,
    refetchOnMount: 'always',
  });
}
