import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAppMode, useDebouncedValue } from '@/hooks';

import { searchApi, searchKeys } from '../api/searchApi';
import type { SearchInterface, SearchType } from '../types';

export const SEARCH_MIN_CHARS = 2;

/**
 * Debounced global search; idle until the (trimmed) query has ≥ 2 characters.
 * Scoped to the ACTIVE interface (Pet Owner / Veterinarian mode) — the backend
 * enforces the same scope, this only picks which one to ask for.
 */
export function useGlobalSearch(raw: string, types?: SearchType[]) {
  const { isVeterinarianMode } = useAppMode();
  const scope: SearchInterface = isVeterinarianMode ? 'VETERINARIAN' : 'PET_OWNER';
  const q = useDebouncedValue(raw.trim());
  const enabled = q.length >= SEARCH_MIN_CHARS;
  const query = useQuery({
    queryKey: searchKeys.query(q, scope, types),
    queryFn: () => searchApi.search(q, { interface: scope, types }),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  return { ...query, debouncedQuery: q, enabled, scope };
}
