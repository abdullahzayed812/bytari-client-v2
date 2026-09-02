import { apiClient } from '@/services/api';

import type { AdCampaign, AdPlacement } from '../types';

/**
 * Thin wrapper over `GET /api/v1/ads?placement=…` — the in-app advertisement
 * feed. Authenticated read, not paginated (a small admin-curated set), matching
 * `server/src/modules/advertisements/presentation/advertisement.routes.ts`.
 */
export const adsApi = {
  list(placement: AdPlacement): Promise<AdCampaign[]> {
    return apiClient.get<AdCampaign[]>('/ads', { placement });
  },
};

export type AdsApi = typeof adsApi;
