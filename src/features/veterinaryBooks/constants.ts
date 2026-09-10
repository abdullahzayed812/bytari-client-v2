import type { IconName } from '@/components/content';
import type { ContentSort } from '@/features/content';

/**
 * Veterinary Books category chips (Veterinarian Home → "الكتب البيطرية").
 * The category ROW/NAME always comes from the backend (`content-categories`,
 * matched by slug here) — only the slug ⇄ icon wiring and display order are
 * fixed on the client, exactly like `MAGAZINE_CATEGORY_SLUGS` does for the
 * magazine. Seeded once in `server/src/database/dev-seed/run.ts`.
 */
export const BOOKS_CATEGORY_SLUGS: readonly { slug: string; icon: IconName }[] = [
  { slug: 'book-medicines', icon: 'medkit-outline' },
  { slug: 'book-diseases', icon: 'bandage-outline' },
  { slug: 'book-care', icon: 'heart-outline' },
  { slug: 'book-nutrition', icon: 'nutrition-outline' },
  { slug: 'book-surgery', icon: 'cut-outline' },
];

export const BOOKS_SORT_OPTIONS: readonly { value: ContentSort; icon: IconName }[] = [
  { value: 'latest', icon: 'calendar-outline' },
  { value: 'mostRead', icon: 'stats-chart-outline' },
  { value: 'topRated', icon: 'star-outline' },
];

/** Number of cards shown per home-screen section before "عرض الكل". */
export const BOOKS_SECTION_SIZE = 3;
