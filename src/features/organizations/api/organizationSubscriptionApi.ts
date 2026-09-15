import type {
  CreateRenewalRequestInput,
  FarmSubscriptionRenewalRequest,
  Paginated,
} from '@/features/farm/types';
import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

const base = (orgId: string): string => `/organizations/${orgId}/subscription-renewals`;

/**
 * VETERINARY_OFFICE / CLINIC subscription renewal requests — the generalized
 * counterpart of `farmSubscriptionApi` (`@/features/farmShared/api`), hitting
 * the backend's generic `/organizations/:id/subscription-renewals` routes
 * (same `FarmSubscriptionService`, same request/response shape — reused
 * types, not redefined). FARM keeps using its own `/farm/subscription-renewals`
 * path via `farmSubscriptionApi`, untouched.
 */
export const organizationSubscriptionApi = {
  listRenewalRequests(
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<FarmSubscriptionRenewalRequest>> {
    return apiClient
      .requestEnvelope<FarmSubscriptionRenewalRequest[]>({
        method: 'GET',
        url: base(orgId),
        params: { page, pageSize },
      })
      .then((e) => ({ items: e.data, meta: readMeta(e.meta, page, pageSize, e.data.length) }));
  },

  requestRenewal(
    orgId: string,
    input: CreateRenewalRequestInput,
  ): Promise<FarmSubscriptionRenewalRequest> {
    return apiClient.post<FarmSubscriptionRenewalRequest>(base(orgId), input);
  },
};

export type OrganizationSubscriptionApi = typeof organizationSubscriptionApi;
