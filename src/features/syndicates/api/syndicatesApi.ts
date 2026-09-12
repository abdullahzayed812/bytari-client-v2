import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreateAnnouncementInput,
  CreateSubmissionInput,
  MySubmissionListFilter,
  MySyndicateAccess,
  Paginated,
  PublicSyndicate,
  SubmissionListFilter,
  SyndicateAnnouncement,
  SyndicateBrowseFilter,
  SyndicateSubmission,
  UpdateAnnouncementInput,
  UpdateSyndicateProfileInput,
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

export type SyndicateMediaKind = 'LOGO' | 'ANNOUNCEMENT_IMAGE' | 'SUBMISSION_ATTACHMENT';

/**
 * Thin wrappers over `/api/v1/syndicates/*`. The API client attaches auth;
 * the backend reuses the organization-scoped RBAC
 * (`organization_memberships` + `AuthorizationService.canInOrganization`) to
 * enforce that a supervisor may only manage the syndicate(s) they were
 * explicitly assigned to.
 */
export const syndicatesApi = {
  // --- media -----------------------------------------------------
  requestUploadUrl(
    kind: SyndicateMediaKind,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/syndicates/media/upload-url', { kind, ...input });
  },

  // --- syndicate profile -------------------------------------------
  listMain(filter: SyndicateBrowseFilter & { page: number; pageSize: number }): Promise<Paginated<PublicSyndicate>> {
    return page<PublicSyndicate>('/syndicates', {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
    });
  },
  getOne(organizationId: string): Promise<PublicSyndicate> {
    return apiClient.get<PublicSyndicate>(`/syndicates/${organizationId}`);
  },
  getMyAccess(organizationId: string): Promise<MySyndicateAccess> {
    return apiClient.get<MySyndicateAccess>(`/syndicates/${organizationId}/my-access`);
  },
  listBranches(
    organizationId: string,
    filter: SyndicateBrowseFilter & { page: number; pageSize: number },
  ): Promise<Paginated<PublicSyndicate>> {
    return page<PublicSyndicate>(`/syndicates/${organizationId}/branches`, {
      page: filter.page,
      pageSize: filter.pageSize,
      search: filter.search || undefined,
    });
  },
  updateProfile(organizationId: string, input: UpdateSyndicateProfileInput): Promise<PublicSyndicate> {
    return apiClient.patch<PublicSyndicate>(`/syndicates/${organizationId}/profile`, input);
  },

  // --- announcements --------------------------------------------
  listAnnouncements(
    organizationId: string,
    params: { page: number; pageSize: number },
  ): Promise<Paginated<SyndicateAnnouncement>> {
    return page<SyndicateAnnouncement>(`/syndicates/${organizationId}/announcements`, params);
  },
  getAnnouncement(id: string): Promise<SyndicateAnnouncement> {
    return apiClient.get<SyndicateAnnouncement>(`/syndicates/announcements/${id}`);
  },
  createAnnouncement(organizationId: string, input: CreateAnnouncementInput): Promise<SyndicateAnnouncement> {
    return apiClient.post<SyndicateAnnouncement>(`/syndicates/${organizationId}/announcements`, input);
  },
  updateAnnouncement(
    organizationId: string,
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<SyndicateAnnouncement> {
    return apiClient.patch<SyndicateAnnouncement>(`/syndicates/${organizationId}/announcements/${id}`, input);
  },
  deleteAnnouncement(organizationId: string, id: string): Promise<unknown> {
    return apiClient.delete(`/syndicates/${organizationId}/announcements/${id}`);
  },

  // --- submissions (requests + inquiries) ------------------------
  createSubmission(organizationId: string, input: CreateSubmissionInput): Promise<SyndicateSubmission> {
    return apiClient.post<SyndicateSubmission>(`/syndicates/${organizationId}/submissions`, input);
  },
  listSubmissions(
    organizationId: string,
    params: { page: number; pageSize: number } & SubmissionListFilter,
  ): Promise<Paginated<SyndicateSubmission>> {
    return page<SyndicateSubmission>(`/syndicates/${organizationId}/submissions`, {
      page: params.page,
      pageSize: params.pageSize,
      kind: params.kind,
      status: params.status,
    });
  },
  getSubmission(organizationId: string, id: string): Promise<SyndicateSubmission> {
    return apiClient.get<SyndicateSubmission>(`/syndicates/${organizationId}/submissions/${id}`);
  },
  respondToSubmission(organizationId: string, id: string, responseText: string): Promise<SyndicateSubmission> {
    return apiClient.post<SyndicateSubmission>(`/syndicates/${organizationId}/submissions/${id}/respond`, {
      responseText,
    });
  },
  closeSubmission(organizationId: string, id: string): Promise<SyndicateSubmission> {
    return apiClient.post<SyndicateSubmission>(`/syndicates/${organizationId}/submissions/${id}/close`);
  },
  listMySubmissions(
    params: { page: number; pageSize: number } & MySubmissionListFilter,
  ): Promise<Paginated<SyndicateSubmission>> {
    return page<SyndicateSubmission>('/syndicates/submissions/mine', {
      page: params.page,
      pageSize: params.pageSize,
      kind: params.kind,
    });
  },
  getMySubmission(id: string): Promise<SyndicateSubmission> {
    return apiClient.get<SyndicateSubmission>(`/syndicates/submissions/mine/${id}`);
  },
};

export type SyndicatesApi = typeof syndicatesApi;
