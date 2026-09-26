/**
 * Admin authoring for the two editorial content types that already have a
 * complete backend (`server/src/modules/content` — `tip.*` / `news.*`):
 * `/admin/tips` and `/admin/news` share the DRAFT → PUBLISHED → ARCHIVED
 * lifecycle, soft delete, and the presigned cover-image flow. Guarded by the
 * existing `content.*` permissions (ADMIN or a CONTENT supervisor).
 */
export const EDITORIAL_KINDS = ['tips', 'news'] as const;
export type EditorialKind = (typeof EDITORIAL_KINDS)[number];

export const EDITORIAL_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

export const TIP_PRIORITIES = ['IMPORTANT', 'RECOMMENDED', 'NORMAL'] as const;
export type TipPriority = (typeof TIP_PRIORITIES)[number];
export const NEWS_TAGS = ['NORMAL', 'URGENT', 'IMPORTANT_ALERT'] as const;
export type NewsTag = (typeof NEWS_TAGS)[number];

/** Admin DTO — the union of the tip / news admin fields (kind-specific ones are optional). */
export interface EditorialItem {
  id: string;
  title: string;
  summary: string | null;
  status: EditorialStatus;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  // tips
  readMinutes?: number | null;
  priority?: TipPriority;
  bodyIntro?: string | null;
  keyPoints?: string[];
  warningPoints?: string[];
  vetAdvice?: string | null;
  isTipOfDay?: boolean;
  // news
  source?: string | null;
  tag?: NewsTag;
  isFeatured?: boolean;
  body?: string | null;
  reasonPoints?: string[];
  advicePoints?: string[];
  alertNote?: string | null;
}

export interface EditorialListFilter {
  page: number;
  pageSize: number;
  status?: EditorialStatus;
  q?: string;
}

/** Create / update payload — the server `.strict()` schemas accept exactly these keys per kind. */
export type EditorialInput = Partial<
  Pick<
    EditorialItem,
    | 'title'
    | 'summary'
    | 'readMinutes'
    | 'priority'
    | 'bodyIntro'
    | 'keyPoints'
    | 'warningPoints'
    | 'vetAdvice'
    | 'source'
    | 'tag'
    | 'isFeatured'
    | 'body'
    | 'reasonPoints'
    | 'advicePoints'
    | 'alertNote'
  >
>;

export function isEditorialKind(v: unknown): v is EditorialKind {
  return typeof v === 'string' && (EDITORIAL_KINDS as readonly string[]).includes(v);
}
