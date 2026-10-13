import { apiClient } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type { HomeSectionImage, HomeSectionKey } from '../types';

/**
 * `GET /home-sections` (any signed-in user) + `/admin/home-sections*`
 * (`home_section.manage`, ADMIN only) — see
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
};

export type HomeSectionsApi = typeof homeSectionsApi;
