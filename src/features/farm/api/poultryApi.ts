import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CreatePoultryFlockInput,
  Paginated,
  PoultryFlock,
  PoultryListFilter,
  UpdatePoultryFlockInput,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

/**
 * Poultry-flock wrappers — 1:1 with the backend routes, always scoped to one
 * FARM organization by the path. `createdByUserId` and `organizationId` are set
 * by the server, never in a body.
 *
 *   GET/POST   /organizations/:orgId/poultry/flocks          (`farm.poultry.read` / `.create`)
 *   GET/PATCH/DELETE  .../poultry/flocks/:flockId            (`farm.poultry.read` / `.update` / `.delete`)
 */
export const poultryApi = {
  async list(organizationId: string, filter: PoultryListFilter): Promise<Paginated<PoultryFlock>> {
    const envelope = await apiClient.requestEnvelope<PoultryFlock[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/poultry/flocks`,
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        status: filter.status,
        birdType: filter.birdType,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  get(organizationId: string, flockId: string): Promise<PoultryFlock> {
    return apiClient.get<PoultryFlock>(
      `/organizations/${organizationId}/poultry/flocks/${flockId}`,
    );
  },

  create(organizationId: string, body: CreatePoultryFlockInput): Promise<PoultryFlock> {
    return apiClient.post<PoultryFlock>(`/organizations/${organizationId}/poultry/flocks`, body);
  },

  update(
    organizationId: string,
    flockId: string,
    body: UpdatePoultryFlockInput,
  ): Promise<PoultryFlock> {
    return apiClient.patch<PoultryFlock>(
      `/organizations/${organizationId}/poultry/flocks/${flockId}`,
      body,
    );
  },

  remove(organizationId: string, flockId: string): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/organizations/${organizationId}/poultry/flocks/${flockId}`,
    );
  },
};

export type PoultryApi = typeof poultryApi;
