import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  BookmarkResult,
  HelpfulResult,
  Tip,
  TipListFilter,
  TipListItem,
  TipListPage,
} from '../types';

/**
 * Thin wrappers over `/api/v1/tips*` — the public "Tips" reads plus the
 * per-user bookmark / helpful toggles. Contract:
 * `server/src/modules/content/presentation/tip.routes.ts`.
 */
export const tipsApi = {
  async list(filter: TipListFilter): Promise<TipListPage> {
    const envelope = await apiClient.requestEnvelope<TipListItem[]>({
      method: 'GET',
      url: '/tips',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        q: filter.search,
        categoryId: filter.categoryId,
        priority: filter.priority,
        bookmarked: filter.bookmarked ? 'true' : undefined,
      },
    });
    const meta = (envelope.meta ?? {}) as Partial<ApiPageMeta>;
    return {
      items: envelope.data,
      meta: {
        page: meta.page ?? filter.page,
        pageSize: meta.pageSize ?? filter.pageSize,
        total: meta.total ?? envelope.data.length,
        totalPages: meta.totalPages ?? 1,
      },
    };
  },

  tipOfTheDay(): Promise<Tip | null> {
    return apiClient.get<Tip | null>('/tips/tip-of-the-day');
  },

  get(tipId: string): Promise<Tip> {
    return apiClient.get<Tip>(`/tips/${tipId}`);
  },

  bookmark(tipId: string): Promise<BookmarkResult> {
    return apiClient.post<BookmarkResult>(`/tips/${tipId}/bookmark`);
  },
  unbookmark(tipId: string): Promise<BookmarkResult> {
    return apiClient.delete<BookmarkResult>(`/tips/${tipId}/bookmark`);
  },

  markHelpful(tipId: string): Promise<HelpfulResult> {
    return apiClient.post<HelpfulResult>(`/tips/${tipId}/helpful`);
  },
  unmarkHelpful(tipId: string): Promise<HelpfulResult> {
    return apiClient.delete<HelpfulResult>(`/tips/${tipId}/helpful`);
  },
};

export type TipsApi = typeof tipsApi;
