/** Mirrors the server's `SEARCH_TYPES` (`GET /search`). */
export const SEARCH_TYPES = [
  'BOOK',
  'MAGAZINE',
  'PET_STORE_PRODUCT',
  'VET_STORE_PRODUCT',
  'CLINIC',
  'VETERINARY_OFFICE',
  'FARM',
  'SERVICE',
  'COURSE',
  'JOB',
  'NEWS',
  'TIP',
] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchHit {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  meta?: Record<string, string>;
}

export interface SearchGroup {
  type: SearchType;
  items: SearchHit[];
  total: number;
}

export interface SearchResult {
  query: string;
  groups: SearchGroup[];
}
