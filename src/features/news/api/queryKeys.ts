import type { NewsListFilter } from '../types';

export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filter: NewsListFilter) => [...newsKeys.lists(), filter] as const,
  featured: () => [...newsKeys.all, 'featured'] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (newsId: string) => [...newsKeys.details(), newsId] as const,
};
