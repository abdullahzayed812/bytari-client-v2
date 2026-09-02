import type { TipListFilter } from '../types';

export const tipKeys = {
  all: ['tips'] as const,
  lists: () => [...tipKeys.all, 'list'] as const,
  list: (filter: TipListFilter) => [...tipKeys.lists(), filter] as const,
  tipOfDay: () => [...tipKeys.all, 'tip-of-the-day'] as const,
  details: () => [...tipKeys.all, 'detail'] as const,
  detail: (tipId: string) => [...tipKeys.details(), tipId] as const,
};
