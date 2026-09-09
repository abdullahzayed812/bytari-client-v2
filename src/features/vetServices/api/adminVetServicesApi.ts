import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { ModerationStatus, Paginated, ServiceListing, ServiceRequest } from '../types';

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
 * `/admin/vet-service-listings*` + `/admin/vet-service-requests*` — the
 * Veterinary Services moderation queues. `list` / `get` need `vet_service.read`;
 * `approve` needs `vet_service.approve`; `reject` needs `vet_service.reject`.
 * Held by ADMIN (override) or an ACTIVE VET_SERVICE system-supervisor. The
 * backend re-authorises every call — hiding a button here is UX only.
 */
export const adminVetServicesApi = {
  async listListings(
    page: number,
    pageSize: number,
    filter: { status?: ModerationStatus } = {},
  ): Promise<Paginated<ServiceListing>> {
    const env = await apiClient.requestEnvelope<ServiceListing[]>({
      method: 'GET',
      url: '/admin/vet-service-listings',
      params: { page, pageSize, status: filter.status },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
  getListing(id: string): Promise<ServiceListing> {
    return apiClient.get<ServiceListing>(`/admin/vet-service-listings/${id}`);
  },
  approveListing(id: string): Promise<ServiceListing> {
    return apiClient.post<ServiceListing>(`/admin/vet-service-listings/${id}/approve`);
  },
  rejectListing(id: string, reason: string): Promise<ServiceListing> {
    return apiClient.post<ServiceListing>(`/admin/vet-service-listings/${id}/reject`, { reason });
  },

  async listRequests(
    page: number,
    pageSize: number,
    filter: { status?: ModerationStatus } = {},
  ): Promise<Paginated<ServiceRequest>> {
    const env = await apiClient.requestEnvelope<ServiceRequest[]>({
      method: 'GET',
      url: '/admin/vet-service-requests',
      params: { page, pageSize, status: filter.status },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
  getRequest(id: string): Promise<ServiceRequest> {
    return apiClient.get<ServiceRequest>(`/admin/vet-service-requests/${id}`);
  },
  approveRequest(id: string): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>(`/admin/vet-service-requests/${id}/approve`);
  },
  rejectRequest(id: string, reason: string): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>(`/admin/vet-service-requests/${id}/reject`, { reason });
  },
};

export type AdminVetServicesApi = typeof adminVetServicesApi;
