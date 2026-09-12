import { apiClient } from '@/services/api';

import type { CreateSyndicateInput, PublicSyndicate } from '../types';

/** `POST /admin/syndicates` — ADMIN only (`syndicate.admin.create`). */
export const adminSyndicatesApi = {
  create(input: CreateSyndicateInput): Promise<PublicSyndicate> {
    return apiClient.post<PublicSyndicate>('/admin/syndicates', input);
  },
};

export type AdminSyndicatesApi = typeof adminSyndicatesApi;
