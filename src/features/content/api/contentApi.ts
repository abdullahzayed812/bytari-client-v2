import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import { CONTENT_TYPES, CONTENT_FILE_KINDS } from '../types';
import type {
  ContentCategory,
  ContentDownload,
  ContentFile,
  ContentItem,
  ContentListFilter,
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

  return {
    id: String(r.id ?? ''),
    type,
    title: String(r.title ?? ''),
    description: (r.description as string | null) ?? null,
    body: (r.body as string | null) ?? null,
    authorName: (r.authorName as string | null) ?? null,
    publishedAt: (r.publishedAt as string | null) ?? null,
    coverImageUrl: (r.coverImageUrl as string | null) ?? null,
    categories,
    files,
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

/**
 * Public content wrappers — 1:1 with the backend routes. Every route requires
 * only authentication; the backend restricts results to PUBLISHED, non-deleted
 * items (a DRAFT / ARCHIVED / deleted id → `404`).
 *
 *   GET /content?page&pageSize&type&categoryId&q
 *   GET /content/:contentId
 *   GET /content/:contentId/files/:fileId/download
 *   GET /content-categories
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
};

export type ContentApi = typeof contentApi;
