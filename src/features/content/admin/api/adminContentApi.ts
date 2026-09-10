import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { ContentFileKind, Paginated } from '../../types';
import type {
  AdminCategory,
  AdminContentFile,
  AdminContentItem,
  AdminContentListFilter,
  ContentFileDownload,
  ContentUploadUrl,
  CreateCategoryInput,
  CreateContentInput,
  UpdateCategoryInput,
  UpdateContentInput,
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

function toFile(raw: unknown): AdminContentFile {
  const f = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(f.id ?? ''),
    contentId: String(f.contentId ?? ''),
    kind: f.kind as AdminContentFile['kind'],
    storageKey: String(f.storageKey ?? ''),
    storageProvider: String(f.storageProvider ?? ''),
    originalFilename: String(f.originalFilename ?? ''),
    mimeType: String(f.mimeType ?? ''),
    sizeBytes: Number(f.sizeBytes ?? 0),
    checksum: (f.checksum as string | null) ?? null,
    uploadedByUserId: (f.uploadedByUserId as string | null) ?? null,
    createdAt: String(f.createdAt ?? ''),
  };
}

function toAdminItem(raw: unknown): AdminContentItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const categories = Array.isArray(r.categories)
    ? (r.categories as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? ''),
        slug: String(c.slug ?? ''),
        name: String(c.name ?? ''),
        description: (c.description as string | null) ?? null,
      }))
    : [];
  const files = Array.isArray(r.files) ? (r.files as unknown[]).map(toFile) : [];
  const rawRating = (r.rating ?? {}) as Record<string, unknown>;

  return {
    id: String(r.id ?? ''),
    type: r.type as AdminContentItem['type'],
    title: String(r.title ?? ''),
    description: (r.description as string | null) ?? null,
    body: (r.body as string | null) ?? null,
    authorName: (r.authorName as string | null) ?? null,
    status: r.status as AdminContentItem['status'],
    publishedAt: (r.publishedAt as string | null) ?? null,
    language: (r.language as string | null) ?? null,
    pageCount: (r.pageCount as number | null) ?? null,
    publishYear: (r.publishYear as number | null) ?? null,
    likeCount: Number(r.likeCount ?? 0),
    commentCount: Number(r.commentCount ?? 0),
    viewCount: Number(r.viewCount ?? 0),
    rating: {
      average: typeof rawRating.average === 'number' ? rawRating.average : null,
      count: Number(rawRating.count ?? 0),
    },
    categories,
    files,
    createdByUserId: (r.createdByUserId as string | null) ?? null,
    updatedByUserId: (r.updatedByUserId as string | null) ?? null,
    deletedAt: (r.deletedAt as string | null) ?? null,
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

function toCategory(raw: unknown): AdminCategory {
  const c = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(c.id ?? ''),
    slug: String(c.slug ?? ''),
    name: String(c.name ?? ''),
    description: (c.description as string | null) ?? null,
  };
}

/**
 * `/admin/content*` + `/admin/content-categories*` — gated by
 * `authorizeContent()` (ADMIN or an approved-vet CONTENT supervisor). Files
 * use the shared presigned-R2 direct-upload flow; storage credentials never
 * reach the app.
 */
export const adminContentApi = {
  async list(filter: AdminContentListFilter): Promise<Paginated<AdminContentItem>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: '/admin/content',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        type: filter.type,
        status: filter.status,
        categoryId: filter.categoryId,
        q: filter.search || undefined,
      },
    });
    const items = (envelope.data ?? []).map(toAdminItem);
    return { items, meta: readMeta(envelope.meta, filter.page, filter.pageSize, items.length) };
  },

  async get(contentId: string): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.get<unknown>(`/admin/content/${contentId}`));
  },

  async create(body: CreateContentInput): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.post<unknown>('/admin/content', body));
  },

  async update(contentId: string, body: UpdateContentInput): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.patch<unknown>(`/admin/content/${contentId}`, body));
  },

  async remove(contentId: string): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.delete<unknown>(`/admin/content/${contentId}`));
  },

  async restore(contentId: string): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.post<unknown>(`/admin/content/${contentId}/restore`));
  },

  async publish(contentId: string): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.post<unknown>(`/admin/content/${contentId}/publish`));
  },

  async archive(contentId: string): Promise<AdminContentItem> {
    return toAdminItem(await apiClient.post<unknown>(`/admin/content/${contentId}/archive`));
  },

  // --- files ---------------------------------------------------

  requestUploadUrl(
    contentId: string,
    input: { kind: ContentFileKind; filename: string; mimeType: string; size: number },
  ): Promise<ContentUploadUrl> {
    return apiClient.post<ContentUploadUrl>(
      `/admin/content/${contentId}/files/upload-url`,
      input,
    );
  },

  async registerFile(
    contentId: string,
    input: {
      storageKey: string;
      kind: ContentFileKind;
      filename: string;
      mimeType: string;
      checksum?: string | null;
    },
  ): Promise<AdminContentItem> {
    return toAdminItem(
      await apiClient.post<unknown>(`/admin/content/${contentId}/files`, input),
    );
  },

  async deleteFile(contentId: string, fileId: string): Promise<AdminContentItem> {
    return toAdminItem(
      await apiClient.delete<unknown>(`/admin/content/${contentId}/files/${fileId}`),
    );
  },

  downloadFile(contentId: string, fileId: string): Promise<ContentFileDownload> {
    return apiClient.get<ContentFileDownload>(
      `/admin/content/${contentId}/files/${fileId}/download`,
    );
  },

  // --- categories ------------------------------------------------

  async listCategories(): Promise<AdminCategory[]> {
    const rows = await apiClient.get<unknown[]>('/admin/content-categories');
    return (rows ?? []).map(toCategory);
  },

  async createCategory(body: CreateCategoryInput): Promise<AdminCategory> {
    return toCategory(await apiClient.post<unknown>('/admin/content-categories', body));
  },

  async updateCategory(categoryId: string, body: UpdateCategoryInput): Promise<AdminCategory> {
    return toCategory(
      await apiClient.patch<unknown>(`/admin/content-categories/${categoryId}`, body),
    );
  },

  deleteCategory(categoryId: string): Promise<void> {
    return apiClient.delete(`/admin/content-categories/${categoryId}`);
  },
};

export type AdminContentApi = typeof adminContentApi;
