import { useQuery } from '@tanstack/react-query';

import { veterinaryOfficeDashboardApi, veterinaryOfficeDashboardKeys } from '../api';

/** The Dashboard home's stats row — followers / products / rating (+ sales, always 0). */
export function useVeterinaryOfficeDashboard(organizationId: string) {
  return useQuery({
    queryKey: veterinaryOfficeDashboardKeys.summary(organizationId),
    queryFn: () => veterinaryOfficeDashboardApi.getSummary(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 15_000,
  });
}
