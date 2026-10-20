import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adKeys } from '../../api';
import type {
  AdSlide,
  AdSlideContentInput,
  AdminAdCampaign,
  CreateAdCampaignInput,
  ListAdminAdCampaignsParams,
  Paginated,
  UpdateAdCampaignInput,
} from '../../types';
import { adminAdsApi } from '../api/adminAdsApi';

/** Server-paginated (infinite) campaign list — every page, not only the first. */
export function useAdminAdCampaigns(params: ListAdminAdCampaignsParams) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<AdminAdCampaign>,
    ApiError,
    InfiniteData<Paginated<AdminAdCampaign>>,
    ReturnType<typeof adKeys.adminList>,
    number
  >({
    queryKey: adKeys.adminList(params),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminAdsApi.list({ ...params, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const campaigns = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, campaigns };
}

export function useAdminAdCampaign(campaignId: string | undefined) {
  return useQuery<AdminAdCampaign, ApiError>({
    queryKey: adKeys.adminCampaign(campaignId ?? 'unknown'),
    queryFn: () => adminAdsApi.get(campaignId as string),
    enabled: Boolean(campaignId),
  });
}

/** Every mutation invalidates the admin list + the touched campaign + the public feed. */
export function useAdminAdCampaignMutations() {
  const qc = useQueryClient();
  const invalidate = (campaignId?: string): void => {
    void qc.invalidateQueries({ queryKey: adKeys.admin() });
    void qc.invalidateQueries({ queryKey: adKeys.all });
    if (campaignId) void qc.invalidateQueries({ queryKey: adKeys.adminCampaign(campaignId) });
  };

  const create = useMutation<AdminAdCampaign, ApiError, CreateAdCampaignInput>({
    mutationFn: (body) => adminAdsApi.create(body),
    onSuccess: (c) => invalidate(c.id),
  });
  const update = useMutation<
    AdminAdCampaign,
    ApiError,
    { campaignId: string; body: UpdateAdCampaignInput }
  >({
    mutationFn: ({ campaignId, body }) => adminAdsApi.update(campaignId, body),
    onSuccess: (c) => invalidate(c.id),
  });
  const remove = useMutation<AdminAdCampaign, ApiError, string>({
    mutationFn: (campaignId) => adminAdsApi.remove(campaignId),
    onSuccess: (c) => invalidate(c.id),
  });
  const restore = useMutation<AdminAdCampaign, ApiError, string>({
    mutationFn: (campaignId) => adminAdsApi.restore(campaignId),
    onSuccess: (c) => invalidate(c.id),
  });
  const activate = useMutation<AdminAdCampaign, ApiError, string>({
    mutationFn: (campaignId) => adminAdsApi.activate(campaignId),
    onSuccess: (c) => invalidate(c.id),
  });
  const deactivate = useMutation<AdminAdCampaign, ApiError, string>({
    mutationFn: (campaignId) => adminAdsApi.deactivate(campaignId),
    onSuccess: (c) => invalidate(c.id),
  });

  return { create, update, remove, restore, activate, deactivate };
}

export function useAdminAdSlideMutations(campaignId: string) {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: adKeys.adminCampaign(campaignId) });
    void qc.invalidateQueries({ queryKey: adKeys.admin() });
    void qc.invalidateQueries({ queryKey: adKeys.all });
  };

  const addSlide = useMutation<unknown, ApiError, AdSlideContentInput>({
    mutationFn: (body) => adminAdsApi.addSlide(campaignId, body),
    onSuccess: invalidate,
  });
  const updateSlide = useMutation<
    unknown,
    ApiError,
    { slideId: string; body: AdSlideContentInput }
  >({
    mutationFn: ({ slideId, body }) => adminAdsApi.updateSlide(campaignId, slideId, body),
    onSuccess: invalidate,
  });
  const removeSlide = useMutation<void, ApiError, string>({
    mutationFn: (slideId) => adminAdsApi.removeSlide(campaignId, slideId),
    onSuccess: invalidate,
  });
  const reorderSlides = useMutation<AdminAdCampaign, ApiError, string[]>({
    mutationFn: (slideIds) => adminAdsApi.reorderSlides(campaignId, slideIds),
    onSuccess: invalidate,
  });
  const removeSlideImage = useMutation<AdSlide, ApiError, string>({
    mutationFn: (slideId) => adminAdsApi.removeSlideImage(campaignId, slideId),
    onSuccess: invalidate,
  });

  return { addSlide, updateSlide, removeSlide, reorderSlides, removeSlideImage };
}
