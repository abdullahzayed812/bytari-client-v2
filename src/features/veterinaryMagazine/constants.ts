import type { IconName } from '@/components/content';
import type { ContentSort } from '@/features/content';

/**
 * Veterinary Magazine category chips (Veterinarian Home → "المجلة البيطرية").
 * The category ROW/NAME always comes from the backend (`content-categories`,
 * matched by slug here) — only the slug ⇄ icon wiring and display order are
 * fixed on the client, exactly like `CONTENT_TYPE_META` does for the generic
 * Knowledge hub. Seeded once in `server/src/database/dev-seed/run.ts`.
 */
export const MAGAZINE_CATEGORY_SLUGS: readonly { slug: string; icon: IconName }[] = [
  { slug: 'mag-pets', icon: 'paw-outline' },
  { slug: 'mag-livestock', icon: 'file-tray-stacked-outline' },
  { slug: 'mag-poultry', icon: 'egg-outline' },
  { slug: 'mag-diseases', icon: 'medkit-outline' },
];

export const MAGAZINE_SORT_OPTIONS: readonly { value: ContentSort; icon: IconName }[] = [
  { value: 'latest', icon: 'calendar-outline' },
  { value: 'mostRead', icon: 'stats-chart-outline' },
  { value: 'topRated', icon: 'star-outline' },
];

/** Number of cards shown per home-screen section before "عرض الكل". */
export const MAGAZINE_SECTION_SIZE = 3;
