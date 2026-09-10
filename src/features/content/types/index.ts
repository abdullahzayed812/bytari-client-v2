/**
 * Content & Knowledge contract — Mobile Phase 11, extended for the
 * Veterinarian Home "Veterinary Magazine" (type=MAGAZINE) and "Veterinary
 * Books" (type=BOOK) sections. Mirrors `server/src/modules/content`
 * (`content.constants.ts`, `content.types.ts`, `content.schemas.ts`, OpenAPI
 * `phase14`). No invented fields.
 *
 *   GET /content?page&pageSize&type&categoryId&q&sort&bookmarkedOnly
 *   GET /content/:contentId
 *   GET /content/:contentId/files/:fileId/download
 *   GET /content-categories
 *   POST/DELETE /content/:contentId/bookmark
 *   POST/DELETE /content/:contentId/like
 *   GET/POST /content/:contentId/comments
 *   DELETE /content/:contentId/comments/:commentId
 *   GET/PUT /content/:contentId/rating
 *
 * The `/admin/content*` management routes ARE now wired into the mobile app
 * — see `features/content/admin` — scoped to the Veterinarian interface
 * (the backend already requires an approved-vet CONTENT supervisor or ADMIN).
 */

export const CONTENT_TYPES = ['ARTICLE', 'BOOK', 'MAGAZINE'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_FILE_KINDS = ['MAIN', 'COVER', 'ATTACHMENT'] as const;
export type ContentFileKind = (typeof CONTENT_FILE_KINDS)[number];

/** URL slug ⇄ enum (routes use the slug; the API uses the enum). */
export const CONTENT_TYPE_SLUGS = ['articles', 'books', 'magazines'] as const;
export type ContentTypeSlug = (typeof CONTENT_TYPE_SLUGS)[number];

export const CONTENT_SORTS = ['latest', 'mostRead', 'topRated'] as const;
export type ContentSort = (typeof CONTENT_SORTS)[number];

export interface ContentCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

/**
 * Public file view — NO `storageKey` / `storageProvider` / `checksum` /
 * `uploadedByUserId` / `contentId`. The bytes are reached only through the
 * `/download` route, which returns a backend-authorized URL.
 */
export interface ContentFile {
  id: string;
  kind: ContentFileKind;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

/** `null` average when there are no ratings yet. */
export interface ContentRatingAggregate {
  average: number | null;
  count: number;
}

/**
 * Content item as the mobile app uses it — a DELIBERATELY TRIMMED projection of
 * the backend public `ContentDTO`. The backend's public payload still carries
 * `status` / `createdByUserId` / `updatedByUserId` / `deletedAt`; those are
 * moderation / authorship metadata (§5, §17, §18) and are dropped in
 * `contentApi` before anything downstream sees them.
 */
export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  /**
   * Article text. Per the backend: "stored verbatim as untrusted text and
   * never rendered by the API — clients MUST escape / sanitise on display."
   * Rendered as PLAIN TEXT only (React Native `<Text>` never executes markup).
   */
  body: string | null;
  authorName: string | null;
  /** ISO datetime or null. */
  publishedAt: string | null;
  /** Book-only; null for ARTICLE/MAGAZINE. */
  language: string | null;
  pageCount: number | null;
  publishYear: number | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  rating: ContentRatingAggregate;
  isBookmarked: boolean;
  isLiked: boolean;
  categories: ContentCategory[];
  files: ContentFile[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentComment {
  id: string;
  contentId: string;
  userId: string;
  authorName: { firstName: string; lastName: string };
  body: string;
  createdAt: string;
  updatedAt: string;
}

/** `GET /content/:id/files/:fileId/download` response. */
export interface ContentDownload {
  url: string;
  /** `null` when `url` is a stable public URL; otherwise the signed-URL TTL. */
  expiresInSeconds: number | null;
}

export interface ContentListFilter {
  page: number;
  pageSize: number;
  type?: ContentType;
  categoryId?: string;
  /** Free-text search — the backend query param is `q`. */
  search?: string;
  sort?: ContentSort;
  bookmarkedOnly?: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
