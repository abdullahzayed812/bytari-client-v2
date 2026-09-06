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

const base = (orgId: string): string => `/organizations/${orgId}/farm/subscription-renewals`;

/**
 * Farm subscription renewal requests — member-facing side (owner submits,
 * reads their own farm's requests). 1:1 with
 * `server/src/modules/farms/presentation/poultry-ops.routes.ts`. The backend
 * always determines subscription validity; this module never computes it.
 */
export const farmSubscriptionApi = {
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

export type FarmSubscriptionApi = typeof farmSubscriptionApi;
