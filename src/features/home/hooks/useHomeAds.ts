import { useQuery } from '@tanstack/react-query';

import { homeAdKeys, homeAdsApi } from '../api';

/** The Pet Owner Home banner carousel — active ads, already display-ordered. */
export function useHomeAds() {
  return useQuery({
    queryKey: homeAdKeys.list(),
    queryFn: homeAdsApi.list,
    staleTime: 60_000,
  });
}
