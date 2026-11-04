import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orgKeys } from '@/features/organizations/api';
import { usePublicOrganization } from '@/features/organizations/hooks/usePublicOrganization';
import type { ApiError } from '@/services/api';

import { organizationStoreService, orgStoreKeys } from '../api';

/**
 * Customer view: can this clinic / office store be used right now? Read from
 * the public organization page (`storeEnabled` — Admin clinic switch;
 * `ordersEnabled` — the seller's "receive new orders" switch). Unknown while
 * loading → treated as available; the server enforces both either way.
 */
export function useOrgStoreAvailability(organizationId: string | undefined) {
  const q = usePublicOrganization(organizationId);
  const storeEnabled = q.data?.storeEnabled !== false;
  const ordersEnabled = storeEnabled && q.data?.ordersEnabled !== false;
  return { storeEnabled, ordersEnabled, isLoading: q.isLoading };
}

/** Seller view of the "استقبال الطلبات" switch. */
export function useOrgStoreOrderSettings(
  organizationId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<{ ordersEnabled: boolean }, ApiError>({
    queryKey: orgStoreKeys.sellerSettings(organizationId),
    queryFn: () => organizationStoreService.getOrderSettings(organizationId),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
  });
}

export function useUpdateOrgStoreOrderSettings(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<{ ordersEnabled: boolean }, ApiError, boolean>({
    mutationKey: ['organization-store', 'order-settings', organizationId],
    mutationFn: (enabled) => organizationStoreService.updateOrderSettings(organizationId, enabled),
    onSuccess: (data) => {
      qc.setQueryData(orgStoreKeys.sellerSettings(organizationId), data);
      void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: orgKeys.publicDetail(organizationId) });
    },
  });
}
