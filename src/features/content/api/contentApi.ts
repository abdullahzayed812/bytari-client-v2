import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import { CONTENT_TYPES, CONTENT_FILE_KINDS } from '../types';
import type {
  ContentCategory,
  ContentComment,
  ContentDownload,
  ContentFile,
  ContentItem,
  ContentListFilter,
  ContentRatingAggregate,
  ContentType,
  Paginated,
} from '../types';

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
 * Trim the backend public `ContentDTO` down to the safe `ContentItem` the app
 * uses. The backend's public payload still carries `status` / `createdByUserId`
 * / `updatedByUserId` / `deletedAt` (moderation + authorship metadata); those
 * are dropped HERE so no screen, hook or test can render them (§5, §17, §18).
 */
function toContentItem(raw: unknown): ContentItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = (CONTENT_TYPES as readonly string[]).includes(r.type as string)
    ? (r.type as ContentType)
    : 'ARTICLE';

  const categories: ContentCategory[] = Array.isArray(r.categories)
    ? (r.categories as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? ''),
        slug: String(c.slug ?? ''),
        name: String(c.name ?? ''),
        description: (c.description as string | null) ?? null,
      }))
    : [];

  const files: ContentFile[] = Array.isArray(r.files)
    ? (r.files as Record<string, unknown>[])
        .filter((f) => (CONTENT_FILE_KINDS as readonly string[]).includes(f.kind as string))
        .map((f) => ({
          id: String(f.id ?? ''),
          kind: f.kind as ContentFile['kind'],
          originalFilename: String(f.originalFilename ?? ''),
          mimeType: String(f.mimeType ?? ''),
          sizeBytes: Number(f.sizeBytes ?? 0),
        }))
    : [];

  const rawRating = (r.rating ?? {}) as Record<string, unknown>;
  const rating: ContentRatingAggregate = {
    average: typeof rawRating.average === 'number' ? rawRating.average : null,
    count: Number(rawRating.count ?? 0),
  };

  return {
    id: String(r.id ?? ''),
    type,
    title: String(r.title ?? ''),
    description: (r.description as string | null) ?? null,
    body: (r.body as string | null) ?? null,
    authorName: (r.authorName as string | null) ?? null,
    publishedAt: (r.publishedAt as string | null) ?? null,
    language: (r.language as string | null) ?? null,
    pageCount: (r.pageCount as number | null) ?? null,
    publishYear: (r.publishYear as number | null) ?? null,
    likeCount: Number(r.likeCount ?? 0),
    commentCount: Number(r.commentCount ?? 0),
    viewCount: Number(r.viewCount ?? 0),
    rating,
    isBookmarked: Boolean(r.isBookmarked),
    isLiked: Boolean(r.isLiked),
    categories,
    files,
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

function toComment(raw: unknown): ContentComment {
  const r = (raw ?? {}) as Record<string, unknown>;
  const author = (r.authorName ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    contentId: String(r.contentId ?? ''),
    userId: String(r.userId ?? ''),
    authorName: {
      firstName: String(author.firstName ?? ''),
      lastName: String(author.lastName ?? ''),
    },
    body: String(r.body ?? ''),
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

/**
 * Public content wrappers — 1:1 with the backend routes. Every route requires
 * only authentication; the backend restricts results to PUBLISHED, non-deleted
 * items (a DRAFT / ARCHIVED / deleted id → `404`). Bookmark / like / comment /
 * rating actions are self-service (any authenticated user, no admin permission).
 *
 *   GET /content?page&pageSize&type&categoryId&q&sort&bookmarkedOnly
 *   GET /content/:contentId
 *   GET /content/:contentId/files/:fileId/download
 *   GET /content-categories
 *   POST/DELETE /content/:contentId/bookmark
 *   POST/DELETE /content/:contentId/like
 *   GET/POST /content/:contentId/comments, DELETE .../comments/:commentId
 *   GET/PUT /content/:contentId/rating
 */
export const contentApi = {
  async list(filter: ContentListFilter): Promise<Paginated<ContentItem>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: '/content',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        type: filter.type,
        categoryId: filter.categoryId,
        // the backend search param is `q`
        q: filter.search || undefined,
        sort: filter.sort,
        bookmarkedOnly: filter.bookmarkedOnly ? 'true' : undefined,
      },
    });
    const items = (envelope.data ?? []).map(toContentItem);
    return { items, meta: readMeta(envelope.meta, filter.page, filter.pageSize, items.length) };
  },

  async get(contentId: string): Promise<ContentItem> {
    return toContentItem(await apiClient.get<unknown>(`/content/${contentId}`));
  },

  fileDownload(contentId: string, fileId: string): Promise<ContentDownload> {
    return apiClient.get<ContentDownload>(`/content/${contentId}/files/${fileId}/download`);
  },

  async listCategories(): Promise<ContentCategory[]> {
    const rows = await apiClient.get<Record<string, unknown>[]>('/content-categories');
    return (rows ?? []).map((c) => ({
      id: String(c.id ?? ''),
      slug: String(c.slug ?? ''),
      name: String(c.name ?? ''),
      description: (c.description as string | null) ?? null,
    }));
  },

  // --- engagement: bookmarks / likes -----------------------------

  async setBookmark(contentId: string, bookmarked: boolean): Promise<boolean> {
    const res = bookmarked
      ? await apiClient.post<{ isBookmarked: boolean }>(`/content/${contentId}/bookmark`)
      : await apiClient.delete<{ isBookmarked: boolean }>(`/content/${contentId}/bookmark`);
    return res.isBookmarked;
  },

  async setLike(contentId: string, liked: boolean): Promise<{ isLiked: boolean; likeCount: number }> {
    return liked
      ? apiClient.post(`/content/${contentId}/like`)
      : apiClient.delete(`/content/${contentId}/like`);
  },

  // --- engagement: comments --------------------------------------

  async listComments(contentId: string, page: number, pageSize: number): Promise<Paginated<ContentComment>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: `/content/${contentId}/comments`,
      params: { page, pageSize },
    });
    const items = (envelope.data ?? []).map(toComment);
    return { items, meta: readMeta(envelope.meta, page, pageSize, items.length) };
  },

  async addComment(contentId: string, body: string): Promise<ContentComment> {
    return toComment(await apiClient.post<unknown>(`/content/${contentId}/comments`, { body }));
  },

  deleteComment(contentId: string, commentId: string): Promise<void> {
    return apiClient.delete(`/content/${contentId}/comments/${commentId}`);
  },

  // --- engagement: rating (books) ---------------------------------

  getRating(
    contentId: string,
  ): Promise<{ aggregate: ContentRatingAggregate; myRating: number | null }> {
    return apiClient.get(`/content/${contentId}/rating`);
  },

  submitRating(contentId: string, rating: number): Promise<ContentRatingAggregate> {
    return apiClient.put(`/content/${contentId}/rating`, { rating });
  },
};

export type ContentApi = typeof contentApi;
