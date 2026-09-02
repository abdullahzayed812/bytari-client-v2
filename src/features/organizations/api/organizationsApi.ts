import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AddMemberInput,
  AssignSupervisorInput,
  CreateOrganizationInput,
  DiscoverSort,
  MemberListFilter,
  MyOrganization,
  OrganizationDetail,
  OrganizationMember,
  OrganizationReview,
  OrganizationSupervisor,
  OrganizationType,
  OrganizationWithDetails,
  Organization,
  Paginated,
  PublicOrganization,
  PublicOrganizationDetail,
  SubmitReviewInput,
  UpdateMemberInput,
  UpdateOrganizationInput,
  UpdateSupervisorInput,
} from '../types';

/**
 * Thin wrappers over `/api/v1/organizations/*`. The API client attaches auth;
 * the backend derives + enforces every organization-scoped authorization rule.
 * No endpoint here is invented — each maps 1:1 to
 * `server/src/modules/organizations/presentation/organization.routes.ts`.
 *
 *   POST   /organizations                              → create (201)
 *   GET    /organizations?page&pageSize                → the caller's memberships
 *   GET    /organizations/discover?type&search&sort&lat&lng&page&pageSize → ACTIVE orgs, any user
 *   GET    /organizations/discover/:id                  → single ACTIVE org, any user
 *   GET    /organizations/:id                          → detail + myRole
 *   PATCH  /organizations/:id                          → update profile
 *   POST   /organizations/:id/leave                    → leave (owner rejected)
 *   GET    /organizations/:id/members?page&pageSize&status&roleKey
 *   POST   /organizations/:id/members                  → add member (201)
 *   PATCH  /organizations/:id/members/:memberId        → update role/status
 *   DELETE /organizations/:id/members/:memberId        → remove
 *   GET    /organizations/:id/supervisors              → plain array (not paged)
 *   POST   /organizations/:id/supervisors              → assign (201)
 *   PATCH  /organizations/:id/supervisors/:membershipId→ update permissions
 *   DELETE /organizations/:id/supervisors/:membershipId→ remove
 */
function readMeta(
  meta: unknown,
  page: number,
  pageSize: number,
  fallbackTotal: number,
): PageMetaOut {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? fallbackTotal,
    totalPages: m.totalPages ?? 1,
  };
}
type PageMetaOut = { page: number; pageSize: number; total: number; totalPages: number };

export const organizationsApi = {
  async listMine(page: number, pageSize: number): Promise<Paginated<MyOrganization>> {
    const envelope = await apiClient.requestEnvelope<MyOrganization[]>({
      method: 'GET',
      url: '/organizations',
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  get(organizationId: string): Promise<OrganizationDetail> {
    return apiClient.get<OrganizationDetail>(`/organizations/${organizationId}`);
  },

  /**
   * `GET /organizations/discover` — any authenticated user, ACTIVE orgs only.
   * `sort: 'nearest'` requires `near` (both `lat` and `lng`) — the backend
   * computes and orders by real distance; this client never estimates it.
   */
  async discover(filter: {
    page: number;
    pageSize: number;
    type?: OrganizationType;
    search?: string;
    sort?: DiscoverSort;
    near?: { lat: number; lng: number };
  }): Promise<Paginated<PublicOrganization>> {
    const envelope = await apiClient.requestEnvelope<PublicOrganization[]>({
      method: 'GET',
      url: '/organizations/discover',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        type: filter.type,
        search: filter.search,
        sort: filter.sort,
        lat: filter.near?.lat,
        lng: filter.near?.lng,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  /** Clinic Details screen — profile + veterinarians + the viewer's follow/rating state. */
  getPublic(organizationId: string): Promise<PublicOrganizationDetail> {
    return apiClient.get<PublicOrganizationDetail>(`/organizations/discover/${organizationId}`);
  },

  // --- engagement: follow + reviews ------------------------------

  follow(organizationId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/organizations/${organizationId}/follow`);
  },

  unfollow(organizationId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/organizations/${organizationId}/follow`);
  },

  submitReview(organizationId: string, input: SubmitReviewInput): Promise<OrganizationReview> {
    return apiClient.post<OrganizationReview>(`/organizations/${organizationId}/reviews`, input);
  },

  create(input: CreateOrganizationInput): Promise<OrganizationWithDetails> {
    return apiClient.post<OrganizationWithDetails>('/organizations', input);
  },

  update(organizationId: string, input: UpdateOrganizationInput): Promise<Organization> {
    return apiClient.patch<Organization>(`/organizations/${organizationId}`, input);
  },

  leave(organizationId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/organizations/${organizationId}/leave`);
  },

  // --- members ------------------------------------------------------

  async listMembers(
    organizationId: string,
    filter: MemberListFilter,
  ): Promise<Paginated<OrganizationMember>> {
    const envelope = await apiClient.requestEnvelope<OrganizationMember[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/members`,
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        status: filter.status,
        roleKey: filter.roleKey,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  addMember(organizationId: string, input: AddMemberInput): Promise<OrganizationMember> {
    return apiClient.post<OrganizationMember>(`/organizations/${organizationId}/members`, input);
  },

  updateMember(
    organizationId: string,
    memberId: string,
    input: UpdateMemberInput,
  ): Promise<OrganizationMember> {
    return apiClient.patch<OrganizationMember>(
      `/organizations/${organizationId}/members/${memberId}`,
      input,
    );
  },

  removeMember(organizationId: string, memberId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/organizations/${organizationId}/members/${memberId}`,
    );
  },

  // --- supervisors ---------------------------------------------

  /** Not paginated — the backend returns a plain array. */
  listSupervisors(organizationId: string): Promise<OrganizationSupervisor[]> {
    return apiClient.get<OrganizationSupervisor[]>(`/organizations/${organizationId}/supervisors`);
  },

  assignSupervisor(
    organizationId: string,
    input: AssignSupervisorInput,
  ): Promise<OrganizationSupervisor> {
    return apiClient.post<OrganizationSupervisor>(
      `/organizations/${organizationId}/supervisors`,
      input,
    );
  },

  updateSupervisor(
    organizationId: string,
    membershipId: string,
    input: UpdateSupervisorInput,
  ): Promise<OrganizationSupervisor> {
    return apiClient.patch<OrganizationSupervisor>(
      `/organizations/${organizationId}/supervisors/${membershipId}`,
      input,
    );
  },

  removeSupervisor(organizationId: string, membershipId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/organizations/${organizationId}/supervisors/${membershipId}`,
    );
  },
};

export type OrganizationsApi = typeof organizationsApi;
