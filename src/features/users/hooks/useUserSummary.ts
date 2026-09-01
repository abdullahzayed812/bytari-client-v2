import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { userKeys, usersApi } from '../api';
import type { UserSummary } from '../api';

/**
 * Resolve one user id to a `{ firstName, lastName }` summary. Cached for a long
 * time (a display name barely changes); `404` / `403` are not retried and the
 * caller shows a neutral fallback ("this user", "another clinic's vet", …) so a
 * missing / deactivated user never blocks a screen.
 */
export function useUserSummary(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<UserSummary, ApiError>({
    queryKey: userKeys.summary(userId ?? 'unknown'),
    queryFn: () => usersApi.getSummary(userId as string),
    enabled: Boolean(userId) && (options.enabled ?? true),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
