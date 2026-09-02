import { useQuery } from '@tanstack/react-query';

import { adKeys, adsApi } from '../api';
import type { AdPlacement } from '../types';

/** Eligible advertisement campaigns for one screen/placement (already ordered). */
export function useAds(placement: AdPlacement) {
  return useQuery({
    queryKey: adKeys.list(placement),
    queryFn: () => adsApi.list(placement),
    staleTime: 60_000,
  });
}
