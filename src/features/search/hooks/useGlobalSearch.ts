import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks';

import { searchApi, searchKeys } from '../api/searchApi';
import type { SearchType } from '../types';

export const SEARCH_MIN_CHARS = 2;

/** Debounced global search; idle until the (trimmed) query has ≥ 2 characters. */
export function useGlobalSearch(raw: string, types?: SearchType[]) {
  const q = useDebouncedValue(raw.trim());
  const enabled = q.length >= SEARCH_MIN_CHARS;
  const query = useQuery({
    queryKey: searchKeys.query(q, types),
    queryFn: () => searchApi.search(q, { types }),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  return { ...query, debouncedQuery: q, enabled };
}
