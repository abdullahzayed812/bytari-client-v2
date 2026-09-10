/**
 * Veterinary content admin — `/admin/content*` + `/admin/content-categories*`
 * management for MAGAZINE & BOOK entries, reached from the Veterinarian
 * interface (`adminVeterinaryContent*` routes). Server-gated by
 * `authorizeContent()` (ADMIN or an approved-vet CONTENT supervisor) — no
 * extra client-side role check needed.
 */
export type {
  AdminCategory,
  AdminContentFile,
  AdminContentItem,
  CreateCategoryInput,
  CreateContentInput,
  UpdateCategoryInput,
  UpdateContentInput,
} from './types';
export * from './api';
export * from './hooks';
export * from './components';
export * from './screens';
