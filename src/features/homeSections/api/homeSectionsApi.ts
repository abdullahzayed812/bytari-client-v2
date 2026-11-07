import type { PublicOrganization } from '@/features/organizations/types';
import { apiClient } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  AdminFeaturedOrganization,
  CreateFeaturedOrganizationInput,
  FeaturedCandidate,
  FeaturedPlacement,
  HomeSectionImage,
  HomeSectionKey,
  UpdateFeaturedOrganizationInput,
} from '../types';

/**
 * `GET /home-sections` (any signed-in user) + `/admin/home-sections*`
 * (images: `home_section.manage`, ADMIN only; featured entries:
 * `featured_organization.manage`, ADMIN or a FEATURED_CLINICS supervisor) — see
 * `server/src/modules/home-sections/presentation/home-section.routes.ts`.
 * Images use the shared presigned-R2 flow; storage secrets never reach the app.
 */
export const homeSectionsApi = {
  list(): Promise<HomeSectionImage[]> {
    return apiClient.get<HomeSectionImage[]>('/home-sections');
  },

  adminList(): Promise<HomeSectionImage[]> {
    return apiClient.get<HomeSectionImage[]>('/admin/home-sections');
  },

  requestUploadUrl(
    key: HomeSectionKey,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(`/admin/home-sections/${key}/image/upload-url`, input);
  },

  registerImage(
    key: HomeSectionKey,
    input: { storageKey: string; mimeType: string },
  ): Promise<HomeSectionImage> {
    return apiClient.post<HomeSectionImage>(`/admin/home-sections/${key}/image`, input);
  },

  removeImage(key: HomeSectionKey): Promise<HomeSectionImage> {
    return apiClient.delete<HomeSectionImage>(`/admin/home-sections/${key}/image`);
  },

  // --- featured clinics / offices (home carousel) ---------------------

  /** Today's carousel for one home page — public directory cards (+ ratings). */
  listFeatured(placement: FeaturedPlacement): Promise<PublicOrganization[]> {
    return apiClient.get<PublicOrganization[]>('/home-sections/featured-organizations', {
      placement,
    });
  },

  adminListFeatured(): Promise<AdminFeaturedOrganization[]> {
    return apiClient.get<AdminFeaturedOrganization[]>(
      '/admin/home-sections/featured-organizations',
    );
  },

  /** ACTIVE organizations of the placement's type for the add form (featured permission only). */
  featuredCandidates(
    placement: FeaturedPlacement,
    search?: string,
    limit = 10,
  ): Promise<FeaturedCandidate[]> {
    return apiClient.get<FeaturedCandidate[]>(
      '/admin/home-sections/featured-organizations/candidates',
      { placement, limit, ...(search ? { search } : {}) },
    );
  },

  createFeatured(input: CreateFeaturedOrganizationInput): Promise<AdminFeaturedOrganization> {
    return apiClient.post<AdminFeaturedOrganization>(
      '/admin/home-sections/featured-organizations',
      input,
    );
  },

  updateFeatured(
    id: string,
    input: UpdateFeaturedOrganizationInput,
  ): Promise<AdminFeaturedOrganization> {
    return apiClient.patch<AdminFeaturedOrganization>(
      `/admin/home-sections/featured-organizations/${id}`,
      input,
    );
  },

  removeFeatured(id: string): Promise<{ removed: boolean }> {
    return apiClient.delete<{ removed: boolean }>(
      `/admin/home-sections/featured-organizations/${id}`,
    );
  },
};

export type HomeSectionsApi = typeof homeSectionsApi;
