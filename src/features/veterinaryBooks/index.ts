/**
 * Veterinary Books — Veterinarian Home → "الكتب البيطرية". Browse + read
 * `contents` (type=BOOK) entries, organised into all / most-read / favorite
 * sections and per-category lists, with bookmark/like/comment/rating
 * engagement. Built on the shared `@/features/content` API/hooks layer —
 * this feature only adds the Veterinarian-specific presentation (category
 * chip set, card design, section layout) matching the reference UI.
 *
 * Admin authoring lives in `@/features/content/admin`.
 */
export { BOOKS_CATEGORY_SLUGS, BOOKS_SORT_OPTIONS, BOOKS_SECTION_SIZE } from './constants';
export { BookCard, BookCardSkeleton, type BookCardProps } from './components';
export { BooksHomeScreen, BooksCategoryScreen, BookDetailScreen } from './screens';
