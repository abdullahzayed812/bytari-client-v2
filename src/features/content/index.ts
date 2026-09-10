/**
 * Content & Knowledge feature — Mobile Phase 11, extended with self-service
 * engagement (bookmarks / likes / comments / book ratings). The shared,
 * type-agnostic reading + engagement layer for the backend's content
 * (articles / books / magazines + their files), against
 * `server/src/modules/content` public routes (`/content`, `/content/:id`,
 * `/content/:id/files/:fileId/download`, `/content-categories`,
 * `/content/:id/{bookmark,like,comments,rating}`).
 *
 * The Veterinarian-specific "Veterinary Magazine" (`features/veterinaryMagazine`,
 * type=MAGAZINE) and "Veterinary Books" (`features/veterinaryBooks`,
 * type=BOOK) sections build their own UI on top of this shared API/hooks
 * layer. Content is authored and published by admins / CONTENT supervisors
 * through `features/content/admin`, which wires the `/admin/content*` routes.
 * No R2 credentials anywhere — files are reached only through the
 * backend-authorized download / upload-URL routes.
 */
export { contentApi, contentKeys, type ContentApi } from './api';
export {
  useContentList,
  useContentItem,
  useContentCategories,
  useContentFileUrl,
  useToggleContentBookmark,
  useToggleContentLike,
  useContentComments,
  useAddContentComment,
  useDeleteContentComment,
  useContentRating,
  useSubmitContentRating,
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
