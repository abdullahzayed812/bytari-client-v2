import { apiClient } from '@/services/api';

import type { CreateSyndicateInput, PublicSyndicate } from '../types';

/** `/admin/syndicates` — ADMIN only (`syndicate.admin.create` / `syndicate.admin.delete`). */
export const adminSyndicatesApi = {
  create(input: CreateSyndicateInput): Promise<PublicSyndicate> {
    return apiClient.post<PublicSyndicate>('/admin/syndicates', input);
  },
  /** Soft delete — the syndicate is deactivated and its registrations end. */
  remove(organizationId: string): Promise<unknown> {
    return apiClient.delete(`/admin/syndicates/${organizationId}`);
  },
};

export type AdminSyndicatesApi = typeof adminSyndicatesApi;
