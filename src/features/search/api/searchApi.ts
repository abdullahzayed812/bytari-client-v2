import { apiClient } from '@/services/api';

import type { SearchResult, SearchType } from '../types';

/**
 * `GET /search` — backend-driven global search. The server queries each
 * entity's own public listing (same visibility rules) with a small per-type
 * limit; the client never downloads whole datasets.
 */
export const searchApi = {
  search(q: string, opts: { types?: SearchType[]; limit?: number } = {}): Promise<SearchResult> {
    return apiClient.get<SearchResult>('/search', {
      q,
      types: opts.types?.length ? opts.types.join(',') : undefined,
      limit: opts.limit,
    });
  },
};

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, types?: SearchType[]) =>
    [...searchKeys.all, q, types?.join(',') ?? 'all'] as const,
};
