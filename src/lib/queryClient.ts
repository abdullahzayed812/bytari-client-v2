import {
  MutationCache,
  QueryCache,
  QueryClient,
  type QueryClientConfig,
} from '@tanstack/react-query';

import { ApiError } from '@/services/api/errors';
import { ApiErrorCode } from '@/services/api/types';

import { createLogger } from './logger';

const log = createLogger('query');

/**
 * Shared TanStack Query configuration.
 *
 * Conventions for future feature modules:
 *  - Query keys: `[feature, entity, params]` e.g. `['pets', 'list', { page }]`.
 *  - Read hooks live in `features/<feature>/queries.ts`, writes in
 *    `features/<feature>/mutations.ts`; both import the feature's `api.ts`.
 *  - Invalidate by prefix: `queryClient.invalidateQueries({ queryKey: ['pets'] })`.
 *  - Do NOT put server data in Zustand — it belongs here.
 */
const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Never retry auth / client errors; retry transient network/5xx twice.
        if (error instanceof ApiError && !error.isRetryable) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        log.warn('mutation failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
      },
    },
  },
};

/**
 * A request rejected because an organization may not operate (pending /
 * inactive / subscription expired) means any cached organization profile is
 * stale — refetch it so the clinic gate switches to the locked state instead
 * of a cached "active" dashboard staying on screen.
 */
const ORGANIZATION_LOCK_CODES: ReadonlySet<string> = new Set([
  ApiErrorCode.ORGANIZATION_NOT_ACTIVE,
  ApiErrorCode.ORGANIZATION_SUBSCRIPTION_EXPIRED,
]);

export function createQueryClient(): QueryClient {
  let client: QueryClient | null = null;
  const onLockError = (error: unknown): void => {
    if (error instanceof ApiError && ORGANIZATION_LOCK_CODES.has(error.code)) {
      void client?.invalidateQueries({ queryKey: ['organizations', 'detail'] });
    }
  };
  client = new QueryClient({
    ...config,
    queryCache: new QueryCache({ onError: onLockError }),
    mutationCache: new MutationCache({ onError: onLockError }),
  });
  return client;
}
