import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { BookmarkResult, News, NewsListFilter, NewsListItem, NewsListPage } from '../types';

/**
 * Thin wrappers over `/api/v1/news*` — the public "News" reads plus the
 * per-user bookmark toggle. Contract:
 * `server/src/modules/content/presentation/news.routes.ts`.
 */
export const newsApi = {
  async list(filter: NewsListFilter): Promise<NewsListPage> {
    const envelope = await apiClient.requestEnvelope<NewsListItem[]>({
      method: 'GET',
      url: '/news',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        q: filter.search,
        categoryId: filter.categoryId,
        tag: filter.tag,
        featured: filter.featured ? 'true' : undefined,
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

  featured(): Promise<News | null> {
    return apiClient.get<News | null>('/news/featured');
  },

  get(newsId: string): Promise<News> {
    return apiClient.get<News>(`/news/${newsId}`);
  },

  bookmark(newsId: string): Promise<BookmarkResult> {
    return apiClient.post<BookmarkResult>(`/news/${newsId}/bookmark`);
  },
  unbookmark(newsId: string): Promise<BookmarkResult> {
    return apiClient.delete<BookmarkResult>(`/news/${newsId}/bookmark`);
  },
};

export type NewsApi = typeof newsApi;
