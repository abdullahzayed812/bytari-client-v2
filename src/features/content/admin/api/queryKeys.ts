import type { AdminContentListFilter } from '../types';

export const adminContentKeys = {
  all: ['content', 'admin'] as const,
  categories: () => [...adminContentKeys.all, 'categories'] as const,
  lists: () => [...adminContentKeys.all, 'list'] as const,
  list: (filter: Omit<AdminContentListFilter, 'page'>) =>
    [...adminContentKeys.lists(), filter] as const,
  details: () => [...adminContentKeys.all, 'detail'] as const,
  detail: (contentId: string) => [...adminContentKeys.details(), contentId] as const,
  file: (contentId: string, fileId: string) =>
    [...adminContentKeys.all, 'file', contentId, fileId] as const,
};
