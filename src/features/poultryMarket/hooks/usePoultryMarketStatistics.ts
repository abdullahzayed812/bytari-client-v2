import { useQuery } from '@tanstack/react-query';

import { poultryMarketApi, poultryMarketKeys } from '../api';
import type { MarketStatisticsSummary } from '../types';

/** Governorate farm/bird distribution — admin or approved-trader only (backend-enforced). */
export function usePoultryMarketStatistics(options: { enabled?: boolean } = {}) {
  return useQuery<MarketStatisticsSummary>({
    queryKey: poultryMarketKeys.statistics,
    queryFn: () => poultryMarketApi.statistics.get(),
    enabled: options.enabled ?? true,
  });
}
