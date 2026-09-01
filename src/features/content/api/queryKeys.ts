import type { ContentListFilter } from '../types';

/**
 * Content query keys (§26/§27). Every list key carries its full filter set so
 * an Articles query, a Books query and a search query never overwrite each
 * other's cache.
 *
 *   contentKeys.categories()                 → ['content', 'categories']
 *   contentKeys.list(filter)                 → ['content', 'list', { …filter }]
 *   contentKeys.detail(contentId)            → ['content', 'detail', contentId]
 *   contentKeys.file(contentId, fileId)      → ['content', 'file', contentId, fileId]
 */
export const contentKeys = {
  all: ['content'] as const,
  categories: () => [...contentKeys.all, 'categories'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (filter: Omit<ContentListFilter, 'page'>) => [...contentKeys.lists(), filter] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (contentId: string) => [...contentKeys.details(), contentId] as const,
  file: (contentId: string, fileId: string) =>
    [...contentKeys.all, 'file', contentId, fileId] as const,
};
