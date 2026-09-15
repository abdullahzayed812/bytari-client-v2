import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type { AdminDashboardCardId, AdminDashboardSummary } from '../types';

/** `GET /admin/dashboard/summary` — every count/activity/task the redesigned admin home needs. */
export function useAdminDashboardSummary(
  options: { enabled?: boolean } = {},
): UseQueryResult<AdminDashboardSummary, ApiError> {
  return useQuery<AdminDashboardSummary, ApiError>({
    queryKey: adminKeys.dashboard.summary(),
    queryFn: () => adminApi.getDashboardSummary(),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  });
}

/**
 * Marks one ManagementScreen card seen — its badge resets to 0 immediately
 * (optimistic) and stays consistent once the summary refetches. Call this
 * when the user opens that card's management screen (spec §5).
 */
export function useMarkDashboardCardSeen() {
  const queryClient = useQueryClient();
  return useMutation<{ seen: boolean }, ApiError, AdminDashboardCardId>({
    mutationFn: (cardId) => adminApi.markDashboardCardSeen(cardId),
    onSuccess: (_data, cardId) => {
      queryClient.setQueryData<AdminDashboardSummary>(adminKeys.dashboard.summary(), (prev) =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map((c) => (c.id === cardId ? { ...c, count: 0 } : c)),
            }
          : prev,
      );
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard.summary() });
    },
  });
}
