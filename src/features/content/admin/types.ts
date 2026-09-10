import type {
  ContentFileKind,
  ContentRatingAggregate,
  ContentStatus,
  ContentType,
} from '../types';

/**
 * Admin/supervisor content management contract — `/admin/content*` +
 * `/admin/content-categories*`. Mirrors `server/src/modules/content`
 * (`content.types.ts` `ContentDTO`/`AdminContentFileDTO`, `content.schemas.ts`).
 * Gated server-side by `authorizeContent()` (ADMIN or an approved-vet CONTENT
 * supervisor) — this already scopes the whole feature to the Veterinarian
 * interface with no extra client-side role check needed.
 */

/** File view for admins — includes the storage key (never exposed publicly). */
export interface AdminContentFile {
  id: string;
  contentId: string;
  kind: ContentFileKind;
  storageKey: string;
  storageProvider: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  uploadedByUserId: string | null;
  createdAt: string;
}

export interface AdminContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  body: string | null;
  authorName: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  language: string | null;
  pageCount: number | null;
  publishYear: number | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  rating: ContentRatingAggregate;
  categories: { id: string; slug: string; name: string; description: string | null }[];
  files: AdminContentFile[];
  createdByUserId: string | null;
  updatedByUserId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentListFilter {
  page: number;
  pageSize: number;
  type?: ContentType;
  status?: ContentStatus;
  categoryId?: string;
  search?: string;
}

export interface CreateContentInput {
  type: ContentType;
  title: string;
  description?: string | null;
  body?: string | null;
  authorName?: string | null;
  language?: string | null;
  pageCount?: number | null;
  publishYear?: number | null;
  categoryIds?: string[];
}

export type UpdateContentInput = Partial<Omit<CreateContentInput, 'type'>>;

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface CreateCategoryInput {
  slug: string;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
}

/** `/admin/content/:id/files/upload-url` response — the server-controlled key + a direct-PUT URL. */
export interface ContentUploadUrl {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface ContentFileDownload {
  url: string;
  expiresInSeconds: number | null;
}
