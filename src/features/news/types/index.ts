/**
 * News contract — آخر الأخبار. Mirrors the backend `content` module's news DTOs
 * exactly (`server/src/modules/content/domain/news.types.ts`). Public reads +
 * per-user bookmark toggle only; authoring is ADMIN / CONTENT-supervisor via
 * the backend admin API — there is no mobile news-management screen.
 */

export const NEWS_TAGS = ['NORMAL', 'URGENT', 'IMPORTANT_ALERT'] as const;
export type NewsTag = (typeof NEWS_TAGS)[number];

export interface NewsCategoryRef {
  id: string;
  slug: string;
  name: string;
}

/** List-card projection. */
export interface NewsListItem {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  isFeatured: boolean;
  tag: NewsTag;
  category: NewsCategoryRef | null;
  coverImageUrl: string | null;
  bookmarkCount: number;
  isBookmarked: boolean;
  publishedAt: string | null;
}

/** Full detail — adds the sectioned body + attached photos. */
export interface News extends NewsListItem {
  body: string | null;
  reasonPoints: string[];
  advicePoints: string[];
  alertNote: string | null;
  galleryUrls: string[];
  updatedAt: string;
}

export interface NewsListFilter {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  tag?: NewsTag;
  featured?: boolean;
  bookmarked?: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NewsListPage {
  items: NewsListItem[];
  meta: PageMeta;
}

export interface BookmarkResult {
  isBookmarked: boolean;
  bookmarkCount: number;
}
