/**
 * Content & Knowledge feature — Mobile Phase 11. The user-facing reading
 * experience for the backend's educational content (articles / books /
 * magazines + their files), against `server/src/modules/content` public routes
 * (`/content`, `/content/:id`, `/content/:id/files/:fileId/download`,
 * `/content-categories`).
 *
 * Read-only: content is authored and published by admins / CONTENT supervisors
 * through the backend admin API — there is NO mobile content-management area, so
 * no create / update / publish / upload screens exist here (documented in
 * MOBILE_ARCHITECTURE.md, not mocked). No R2 credentials anywhere — files are
 * reached only through the backend-authorized download URL.
 */
export { contentApi, contentKeys, type ContentApi } from './api';
export {
  useContentList,
  useContentItem,
  useContentCategories,
  useContentFileUrl,
  type UseContentListParams,
} from './hooks';
export {
  ContentCard,
  ContentCardSkeleton,
  ContentFilters,
  ContentBody,
  ContentFileRow,
  type ContentCardProps,
  type ContentFiltersProps,
  type ContentBodyProps,
  type ContentFileRowProps,
} from './components';
export {
  ContentHomeScreen,
  ContentListScreen,
  ContentDetailScreen,
  ContentFileScreen,
} from './screens';
export {
  CONTENT_TYPE_META,
  CONTENT_TYPE_ORDER,
  CONTENT_FILE_KIND_ICON,
  contentTypeFromSlug,
  contentTypeSlug,
  isViewableMime,
  mimeLabel,
  formatFileSize,
  VIEWABLE_MIME,
} from './constants';
export { contentErrorMessage, type ContentTFn } from './validation/schemas';
export { openExternalUrl, extractLinks } from './openExternal';
export * from './types';
