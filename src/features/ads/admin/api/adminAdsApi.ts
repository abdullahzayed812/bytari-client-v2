import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  AdSlide,
  AdSlideContentInput,
  AdminAdCampaign,
  CreateAdCampaignInput,
  ListAdminAdCampaignsParams,
  Paginated,
  UpdateAdCampaignInput,
} from '../../types';

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
 * Admin / supervisor advertisement management — `/admin/ads*`. Every route is
 * server-gated by `advertisement.manage` (ADMIN override, or an ACTIVE
 * ADVERTISEMENT system-supervisor domain assignment — one permission governs
 * every placement, there is no finer per-placement scope). Slide images use
 * the shared presigned-R2 flow; storage secrets never reach the app.
 */
export const adminAdsApi = {
  // --- campaigns ---------------------------------------------
  async list(
    params: ListAdminAdCampaignsParams & { page: number; pageSize: number },
  ): Promise<Paginated<AdminAdCampaign>> {
    const envelope = await apiClient.requestEnvelope<AdminAdCampaign[]>({
      method: 'GET',
      url: '/admin/ads',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        placement: params.placement,
        type: params.type,
        includeDeleted: params.includeDeleted,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  get(campaignId: string): Promise<AdminAdCampaign> {
    return apiClient.get<AdminAdCampaign>(`/admin/ads/${campaignId}`);
  },

  create(body: CreateAdCampaignInput): Promise<AdminAdCampaign> {
    return apiClient.post<AdminAdCampaign>('/admin/ads', body);
  },

  update(campaignId: string, body: UpdateAdCampaignInput): Promise<AdminAdCampaign> {
    return apiClient.patch<AdminAdCampaign>(`/admin/ads/${campaignId}`, body);
  },

  remove(campaignId: string): Promise<AdminAdCampaign> {
    return apiClient.delete<AdminAdCampaign>(`/admin/ads/${campaignId}`);
  },

  restore(campaignId: string): Promise<AdminAdCampaign> {
    return apiClient.post<AdminAdCampaign>(`/admin/ads/${campaignId}/restore`, {});
  },

  activate(campaignId: string): Promise<AdminAdCampaign> {
    return apiClient.post<AdminAdCampaign>(`/admin/ads/${campaignId}/activate`, {});
  },

  deactivate(campaignId: string): Promise<AdminAdCampaign> {
    return apiClient.post<AdminAdCampaign>(`/admin/ads/${campaignId}/deactivate`, {});
  },

  // --- slides --------------------------------------------------
  addSlide(campaignId: string, body: AdSlideContentInput): Promise<AdSlide> {
    return apiClient.post<AdSlide>(`/admin/ads/${campaignId}/slides`, body);
  },

  updateSlide(campaignId: string, slideId: string, body: AdSlideContentInput): Promise<AdSlide> {
    return apiClient.patch<AdSlide>(`/admin/ads/${campaignId}/slides/${slideId}`, body);
  },

  removeSlide(campaignId: string, slideId: string): Promise<void> {
    return apiClient.delete<void>(`/admin/ads/${campaignId}/slides/${slideId}`);
  },

  reorderSlides(campaignId: string, slideIds: string[]): Promise<AdminAdCampaign> {
    return apiClient.post<AdminAdCampaign>(`/admin/ads/${campaignId}/slides/reorder`, {
      slideIds,
    });
  },

  requestSlideUploadUrl(
    campaignId: string,
    slideId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/admin/ads/${campaignId}/slides/${slideId}/image/upload-url`,
      input,
    );
  },

  registerSlideImage(
    campaignId: string,
    slideId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<AdSlide> {
    return apiClient.post<AdSlide>(
      `/admin/ads/${campaignId}/slides/${slideId}/image`,
      input,
    );
  },

  removeSlideImage(campaignId: string, slideId: string): Promise<AdSlide> {
    return apiClient.delete<AdSlide>(`/admin/ads/${campaignId}/slides/${slideId}/image`);
  },
};

export type AdminAdsApi = typeof adminAdsApi;
