import { apiClient } from '@/services/api';

import type { HomeAd } from '../types';

/**
 * Thin wrapper over `GET /api/v1/home-ads` — the Pet Owner Home banner
 * carousel. Public/authenticated read, not paginated (a small admin-curated
 * list), matching `server/src/modules/homeAds/presentation/home-ad.routes.ts`.
 */
export const homeAdsApi = {
  list(): Promise<HomeAd[]> {
    return apiClient.get<HomeAd[]>('/home-ads');
  },
};

export type HomeAdsApi = typeof homeAdsApi;
