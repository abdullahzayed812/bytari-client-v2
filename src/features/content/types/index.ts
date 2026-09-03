/**
 * Content & Knowledge contract — Mobile Phase 11. Mirrors
 * `server/src/modules/content` (`content.constants.ts`, `content.types.ts`,
 * `content.schemas.ts`, OpenAPI `phase14`). No invented fields.
 *
 * Only the PUBLIC surface is consumed:
 *   GET /content?page&pageSize&type&categoryId&q        (any authenticated user)
 *   GET /content/:contentId                             (PUBLISHED + not-deleted → else 404)
 *   GET /content/:contentId/files/:fileId/download      (→ { url, expiresInSeconds })
 *   GET /content-categories                             (any authenticated user)
 *
 * The `/admin/content*` management routes exist server-side but are NOT wired
 * into the mobile app (no mobile content-management area) — documented in
 * MOBILE_ARCHITECTURE.md, not mocked.
 */

export const CONTENT_TYPES = ['ARTICLE', 'BOOK', 'MAGAZINE'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_FILE_KINDS = ['MAIN', 'COVER', 'ATTACHMENT'] as const;
export type ContentFileKind = (typeof CONTENT_FILE_KINDS)[number];

/** URL slug ⇄ enum (routes use the slug; the API uses the enum). */
export const CONTENT_TYPE_SLUGS = ['articles', 'books', 'magazines'] as const;
export type ContentTypeSlug = (typeof CONTENT_TYPE_SLUGS)[number];

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

/**
 * Content item as the mobile app uses it — a DELIBERATELY TRIMMED projection of
 * the backend `ContentDTO`. The backend's public payload still carries
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
  /** Server-resolved URL of the COVER file (public or signed), or null. Never built client-side. */
  coverImageUrl?: string | null;
  categories: ContentCategory[];
  files: ContentFile[];
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
