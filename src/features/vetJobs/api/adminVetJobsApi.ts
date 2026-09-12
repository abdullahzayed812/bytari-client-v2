import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { Paginated, VetJobModerationStatus, VetJobOffer, VetJobSeekerProfile } from '../types';

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
 * `/admin/vet-job-offers*` + `/admin/vet-job-seekers*` — the Veterinarian Jobs
 * moderation queues. `list` / `get` need `vet_job.read`; `approve` needs
 * `vet_job.approve`; `reject` needs `vet_job.reject`. Held by ADMIN (override)
 * or an ACTIVE VET_JOBS system-supervisor. The backend re-authorises every
 * call — hiding a button here is UX only.
 */
export const adminVetJobsApi = {
  async listOffers(
    page: number,
    pageSize: number,
    filter: { status?: VetJobModerationStatus } = {},
  ): Promise<Paginated<VetJobOffer>> {
    const env = await apiClient.requestEnvelope<VetJobOffer[]>({
      method: 'GET',
      url: '/admin/vet-job-offers',
      params: { page, pageSize, status: filter.status },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
  getOffer(id: string): Promise<VetJobOffer> {
    return apiClient.get<VetJobOffer>(`/admin/vet-job-offers/${id}`);
  },
  approveOffer(id: string): Promise<VetJobOffer> {
    return apiClient.post<VetJobOffer>(`/admin/vet-job-offers/${id}/approve`);
  },
  rejectOffer(id: string, reason: string): Promise<VetJobOffer> {
    return apiClient.post<VetJobOffer>(`/admin/vet-job-offers/${id}/reject`, { reason });
  },

  async listSeekers(
    page: number,
    pageSize: number,
    filter: { status?: VetJobModerationStatus } = {},
  ): Promise<Paginated<VetJobSeekerProfile>> {
    const env = await apiClient.requestEnvelope<VetJobSeekerProfile[]>({
      method: 'GET',
      url: '/admin/vet-job-seekers',
      params: { page, pageSize, status: filter.status },
    });
    return { items: env.data, meta: readMeta(env.meta, page, pageSize, env.data.length) };
  },
  getSeeker(id: string): Promise<VetJobSeekerProfile> {
    return apiClient.get<VetJobSeekerProfile>(`/admin/vet-job-seekers/${id}`);
  },
  approveSeeker(id: string): Promise<VetJobSeekerProfile> {
    return apiClient.post<VetJobSeekerProfile>(`/admin/vet-job-seekers/${id}/approve`);
  },
  rejectSeeker(id: string, reason: string): Promise<VetJobSeekerProfile> {
    return apiClient.post<VetJobSeekerProfile>(`/admin/vet-job-seekers/${id}/reject`, { reason });
  },
};

export type AdminVetJobsApi = typeof adminVetJobsApi;
