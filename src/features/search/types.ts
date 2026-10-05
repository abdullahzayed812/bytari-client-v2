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

/**
 * The application interface a search runs in (server `SEARCH_INTERFACES`).
 * The backend only searches that interface's own sections and refuses the
 * `VETERINARIAN` interface to non-veterinarians.
 */
export type SearchInterface = 'PET_OWNER' | 'VETERINARIAN';

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
  interface?: SearchInterface;
  groups: SearchGroup[];
}
