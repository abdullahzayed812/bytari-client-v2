/**
 * Veterinary Magazine — Veterinarian Home → "المجلة البيطرية". Browse + read
 * `contents` (type=MAGAZINE) articles, organised into latest / most-read /
 * saved sections and per-category lists, with bookmark/like/comment
 * engagement. Built on the shared `@/features/content` API/hooks layer —
 * this feature only adds the Veterinarian-specific presentation (category
 * chip set, card design, section layout) matching the reference UI.
 *
 * Admin authoring lives in `@/features/content/admin`.
 */
export { MAGAZINE_CATEGORY_SLUGS, MAGAZINE_SORT_OPTIONS, MAGAZINE_SECTION_SIZE } from './constants';
export { ArticleCard, ArticleCardSkeleton, type ArticleCardProps } from './components';
export { MagazineHomeScreen, MagazineCategoryScreen, ArticleDetailScreen } from './screens';
