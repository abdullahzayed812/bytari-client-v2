import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreateVetJobApplicationInput,
  CreateVetJobOfferInput,
  CreateVetJobSeekerProfileInput,
  OfferBrowseFilter,
  Paginated,
  PublicVetJobOffer,
  PublicVetJobSeekerProfile,
  SeekerBrowseFilter,
  UpdateVetJobOfferInput,
  UpdateVetJobSeekerProfileInput,
  VetJobApplication,
  VetJobApplicationStatus,
  VetJobModerationStatus,
  VetJobOffer,
  VetJobSeekerProfile,
} from '../types';

function meta(m: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const x = (m ?? {}) as Partial<ApiPageMeta>;
  return {
    page: x.page ?? page,
    pageSize: x.pageSize ?? pageSize,
    total: x.total ?? count,
    totalPages: x.totalPages ?? 1,
  };
}

async function page<T>(url: string, params: Record<string, unknown>): Promise<Paginated<T>> {
  const p = Number(params.page ?? 1);
  const ps = Number(params.pageSize ?? 20);
  const env = await apiClient.requestEnvelope<T[]>({ method: 'GET', url, params });
  return { items: env.data, meta: meta(env.meta, p, ps, env.data.length) };
}

/**
 * Thin wrappers over `/api/v1/vet-jobs/*`. The API client attaches auth; the
 * backend derives + enforces every role / ownership / moderation rule (e.g.
 * only an approved veterinarian may create a seeker profile or apply).
 */
export const vetJobsApi = {
  // --- attachments (CV / photo) --------------------------------
  requestAttachmentUploadUrl(input: {
    filename: string;
    mimeType: string;
    size: number;
  }): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/vet-jobs/attachments/upload-url', input);
  },

  // --- offers ------------------------------------------------
  listOffers(
    filter: OfferBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<PublicVetJobOffer>> {
    return page<PublicVetJobOffer>('/vet-jobs/offers', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
      employmentType: filter.employmentType,
      governorate: filter.governorate || undefined,
    });
  },
  listMyOffers(params: {
    page: number;
    pageSize: number;
    status?: VetJobModerationStatus;
  }): Promise<Paginated<VetJobOffer>> {
    return page<VetJobOffer>('/vet-jobs/offers/mine', params);
  },
  getOffer(id: string): Promise<PublicVetJobOffer> {
    return apiClient.get<PublicVetJobOffer>(`/vet-jobs/offers/${id}`);
  },
  getMyOffer(id: string): Promise<VetJobOffer> {
    return apiClient.get<VetJobOffer>(`/vet-jobs/offers/${id}/manage`);
  },
  createOffer(input: CreateVetJobOfferInput): Promise<VetJobOffer> {
    return apiClient.post<VetJobOffer>('/vet-jobs/offers', input);
  },
  updateOffer(id: string, input: UpdateVetJobOfferInput): Promise<VetJobOffer> {
    return apiClient.patch<VetJobOffer>(`/vet-jobs/offers/${id}`, input);
  },
  deleteOffer(id: string): Promise<unknown> {
    return apiClient.delete(`/vet-jobs/offers/${id}`);
  },
  closeOffer(id: string): Promise<VetJobOffer> {
    return apiClient.post<VetJobOffer>(`/vet-jobs/offers/${id}/close`);
  },

  // --- applications --------------------------------------------
  apply(jobOfferId: string, input: CreateVetJobApplicationInput): Promise<VetJobApplication> {
    return apiClient.post<VetJobApplication>(`/vet-jobs/offers/${jobOfferId}/applications`, input);
  },
  listOfferApplications(
    jobOfferId: string,
    params: { page: number; pageSize: number; status?: VetJobApplicationStatus },
  ): Promise<Paginated<VetJobApplication>> {
    return page<VetJobApplication>(`/vet-jobs/offers/${jobOfferId}/applications`, params);
  },
  listReceivedApplications(params: {
    page: number;
    pageSize: number;
    status?: VetJobApplicationStatus;
  }): Promise<Paginated<VetJobApplication>> {
    return page<VetJobApplication>('/vet-jobs/applications/received', params);
  },
  listMyApplications(params: {
    page: number;
    pageSize: number;
    status?: VetJobApplicationStatus;
  }): Promise<Paginated<VetJobApplication>> {
    return page<VetJobApplication>('/vet-jobs/applications/mine', params);
  },
  getApplication(id: string): Promise<VetJobApplication> {
    return apiClient.get<VetJobApplication>(`/vet-jobs/applications/${id}`);
  },
  acceptApplication(id: string): Promise<VetJobApplication> {
    return apiClient.post<VetJobApplication>(`/vet-jobs/applications/${id}/accept`);
  },
  rejectApplication(id: string): Promise<VetJobApplication> {
    return apiClient.post<VetJobApplication>(`/vet-jobs/applications/${id}/reject`);
  },

  // --- job-seeker profiles ("باحثون عن عمل") --------------------
  listSeekers(
    filter: SeekerBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<PublicVetJobSeekerProfile>> {
    return page<PublicVetJobSeekerProfile>('/vet-jobs/seekers', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
      specialty: filter.specialty || undefined,
      governorate: filter.governorate || undefined,
    });
  },
  getSeeker(id: string): Promise<PublicVetJobSeekerProfile> {
    return apiClient.get<PublicVetJobSeekerProfile>(`/vet-jobs/seekers/${id}`);
  },
  getMySeekerProfile(): Promise<VetJobSeekerProfile | null> {
    return apiClient.get<VetJobSeekerProfile | null>('/vet-jobs/seekers/mine');
  },
  createSeekerProfile(input: CreateVetJobSeekerProfileInput): Promise<VetJobSeekerProfile> {
    return apiClient.post<VetJobSeekerProfile>('/vet-jobs/seekers', input);
  },
  updateSeekerProfile(input: UpdateVetJobSeekerProfileInput): Promise<VetJobSeekerProfile> {
    return apiClient.patch<VetJobSeekerProfile>('/vet-jobs/seekers/mine', input);
  },
  deactivateSeekerProfile(): Promise<VetJobSeekerProfile> {
    return apiClient.post<VetJobSeekerProfile>('/vet-jobs/seekers/mine/deactivate');
  },
  startConversationWithSeeker(id: string): Promise<{ conversationId: string }> {
    return apiClient.post<{ conversationId: string }>(`/vet-jobs/seekers/${id}/conversation`);
  },
};

export type VetJobsApi = typeof vetJobsApi;
