/**
 * Tips contract — mirrors the backend `content` module's tip DTOs exactly
 * (`server/src/modules/content/domain/tip.types.ts`). Public reads only;
 * management (create / publish / cover) is done by ADMIN / CONTENT supervisors
 * through the backend admin API — there is no mobile tip-management screen.
 */

export const TIP_PRIORITIES = ['IMPORTANT', 'RECOMMENDED', 'NORMAL'] as const;
export type TipPriority = (typeof TIP_PRIORITIES)[number];

export interface TipCategoryRef {
  id: string;
  slug: string;
  name: string;
}

/** List-card projection. */
export interface TipListItem {
  id: string;
  title: string;
  summary: string | null;
  readMinutes: number | null;
  priority: TipPriority;
  isTipOfDay: boolean;
  category: TipCategoryRef | null;
  coverImageUrl: string | null;
  helpfulCount: number;
  isBookmarked: boolean;
  isHelpful: boolean;
  publishedAt: string | null;
}

/** Full detail — adds the sectioned body. */
export interface Tip extends TipListItem {
  bodyIntro: string | null;
  keyPoints: string[];
  warningPoints: string[];
  vetAdvice: string | null;
  updatedAt: string;
}

export interface TipListFilter {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  priority?: TipPriority;
  bookmarked?: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TipListPage {
  items: TipListItem[];
  meta: PageMeta;
}

export interface BookmarkResult {
  isBookmarked: boolean;
}

export interface HelpfulResult {
  isHelpful: boolean;
  helpfulCount: number;
}
