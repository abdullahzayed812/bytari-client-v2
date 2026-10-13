import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { homeSectionKeys, homeSectionsApi } from '../api';
import type { HomeSectionKey } from '../types';

/**
 * `key → imageUrl` for the home-page section cards. A missing entry (still
 * loading, request failed, or no image configured) means "use the built-in
 * icon" — the cards never wait on this query.
 */
export function useHomeSectionImages(): Partial<Record<HomeSectionKey, string>> {
  const query = useQuery({
    queryKey: homeSectionKeys.list(),
    queryFn: () => homeSectionsApi.list(),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => {
    const map: Partial<Record<HomeSectionKey, string>> = {};
    for (const s of query.data ?? []) if (s.imageUrl) map[s.key] = s.imageUrl;
    return map;
  }, [query.data]);
}
