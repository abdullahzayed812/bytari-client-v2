import { apiClient } from '@/services/api';

import type { SearchInterface, SearchResult, SearchType } from '../types';

/**
 * `GET /search` — backend-driven global search, scoped to the current
 * application interface (Pet Owner / Veterinarian). The server queries each
 * entity's own public listing (same visibility rules) with a small per-type
 * limit; the client never downloads whole datasets.
 */
export const searchApi = {
  search(
    q: string,
    opts: { interface?: SearchInterface; types?: SearchType[]; limit?: number } = {},
  ): Promise<SearchResult> {
    return apiClient.get<SearchResult>('/search', {
      q,
      interface: opts.interface ?? 'PET_OWNER',
      types: opts.types?.length ? opts.types.join(',') : undefined,
      limit: opts.limit,
    });
  },
};

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, scope: SearchInterface, types?: SearchType[]) =>
    [...searchKeys.all, scope, q, types?.join(',') ?? 'all'] as const,
};
